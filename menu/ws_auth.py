"""JWT authentication for Django Channels WebSocket connections."""
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken

from django.contrib.auth import get_user_model

User = get_user_model()


@database_sync_to_async
def _user_from_token(token_str: str | None):
    if not token_str:
        return AnonymousUser()
    try:
        token = AccessToken(token_str)
        return User.objects.get(id=token['user_id'])
    except (TokenError, User.DoesNotExist, KeyError):
        return AnonymousUser()


class JwtAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        if scope['type'] == 'websocket':
            raw = scope.get('query_string', b'').decode()
            params = parse_qs(raw)
            token = params.get('token', [None])[0]
            tenant = params.get('tenant', [None])[0]
            scope['tenant_slug'] = tenant
            scope['user'] = await _user_from_token(token)
        return await super().__call__(scope, receive, send)
