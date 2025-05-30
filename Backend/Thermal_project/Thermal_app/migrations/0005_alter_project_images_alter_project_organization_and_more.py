# Generated by Django 5.0.6 on 2024-09-14 08:19

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Thermal_app', '0004_organization_user'),
    ]

    operations = [
        migrations.AlterField(
            model_name='project',
            name='images',
            field=models.ImageField(blank=True, null=True, upload_to='images\\%Y%m'),
        ),
        migrations.AlterField(
            model_name='project',
            name='organization',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='Thermal_app.organization'),
        ),
        migrations.AlterField(
            model_name='project',
            name='report_status',
            field=models.CharField(choices=[('Pending', 'Pending'), ('In Progress', 'In Progress'), ('Completed', 'Completed')], default='Pending'),
        ),
        migrations.AlterField(
            model_name='project',
            name='type_of_survey',
            field=models.CharField(choices=[('Electroluminescence Imaging', 'Electroluminescence Imaging'), ('Thermal Imaging', 'Thermal Imaging')], default='Thermal Imaging', max_length=30),
        ),
        migrations.AlterField(
            model_name='userprofile',
            name='organization',
            field=models.ForeignKey(db_column='organization_id', null=True, on_delete=django.db.models.deletion.CASCADE, to='Thermal_app.organization'),
        ),
    ]
