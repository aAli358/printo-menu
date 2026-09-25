from io import BytesIO

import qrcode
from PIL import Image, ImageDraw
from django.core.files.storage import default_storage


def _load_logo_image(restaurant, box_size: int):
    if not restaurant.logo:
        return None
    try:
        with restaurant.logo.open('rb') as f:
            logo = Image.open(f).convert('RGBA')
    except Exception:
        try:
            with default_storage.open(restaurant.logo.name, 'rb') as f:
                logo = Image.open(f).convert('RGBA')
        except Exception:
            return None
    logo.thumbnail((box_size, box_size), Image.Resampling.LANCZOS)
    return logo


def generate_restaurant_qr_png(restaurant) -> BytesIO:
    """PNG QR for general restaurant menu (no table)."""
    url = restaurant.get_qr_url()
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=12,
        border=2,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color=restaurant.qr_color or '#000000', back_color='white').convert('RGBA')

    logo = _load_logo_image(restaurant, int(img.size[0] * 0.22))
    if logo:
        pos = ((img.size[0] - logo.size[0]) // 2, (img.size[1] - logo.size[1]) // 2)
        img.paste(logo, pos, logo)

    buffer = BytesIO()
    img.convert('RGB').save(buffer, format='PNG')
    buffer.seek(0)
    return buffer


def generate_table_qr_png(restaurant, table_number: str) -> BytesIO:
    """PNG QR with optional centered logo for a table."""
    url = restaurant.get_qr_url(table_id=table_number)
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=12,
        border=2,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color=restaurant.qr_color or '#000000', back_color='white').convert('RGBA')

    logo = _load_logo_image(restaurant, int(img.size[0] * 0.22))
    if logo:
        pos = ((img.size[0] - logo.size[0]) // 2, (img.size[1] - logo.size[1]) // 2)
        img.paste(logo, pos, logo)

    buffer = BytesIO()
    img.convert('RGB').save(buffer, format='PNG')
    buffer.seek(0)
    return buffer


def generate_table_qr_svg(restaurant, table_number: str) -> str:
    """Simple SVG QR (no embedded logo — PNG recommended for print)."""
    url = restaurant.get_qr_url(table_id=table_number)
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=8,
        border=2,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color=restaurant.qr_color or '#000000', back_color='white')
    matrix = img.get_matrix()
    size = len(matrix)
    cell = 8
    svg_size = size * cell
    fill = restaurant.qr_color or '#000000'

    rects = []
    for y, row in enumerate(matrix):
        for x, val in enumerate(row):
            if val:
                rects.append(f'<rect x="{x * cell}" y="{y * cell}" width="{cell}" height="{cell}" fill="{fill}"/>')

    title = f'{restaurant.name} — Table {table_number}'
    return (
        f'<?xml version="1.0" encoding="UTF-8"?>'
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{svg_size}" height="{svg_size + 40}" viewBox="0 0 {svg_size} {svg_size + 40}">'
        f'<rect width="100%" height="100%" fill="white"/>'
        f'<g transform="translate(0,36)">{"".join(rects)}</g>'
        f'<text x="{svg_size/2}" y="24" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" fill="#111">{title}</text>'
        f'</svg>'
    )
