from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('menu', '0016_restaurant_notification_email'),
    ]

    operations = [
        migrations.AlterField(
            model_name='order',
            name='table_number',
            field=models.CharField(blank=True, max_length=50, verbose_name='رقم الطاولة'),
        ),
    ]
