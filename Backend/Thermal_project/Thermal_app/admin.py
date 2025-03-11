from django.contrib import admin
from . import models
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin


@admin.register(models.UserProfile)
class UserAdmin(admin.ModelAdmin):
    list_display = ["name", "email", "user"]
    list_per_page = 20
    list_select_related = ["user", "organization"]
    search_fields = ["name__istartswith"]

    # all options for customization are in django documentation - ModelAdmin page


@admin.register(models.Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ["name"]
    search_fields = ["name__istartswith"]


@admin.register(models.Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ["title", "organization"]
    search_fields = ["title__istartswith"]


@admin.register(models.ProjectImage)
class ProjectImageAdmin(admin.ModelAdmin):
    list_display = ["images", "survey", "date", "geolocation"]
    list_select_related = ["survey"]
    list_editable = ["geolocation"]
    list_per_page = 25


@admin.register(models.Survey)
class SurveyAdmin(admin.ModelAdmin):
    list_display = ["name", "project", "get_organization"]
    list_select_related = ["project", "project__organization"]
    search_fields = ["name__istartswith", "project__title"]

    def get_organization(self, obj):
        return obj.project.organization

    get_organization.short_description = "Organization"


@admin.register(models.SurveyOutputImage)
class SurveyOutputImageAdmin(admin.ModelAdmin):
    list_display = ["images", "date", "survey"]
    list_select_related = ["survey"]


@admin.register(models.Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ["name", "report_file", "survey"]
    list_select_related = ["survey"]
    search_fields = ["name__istartswith", "survey__name"]
    
@admin.register(models.TaskCategory)
class TaskCategoryAdmin(admin.ModelAdmin):
    list_display = ["name"]

@admin.register(models.TaskDetails)
class TaskCategoryAdmin(admin.ModelAdmin):
    list_display = ["name"]

@admin.register(models.SurveyInvoice)
class SurveyInvoiceAdmin(admin.ModelAdmin):
    list_display = ["name", "invoice_file", "survey"]
    list_select_related = ["survey"]
