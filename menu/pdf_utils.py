from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
import qrcode
from io import BytesIO
from reportlab.lib.utils import ImageReader

def generate_table_qrs_pdf(restaurant, table_count=20):
    """
    Generates a PDF containing QR codes for tables 1 to table_count.
    """
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    # Branding
    p.setFont("Helvetica-Bold", 16)
    
    # Layout constants
    qr_size = 8 * cm
    x_margin = (width - qr_size) / 2
    y_gap = 2 * cm
    
    tables_per_page = 2
    
    for i in range(1, table_count + 1):
        if (i - 1) % tables_per_page == 0 and i > 1:
            p.showPage()
            p.setFont("Helvetica-Bold", 16)

        # Calculate Y position (top or bottom half)
        pos_in_page = (i - 1) % tables_per_page
        y_pos = height - (pos_in_page + 1) * (qr_size + y_gap)

        # Header for the table
        p.drawCentredString(width/2, y_pos + qr_size + 0.5 * cm, f"{restaurant.name}")
        p.setFont("Helvetica", 12)
        p.drawCentredString(width/2, y_pos + qr_size, f"Table Number: {i}")

        # Generate QR for this specific table
        # URL Format: https://domain.com/?r=slug&source=qr&table=i
        menu_url = restaurant.get_qr_url(table_id=i)
        
        qr = qrcode.QRCode(version=1, box_size=10, border=2)
        qr.add_data(menu_url)
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color=restaurant.qr_color, back_color="white")
        
        qr_buffer = BytesIO()
        qr_img.save(qr_buffer, format="PNG")
        qr_buffer.seek(0)
        
        # Draw QR on PDF
        p.drawImage(ImageReader(qr_buffer), x_margin, y_pos, width=qr_size, height=qr_size)
        
        # Instruction
        p.setFont("Helvetica-Oblique", 10)
        p.drawCentredString(width/2, y_pos - 0.5 * cm, "Scan to view menu and order")
        
        # Reset font for next item
        p.setFont("Helvetica-Bold", 16)

    p.save()
    buffer.seek(0)
    return buffer
