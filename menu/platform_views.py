from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .platform_branding import build_public_platform_branding


class PlatformBrandingPublicView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        branding = build_public_platform_branding(request)
        if not branding:
            return Response({'show': False})
        return Response(branding)
