def format_order_for_whatsapp(order):
    """
    Formats an Order object into a clean, readable text message for WhatsApp.
    """
    currency = order.tenant.currency_code
    message = f"*طلب جديد #{order.id}*\n"
    message += f"--------------------------\n"
    if order.table_number:
        message += f"📍 *رقم الطاولة:* {order.table_number}\n"
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
