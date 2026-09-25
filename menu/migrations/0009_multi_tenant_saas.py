# Generated manually for multi-tenant SaaS migration

from django.db import migrations, models
import django.db.models.deletion


def populate_menuitem_tenant(apps, schema_editor):
    MenuItem = apps.get_model('menu', 'MenuItem')
    Category = apps.get_model('menu', 'Category')
    for item in MenuItem.objects.select_related('category').iterator():
        if item.category_id:
            item.tenant_id = Category.objects.filter(pk=item.category_id).values_list('tenant_id', flat=True).first()
            item.save(update_fields=['tenant_id'])


class Migration(migrations.Migration):

    dependencies = [
        ('menu', '0008_restaurant_menu_theme'),
    ]

    operations = [
        migrations.AddField(
            model_name='restaurant',
            name='subscription_expires_at',
            field=models.DateTimeField(blank=True, null=True, verbose_name='انتهاء الاشتراك'),
        ),
        migrations.AddField(
            model_name='restaurant',
            name='subscription_plan',
            field=models.CharField(blank=True, default='basic', max_length=50, verbose_name='خطة الاشتراك'),
        ),
        migrations.AddField(
            model_name='restaurant',
            name='subscription_status',
            field=models.CharField(
                choices=[('trial', 'تجريبي'), ('active', 'نشط'), ('suspended', 'موقوف'), ('cancelled', 'ملغي')],
                db_index=True,
                default='trial',
                max_length=20,
                verbose_name='حالة الاشتراك',
            ),
        ),
        migrations.RenameField(
            model_name='category',
            old_name='restaurant',
            new_name='tenant',
        ),
        migrations.RenameField(
            model_name='openinghours',
            old_name='restaurant',
            new_name='tenant',
        ),
        migrations.RenameField(
            model_name='order',
            old_name='restaurant',
            new_name='tenant',
        ),
        migrations.RenameField(
            model_name='tablecall',
            old_name='restaurant',
            new_name='tenant',
        ),
        migrations.AlterUniqueTogether(
            name='openinghours',
            unique_together={('tenant', 'day')},
        ),
        migrations.AddField(
            model_name='menuitem',
            name='tenant',
            field=models.ForeignKey(
                db_column='tenant_id',
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='menu_items',
                to='menu.restaurant',
                verbose_name='المطعm (Tenant)',
            ),
        ),
        migrations.RunPython(populate_menuitem_tenant, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='menuitem',
            name='tenant',
            field=models.ForeignKey(
                db_column='tenant_id',
                on_delete=django.db.models.deletion.CASCADE,
                related_name='menu_items',
                to='menu.restaurant',
                verbose_name='المطعm (Tenant)',
            ),
        ),
        migrations.CreateModel(
            name='RestaurantTable',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('number', models.CharField(max_length=10, verbose_name='رقم الطاولة')),
                ('label', models.CharField(blank=True, max_length=50, verbose_name='تسمية')),
                ('is_active', models.BooleanField(default=True, verbose_name='نشط')),
                ('tenant', models.ForeignKey(
                    db_column='tenant_id',
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='tables',
                    to='menu.restaurant',
                    verbose_name='المطعm (Tenant)',
                )),
            ],
            options={
                'verbose_name': 'طاولة',
                'verbose_name_plural': 'الطاولات',
                'unique_together': {('tenant', 'number')},
            },
        ),
        migrations.AddIndex(
            model_name='restaurant',
            index=models.Index(fields=['slug'], name='menu_restau_slug_idx'),
        ),
        migrations.AddIndex(
            model_name='restaurant',
            index=models.Index(fields=['is_active', 'subscription_status'], name='menu_restau_active_sub_idx'),
        ),
        migrations.AddIndex(
            model_name='menuitem',
            index=models.Index(fields=['tenant', 'is_available'], name='menu_menuit_tenant_avail_idx'),
        ),
        migrations.AddIndex(
            model_name='order',
            index=models.Index(fields=['tenant', 'status'], name='menu_order_tenant_status_idx'),
        ),
        migrations.AddIndex(
            model_name='restauranttable',
            index=models.Index(fields=['tenant', 'is_active'], name='menu_resttab_tenant_active_idx'),
        ),
    ]
