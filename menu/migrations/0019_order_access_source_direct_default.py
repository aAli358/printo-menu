from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('menu', '0018_restauranttable_capacity_status'),
    ]

    operations = [
        migrations.AlterField(
            model_name='order',
            name='access_source',
            field=models.CharField(
                blank=True,
                choices=[('qr', 'QR'), ('nfc', 'NFC'), ('direct', 'مباشر')],
                default='direct',
                max_length=10,
                verbose_name='المصدر',
            ),
        ),
    ]
