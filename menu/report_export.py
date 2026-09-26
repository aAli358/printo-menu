"""Export tenant analytics to PDF / Excel."""
from io import BytesIO

from django.http import HttpResponse
from openpyxl import Workbook
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

from .analytics_service import build_tenant_analytics


def build_sales_excel(user, period: str = 'week') -> bytes:
    data = build_tenant_analytics(user, period)
    wb = Workbook()
    ws = wb.active
    ws.title = 'Sales'
    ws.append(['Period', period])
    ws.append(['Revenue', data['revenue']])
    ws.append(['Orders', data['order_count']])
    ws.append([])
    ws.append(['Date', 'Revenue', 'Count'])
    for row in data['sales_by_day']:
        ws.append([row['date'], row['revenue'], row['count']])
    ws2 = wb.create_sheet('Best sellers')
    ws2.append(['Item', 'Qty', 'Revenue'])
    for row in data['best_sellers']:
        ws2.append([row['name'], row['quantity'], row['revenue']])
    buf = BytesIO()
    wb.save(buf)
    return buf.getvalue()


def build_sales_pdf(user, period: str = 'week') -> bytes:
    data = build_tenant_analytics(user, period)
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    width, height = A4
    y = height - 50
    c.setFont('Helvetica-Bold', 14)
    c.drawString(50, y, f'Sales Report ({period})')
    y -= 30
    c.setFont('Helvetica', 11)
    c.drawString(50, y, f"Revenue: {data['revenue']}")
    y -= 18
    c.drawString(50, y, f"Orders: {data['order_count']}")
    y -= 24
    c.drawString(50, y, 'Top items:')
    y -= 18
    for item in data['best_sellers'][:15]:
        if y < 60:
            c.showPage()
            y = height - 50
        c.drawString(60, y, f"- {item['name']}: {item['quantity']} ({item['revenue']})")
        y -= 16
    c.save()
    return buf.getvalue()


def analytics_export_response(user, fmt: str, period: str) -> HttpResponse:
    if fmt == 'xlsx':
        content = build_sales_excel(user, period)
        response = HttpResponse(
            content,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        response['Content-Disposition'] = f'attachment; filename="sales-{period}.xlsx"'
        return response
    content = build_sales_pdf(user, period)
    response = HttpResponse(content, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="sales-{period}.pdf"'
    return response
