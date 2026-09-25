from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('menu', '0007_restaurant_access_mode'),
    ]

    operations = [
        migrations.AddField(
            model_name='restaurant',
            name='menu_theme',
            field=models.CharField(
                choices=[
                    ('modern-indigo', 'عصري بنفسجي'),
                    ('classic-gold', 'فاخر ذهبي'),
                    ('emerald-fresh', 'أخضر طازج'),
                    ('rose-boutique', 'وردي بوتيك'),
                    ('ocean-blue', 'أزرق بحري'),
                    ('sunset-warm', 'غروب دافئ'),
                    ('midnight-lounge', 'Lounge ليلي'),
                    ('minimal-mono', 'Minimal أبيض'),
                    ('arabesque', 'عراقي تراثي'),
                    ('coffee-roast', 'قهوة داكنة'),
                ],
                default='modern-indigo',
                max_length=30,
                verbose_name='ثيم المنيو',
            ),
        ),
    ]
