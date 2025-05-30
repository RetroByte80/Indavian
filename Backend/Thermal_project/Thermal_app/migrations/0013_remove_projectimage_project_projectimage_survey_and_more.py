# Generated by Django 5.0.6 on 2024-10-11 06:45

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Thermal_app', '0012_remove_report_project_report_survey'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='projectimage',
            name='project',
        ),
        migrations.AddField(
            model_name='projectimage',
            name='survey',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='Thermal_app.survey'),
        ),
        migrations.AlterField(
            model_name='projectimage',
            name='images',
            field=models.ImageField(blank=True, null=True, upload_to='survey images'),
        ),
    ]
