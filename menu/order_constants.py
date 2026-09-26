"""Labels and helpers for public order creation."""

DIRECT_ORDER_TABLE_LABEL = 'طلب مباشر / سفري'


def normalize_order_table_number(raw_value) -> str:
    """Return trimmed table id or direct/takeaway label when empty."""
    if raw_value is None:
        return DIRECT_ORDER_TABLE_LABEL
    text = str(raw_value).strip()
    return text if text else DIRECT_ORDER_TABLE_LABEL
