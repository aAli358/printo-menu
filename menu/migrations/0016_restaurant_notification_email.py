from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('menu', '0015_staff_inventory_features'),
    ]

    operations = [
        migrations.AddField(
            model_name='restaurant',
            name='notification_email',
            field=models.EmailField(
                blank=True,
                help_text='Z-Report والتنبيهات؛ إن تُرك فارغاً يُستخدم إيميل المالك.',
                max_length=254,
                null=True,
                verbose_name='بريد التقارير والإشعارات',
            ),
        ),
    ]
