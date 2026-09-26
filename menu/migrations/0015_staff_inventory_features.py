from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('menu', '0014_alter_restaurant_options_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='menuitem',
            name='low_stock_threshold',
            field=models.PositiveIntegerField(default=5, verbose_name='حد تنبيه المخزون'),
        ),
        migrations.AddField(
            model_name='menuitem',
            name='stock_quantity',
            field=models.PositiveIntegerField(
                blank=True, help_text='اتركه فارغاً إذا لا تريد تتبع المخزون.', null=True,
                verbose_name='الكمية المتوفرة',
            ),
        ),
        migrations.CreateModel(
            name='RestaurantStaff',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('role', models.CharField(
                    choices=[('waiter', 'جرسون'), ('kitchen', 'مطبخ'), ('cashier', 'كاشير')],
                    max_length=20, verbose_name='الدور',
                )),
                ('tenant', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE, related_name='staff_members',
                    to='menu.restaurant', verbose_name='المطعm',
                )),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE, related_name='restaurant_staff_roles',
                    to=settings.AUTH_USER_MODEL, verbose_name='المستخدم',
                )),
            ],
            options={
                'verbose_name': 'عضو طاقm',
                'verbose_name_plural': 'طاقm المطعm',
                'unique_together': {('tenant', 'user')},
            },
        ),
    ]
