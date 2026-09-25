import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from .kitchen_broadcast import kitchen_group_name
from .permissions import get_user_tenants


@database_sync_to_async
def _resolve_tenant(user, slug: str | None):
    qs = get_user_tenants(user)
    if slug:
        return qs.filter(slug=slug).first()
    return qs.first()


class KitchenConsumer(AsyncWebsocketConsumer):
    group_name: str | None = None

    async def connect(self):
        user = self.scope.get('user')
        if not user or not getattr(user, 'is_authenticated', False):
            await self.close(code=4401)
            return

        tenant = await _resolve_tenant(user, self.scope.get('tenant_slug'))
        if not tenant:
            await self.close(code=4403)
            return

        self.group_name = kitchen_group_name(tenant.id)
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        await self.send(text_data=json.dumps({
            'event': 'connected',
            'payload': {'tenant_slug': tenant.slug},
        }))

    async def disconnect(self, close_code):
        if self.group_name:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def kitchen_event(self, event):
        await self.send(text_data=json.dumps({
            'event': event['event'],
            'payload': event.get('payload', {}),
        }))

    async def receive(self, text_data=None, bytes_data=None):
        if text_data == 'ping':
            await self.send(text_data=json.dumps({'event': 'pong', 'payload': {}}))
