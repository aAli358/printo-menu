"""Test all 10 menu themes via API + DB update."""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.test import Client
from menu.models import Restaurant

THEMES = [
    'modern-indigo', 'classic-gold', 'emerald-fresh', 'rose-boutique', 'ocean-blue',
    'sunset-warm', 'midnight-lounge', 'minimal-mono', 'arabesque', 'coffee-roast',
]

rest = Restaurant.objects.filter(slug='shams').first() or Restaurant.objects.first()
if not rest:
    print('FAIL: No restaurant found')
    sys.exit(1)

c = Client()
original = rest.menu_theme
failed = []

print(f'\n=== Theme QA for {rest.slug} ===\n')
for theme in THEMES:
    rest.menu_theme = theme
    rest.save(update_fields=['menu_theme'])
    r = c.get(f'/api/v1/restaurants/{rest.slug}/public_menu/', HTTP_X_TENANT_SLUG=rest.slug)
    if r.status_code != 200:
        failed.append((theme, f'HTTP {r.status_code}'))
        print(f'  FAIL {theme}: HTTP {r.status_code}')
        continue
    data = r.json()
    if data.get('menu_theme') != theme:
        failed.append((theme, f"API returned {data.get('menu_theme')}"))
        print(f'  FAIL {theme}: theme mismatch')
        continue
    cats = len(data.get('categories', []))
    items = sum(len(c.get('items', [])) for c in data.get('categories', []))
    print(f'  OK  {theme:18} — {cats} categories, {items} items')

rest.menu_theme = original
rest.save(update_fields=['menu_theme'])
print(f'\nRestored theme to: {original}')
print(f'\n=== {len(THEMES) - len(failed)}/{len(THEMES)} themes OK ===\n')
if failed:
    for t, d in failed:
        print(f'  - {t}: {d}')
    sys.exit(1)
