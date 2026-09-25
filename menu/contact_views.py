from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import EnterpriseContact
from .emails import send_enterprise_contact_notification


class EnterpriseContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = EnterpriseContact
        fields = ['name', 'email', 'phone', 'company', 'message', 'plan']
        extra_kwargs = {
            'plan': {'required': False},
            'phone': {'required': False, 'allow_blank': True},
            'company': {'required': False, 'allow_blank': True},
        }


class ContactView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = EnterpriseContactSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        contact = serializer.save(plan='enterprise')
        send_enterprise_contact_notification(contact)
        return Response({
            'success': True,
            'message': 'تم استلام طلبك — سنتواصل معك قريباً.',
            'id': contact.id,
        }, status=status.HTTP_201_CREATED)
