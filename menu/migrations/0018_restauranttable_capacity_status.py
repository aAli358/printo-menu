from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('menu', '0017_alter_order_table_number'),
    ]

    operations = [
        migrations.AddField(
            model_name='restauranttable',
            name='capacity',
            field=models.PositiveIntegerField(default=4, verbose_name='السعة (أشخاص)'),
        ),
        migrations.AddField(
            model_name='restauranttable',
            name='status',
            field=models.CharField(
                choices=[('available', 'متاحة'), ('occupied', 'مشغولة'), ('reserved', 'محجوزة')],
                default='available',
                max_length=20,
                verbose_name='حالة الطاولة',
            ),
        ),
        migrations.AlterField(
            model_name='restauranttable',
            name='number',
            field=models.CharField(max_length=20, verbose_name='رقم الطاولة'),
        ),
    ]
