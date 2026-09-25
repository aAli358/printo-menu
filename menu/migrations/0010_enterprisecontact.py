# Generated migration for EnterpriseContact

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('menu', '0009_multi_tenant_saas'),
    ]

    operations = [
        migrations.CreateModel(
            name='EnterpriseContact',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255, verbose_name='الاسم')),
                ('email', models.EmailField(max_length=254, verbose_name='البريد')),
                ('phone', models.CharField(blank=True, max_length=30, verbose_name='الهاتف')),
                ('company', models.CharField(blank=True, max_length=255, verbose_name='اسم المؤسسة / المطعm')),
                ('message', models.TextField(verbose_name='الرسالة')),
                ('plan', models.CharField(choices=[('enterprise', 'مؤسسات')], default='enterprise', max_length=30, verbose_name='الخطة')),
                ('is_handled', models.BooleanField(default=False, verbose_name='تمت المعالجة')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='تاريخ الطلب')),
            ],
            options={
                'verbose_name': 'طلب خطة مؤسسات',
                'verbose_name_plural': 'طلبات الخطط المؤسسية',
                'ordering': ['-created_at'],
            },
        ),
    ]
