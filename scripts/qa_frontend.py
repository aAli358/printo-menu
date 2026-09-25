"""Frontend + theme browserless QA via HTTP."""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

import urllib.request
import urllib.error
import json
from menu.models import Restaurant

FRONTEND = 'http://127.0.0.1:5173'
BACKEND = 'http://127.0.0.1:8000'
THEMES = [
    'modern-indigo', 'classic-gold', 'emerald-fresh', 'rose-boutique', 'ocean-blue',
    'sunset-warm', 'midnight-lounge', 'minimal-mono', 'arabesque', 'coffee-roast',
]
PAGES = ['/', '/login', '/r/shams?table=1', '/kitchen', '/dashboard']


def get(url, *, tenant_slug=None, max_bytes=None):
    headers = {'User-Agent': 'E-Menu-QA/1.0'}
    if tenant_slug:
        headers['X-Tenant-Slug'] = tenant_slug
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            body = r.read() if max_bytes is None else r.read(max_bytes)
            return r.status, body
    except urllib.error.HTTPError as e:
        body = e.read() if max_bytes is None else e.read(max_bytes)
        return e.code, body
    except Exception as e:
        return 0, str(e).encode()


print('\n=== Frontend Page Load Test ===\n')
page_fail = 0
for path in PAGES:
    status, body = get(FRONTEND + path, max_bytes=8000)
    ok = status == 200 and b'root' in body.lower()
    print(f'  {"OK" if ok else "FAIL":4} {path} -> HTTP {status}')
    if not ok:
        page_fail += 1

print('\n=== Theme API + Frontend (per theme) ===\n')
rest = Restaurant.objects.filter(slug='shams').first()
if not rest:
    print('FAIL: no shams restaurant')
    sys.exit(1)
original = rest.menu_theme
theme_fail = 0
for theme in THEMES:
    rest.menu_theme = theme
    rest.save(update_fields=['menu_theme'])
    api_status, api_body = get(
        f'{BACKEND}/api/v1/restaurants/shams/public_menu/',
        tenant_slug='shams',
    )
    fe_status, fe_body = get(f'{FRONTEND}/r/shams?table=1', max_bytes=8000)
    try:
        data = json.loads(api_body)
        api_ok = data.get('menu_theme') == theme
    except Exception:
        api_ok = False
    fe_ok = fe_status == 200 and b'root' in fe_body.lower()
    ok = api_ok and fe_ok
    print(f'  {"OK" if ok else "FAIL":4} {theme:18} api={api_status} theme_match={api_ok} fe={fe_status}')
    if not ok:
        theme_fail += 1

rest.menu_theme = original
rest.save(update_fields=['menu_theme'])

print(f'\n=== Summary: pages failed={page_fail}, themes failed={theme_fail} ===\n')
sys.exit(1 if page_fail or theme_fail else 0)
