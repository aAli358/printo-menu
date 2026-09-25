from io import BytesIO

import barcode
from barcode.writer import ImageWriter
from PIL import Image, ImageDraw, ImageFont


def _write_barcode_image(data: str, label: str = '') -> BytesIO:
    code = barcode.get('code128', data, writer=ImageWriter())
    buffer = BytesIO()
    code.write(buffer, options={
        'module_height': 12,
        'module_width': 0.35,
        'font_size': 9,
        'text_distance': 4,
        'quiet_zone': 4,
    })
    buffer.seek(0)

    if not label:
        return buffer

    img = Image.open(buffer).convert('RGB')
    pad = 28
    canvas = Image.new('RGB', (img.width, img.height + pad), 'white')
    canvas.paste(img, (0, 0))
    draw = ImageDraw.Draw(canvas)
    try:
        font = ImageFont.truetype('arial.ttf', 14)
    except OSError:
        font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), label, font=font)
    tw = bbox[2] - bbox[0]
    draw.text(((canvas.width - tw) // 2, img.height + 4), label, fill='#111', font=font)
    out = BytesIO()
    canvas.save(out, format='PNG')
    out.seek(0)
    return out


def generate_table_barcode_png(restaurant, table_number: str) -> BytesIO:
    url = restaurant.get_qr_url(table_id=table_number)
    label = f'{restaurant.name} — Table {table_number}'
    return _write_barcode_image(url, label)


def generate_restaurant_barcode_png(restaurant) -> BytesIO:
    url = restaurant.get_qr_url()
    label = restaurant.name
    return _write_barcode_image(url, label)
