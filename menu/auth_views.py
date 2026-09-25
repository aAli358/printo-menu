from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import secrets

from .models import Restaurant, AuthHandoff
from .permissions import get_user_tenants
from .emails import send_welcome_email

User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField(required=False, allow_blank=True)
    password = serializers.CharField(min_length=8, write_only=True)
    restaurant_name = serializers.CharField(max_length=255)
    restaurant_name_en = serializers.CharField(max_length=255, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError('Username already taken.')
        return value

    @transaction.atomic
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
        )
        restaurant = Restaurant.objects.create(
            owner=user,
            name=validated_data['restaurant_name'],
            name_en=validated_data.get('restaurant_name_en', ''),
            phone=validated_data.get('phone', ''),
            subscription_status='trial',
            subscription_plan='basic',
            subscription_expires_at=timezone.now() + timedelta(days=14),
        )
        return user, restaurant


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user, restaurant = serializer.save()

        send_welcome_email(user, restaurant)

        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_superuser': user.is_superuser,
            },
            'restaurant': {
                'id': restaurant.id,
                'name': restaurant.name,
                'slug': restaurant.slug,
                'subscription_status': restaurant.subscription_status,
                'subscription_expires_at': restaurant.subscription_expires_at.isoformat() if restaurant.subscription_expires_at else None,
                'trial_days': 14,
            },
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
        }, status=status.HTTP_201_CREATED)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenants = get_user_tenants(request.user)
        return Response({
            'user': {
                'id': request.user.id,
                'username': request.user.username,
                'email': request.user.email,
                'is_superuser': request.user.is_superuser,
            },
            'restaurants': [
                {
                    'id': r.id,
                    'name': r.name,
                    'name_en': r.name_en,
                    'slug': r.slug,
                    'logo': request.build_absolute_uri(r.logo.url) if r.logo else None,
                    'subscription_status': r.subscription_status,
                }
                for r in tenants
            ],
        })


class TenantTokenObtainPairView(TokenObtainPairView):
    permission_classes = [AllowAny]


class AuthHandoffCreateView(APIView):
    """Create a one-time code for secure cross-subdomain login handoff."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        access = request.data.get('access')
        refresh = request.data.get('refresh')
        user_data = request.data.get('user')
        restaurants_data = request.data.get('restaurants', [])
        if not access or not refresh or not user_data:
            return Response({'detail': 'access, refresh, and user are required.'}, status=status.HTTP_400_BAD_REQUEST)

        ttl = getattr(settings, 'AUTH_HANDOFF_TTL_SECONDS', 120)
        code = secrets.token_urlsafe(32)
        AuthHandoff.objects.create(
            code=code,
            access_token=access,
            refresh_token=refresh,
            user_data=user_data,
            restaurants_data=restaurants_data,
            expires_at=timezone.now() + timedelta(seconds=ttl),
        )
        return Response({'code': code, 'expires_in': ttl})


class AuthHandoffConsumeView(APIView):
    """Exchange one-time handoff code for session tokens (single use)."""
    permission_classes = [AllowAny]

    def post(self, request):
        code = request.data.get('code')
        if not code:
            return Response({'detail': 'code is required.'}, status=status.HTTP_400_BAD_REQUEST)

        handoff = AuthHandoff.objects.filter(code=code, expires_at__gt=timezone.now()).first()
        if not handoff:
            return Response({'detail': 'Invalid or expired handoff code.'}, status=status.HTTP_404_NOT_FOUND)

        payload = {
            'access': handoff.access_token,
            'refresh': handoff.refresh_token,
            'user': handoff.user_data,
            'restaurants': handoff.restaurants_data,
        }
        handoff.delete()
        return Response(payload)
