"""Push real-time kitchen events to tenant WebSocket groups."""
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def kitchen_group_name(tenant_id: int) -> str:
    return f'kitchen_tenant_{tenant_id}'


def broadcast_kitchen_event(tenant_id: int, event: str, payload: dict | None = None) -> None:
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return
    async_to_sync(channel_layer.group_send)(
        kitchen_group_name(tenant_id),
        {
            'type': 'kitchen.event',
            'event': event,
            'payload': payload or {},
        },
    )
