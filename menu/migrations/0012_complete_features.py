from django.db import migrations, models
import django.core.validators
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('menu', '0011_platform_branding'),
    ]

    operations = [
        migrations.CreateModel(
            name='AuthHandoff',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(db_index=True, max_length=64, unique=True)),
                ('access_token', models.TextField()),
                ('refresh_token', models.TextField()),
                ('user_data', models.JSONField()),
                ('restaurants_data', models.JSONField(default=list)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('expires_at', models.DateTimeField(db_index=True)),
            ],
            options={
                'verbose_name': 'رمز تسليم الجلسة',
                'verbose_name_plural': 'رموز تسليم الجلسة',
            },
        ),
        migrations.CreateModel(
            name='ExperienceReview',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('rating', models.PositiveIntegerField(
                    validators=[
                        django.core.validators.MinValueValidator(1),
                        django.core.validators.MaxValueValidator(5),
                    ],
                    verbose_name='التقييم (1-5)',
                )),
                ('comment', models.TextField(blank=True, verbose_name='التعليق')),
                ('table_number', models.CharField(blank=True, max_length=20, verbose_name='رقم الطاولة')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='التاريخ')),
                ('tenant', models.ForeignKey(
                    db_column='tenant_id',
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='experience_reviews',
                    to='menu.restaurant',
                    verbose_name='المطعm (Tenant)',
                )),
            ],
            options={
                'verbose_name': 'تقييم تجربة',
                'verbose_name_plural': 'تقييمات التجربة',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='category',
            index=models.Index(fields=['tenant', 'order'], name='menu_catego_tenant__a1b2c3_idx'),
        ),
        migrations.AddIndex(
            model_name='category',
            index=models.Index(fields=['tenant', 'is_active'], name='menu_catego_tenant__d4e5f6_idx'),
        ),
        migrations.AddIndex(
            model_name='authhandoff',
            index=models.Index(fields=['expires_at'], name='menu_authha_expires_7g8h9i_idx'),
        ),
        migrations.AddIndex(
            model_name='experiencereview',
            index=models.Index(fields=['tenant', '-created_at'], name='menu_experi_tenant__j1k2l3_idx'),
        ),
    ]
