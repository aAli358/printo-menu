from django.db import migrations, models
import django.core.validators
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('menu', '0012_complete_features'),
    ]

    operations = [
        migrations.AddField(
            model_name='restaurant',
            name='custom_domain',
            field=models.CharField(blank=True, help_text='مثال: menu.alshams.com', max_length=255, null=True, unique=True, verbose_name='دومين مخصص'),
        ),
        migrations.AddField(
            model_name='restaurant',
            name='landing_theme',
            field=models.CharField(choices=[('default', 'افتراضي'), ('luxury', 'فاخر'), ('minimal', 'Minimal'), ('heritage', 'تراثي')], default='default', max_length=30, verbose_name='ثيم Landing'),
        ),
        migrations.AddField(
            model_name='restaurant',
            name='latitude',
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True, verbose_name='خط العرض'),
        ),
        migrations.AddField(
            model_name='restaurant',
            name='longitude',
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True, verbose_name='خط الطول'),
        ),
        migrations.AddField(
            model_name='order',
            name='coupon_code',
            field=models.CharField(blank=True, max_length=50, verbose_name='كود الكوبون'),
        ),
        migrations.AddField(
            model_name='order',
            name='discount_amount',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10, verbose_name='قيمة الخصم'),
        ),
        migrations.AddField(
            model_name='order',
            name='completed_at',
            field=models.DateTimeField(blank=True, null=True, verbose_name='اكتمال الطلب'),
        ),
        migrations.AddField(
            model_name='order',
            name='preparing_at',
            field=models.DateTimeField(blank=True, null=True, verbose_name='بدء التحضير'),
        ),
        migrations.AddField(
            model_name='order',
            name='ready_at',
            field=models.DateTimeField(blank=True, null=True, verbose_name='جاهز للتسليم'),
        ),
        migrations.CreateModel(
            name='Promotion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('promo_type', models.CharField(choices=[('happy_hour', 'Happy Hour'), ('category_discount', 'خصم على قسم'), ('buy_x_get_y', 'اشترِ X واحصل على Y'), ('coupon', 'كوبون')], max_length=30)),
                ('discount_percent', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('discount_amount', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('buy_quantity', models.PositiveIntegerField(blank=True, null=True)),
                ('get_quantity', models.PositiveIntegerField(blank=True, null=True)),
                ('coupon_code', models.CharField(blank=True, db_index=True, max_length=50)),
                ('start_time', models.TimeField(blank=True, null=True)),
                ('end_time', models.TimeField(blank=True, null=True)),
                ('days_of_week', models.JSONField(blank=True, default=list)),
                ('valid_from', models.DateTimeField(blank=True, null=True)),
                ('valid_until', models.DateTimeField(blank=True, null=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('category', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='promotions', to='menu.category')),
                ('tenant', models.ForeignKey(db_column='tenant_id', on_delete=django.db.models.deletion.CASCADE, related_name='promotions', to='menu.restaurant')),
            ],
            options={
                'verbose_name': 'عرض / خصم',
                'verbose_name_plural': 'العروض والخصومات',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='TableReservation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('customer_name', models.CharField(max_length=255)),
                ('customer_phone', models.CharField(max_length=20)),
                ('party_size', models.PositiveIntegerField(default=2)),
                ('reserved_at', models.DateTimeField()),
                ('table_number', models.CharField(blank=True, max_length=10)),
                ('status', models.CharField(choices=[('pending', 'قيد الانتظار'), ('confirmed', 'مؤكد'), ('cancelled', 'ملغى'), ('completed', 'مكتمل')], default='pending', max_length=20)),
                ('notes', models.TextField(blank=True)),
                ('whatsapp_notified', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('tenant', models.ForeignKey(db_column='tenant_id', on_delete=django.db.models.deletion.CASCADE, related_name='reservations', to='menu.restaurant')),
            ],
            options={
                'verbose_name': 'حجز طاولة',
                'verbose_name_plural': 'حجوزات الطاولات',
                'ordering': ['reserved_at'],
            },
        ),
        migrations.CreateModel(
            name='WaitlistEntry',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('customer_name', models.CharField(max_length=255)),
                ('customer_phone', models.CharField(max_length=20)),
                ('party_size', models.PositiveIntegerField(default=2)),
                ('status', models.CharField(choices=[('waiting', 'بالانتظار'), ('seated', 'تم الجلوس'), ('cancelled', 'ملغى')], default='waiting', max_length=20)),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('tenant', models.ForeignKey(db_column='tenant_id', on_delete=django.db.models.deletion.CASCADE, related_name='waitlist_entries', to='menu.restaurant')),
            ],
            options={
                'verbose_name': 'قائمة انتظار',
                'verbose_name_plural': 'قوائم الانتظار',
                'ordering': ['created_at'],
            },
        ),
    ]
