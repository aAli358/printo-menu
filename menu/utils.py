def menu_item_max_unit_price(menu_item) -> float:
    """Upper bound for one unit including largest variant and all paid addons."""
    base = float(menu_item.base_price)
    variant_prices = [float(v.price) for v in menu_item.variants.all()]
    unit = max(variant_prices) if variant_prices else base
    addon_total = 0.0
    for group in menu_item.addon_groups.all():
        addon_total += sum(float(a.price) for a in group.addons.all())
    return unit + addon_total


def format_order_for_whatsapp(order):
    """
    Formats an Order object into a clean, readable text message for WhatsApp.
    """
    currency = order.tenant.currency_code
    message = f"*طلب جديد #{order.id}*\n"
    message += f"--------------------------\n"
    from .order_constants import DIRECT_ORDER_TABLE_LABEL

    if order.table_number and order.table_number != DIRECT_ORDER_TABLE_LABEL:
        message += f"📍 *رقم الطاولة:* {order.table_number}\n"
    elif order.table_number:
        message += f"📍 *نوع الطلب:* {DIRECT_ORDER_TABLE_LABEL}\n"
    if order.customer_name:
        message += f"👤 *الزبون:* {order.customer_name}\n"

    message += f"\n*الأصناف:*\n"

    for item in order.items.all():
        message += f"• {item.quantity}x {item.menu_item.name}"
        if item.modifiers_text:
            message += f" ({item.modifiers_text})"
        message += f" - {item.price * item.quantity} {currency}\n"

    message += f"--------------------------\n"
    message += f"💰 *الإجمالي:* {order.total_amount} {currency}\n"
    message += f"--------------------------\n"
    message += f"شكراً لطلبكم من {order.tenant.name} ✨"

    return message


def build_customer_order_status_whatsapp(order, new_status: str) -> str | None:
    """WhatsApp link to notify customer about order status (wa.me customer phone)."""
    phone = (order.customer_phone or '').strip().replace('+', '').replace(' ', '')
    if not phone:
        return None
    labels = {
        'preparing': '⏳ طلبك قيد التحضير',
        'ready': '✅ طلبك جاهز للتسليم',
        'completed': '🎉 تم تسليم طلبك — شكراً لزيارتكم',
        'cancelled': '❌ تم إلغاء الطلب',
    }
    label = labels.get(new_status, f'تحديث حالة الطلب: {new_status}')
    msg = f"*{order.tenant.name}*\n{label}\n🆔 رقم الطلب: #{order.id}"
    if order.table_number:
        msg += f"\n📍 طاولة: {order.table_number}"
    import urllib.parse
    return f"https://wa.me/{phone}?text={urllib.parse.quote(msg)}"
