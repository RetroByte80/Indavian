from email.policy import default
from re import T
from django.db import models
from django.contrib.auth.models import User
from matplotlib import category
from sympy import true
from torch import mode


class Organization(models.Model):
    name = models.CharField(max_length=200, unique=True)
    user = models.OneToOneField(User, on_delete=models.RESTRICT)

    def __str__(self) -> str:
        return self.name


class UserProfile(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(max_length=150, unique=True)
    phone = models.CharField(max_length=15)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, db_column="organization_id", null=True
    )

    USERNAME_FIELD = "username"

    def __str__(self) -> str:
        return self.name

    class Meta:
        ordering = ["name"]


class Project(models.Model):
    SURVEY_TYPES = {
        "Electroluminescence Imaging": "Electroluminescence Imaging",
        "Thermal Imaging": "Thermal Imaging",
    }

    STATUS = {
        "Pending": "Pending",
        "In Progress": "In Progress",
        "Completed": "Completed",
    }

    title = models.CharField(max_length=200)
    location = models.CharField(
        max_length=150, help_text="Enter the location as: City, State"
    )
    power_capacity = models.DecimalField(
        "Power Capacity (in MW)", max_digits=8, decimal_places=1
    )
    type_of_survey = models.CharField(
        choices=SURVEY_TYPES, max_length=30, default="Thermal Imaging"
    )
    ortho_image = models.ImageField(
        upload_to="orthomosaic images", blank=True, null=True
    )
    report_status = models.CharField(choices=STATUS, default="Pending")
    date = models.DateField(auto_now=True)
    coordinates = models.CharField(blank=True, null=True)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, null=True)

    def __str__(self) -> str:
        return f"{self.title} - {self.organization.name}"

class Survey(models.Model):
    name = models.CharField(max_length=100)
    date = models.DateField(auto_now=True)
    defects_file = models.FileField(upload_to="survey_defects_coordinates", blank=True)
    tile_link = models.CharField(null=True, blank=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)

    def __str__(self) -> str:
        return f"{self.name} - {self.project.title} - {self.project.organization.name}"


class ProjectImage(models.Model):
    images = models.ImageField(upload_to="survey images", null=True, blank=True)
    geolocation = models.CharField(null=True, blank=True)
    date = models.DateField(auto_now=True)
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, null=True)

class Report(models.Model):
    name = models.CharField(null=True, blank=True)
    date = models.DateField(auto_now=True)
    report_file = models.FileField(upload_to="reports", blank=True, null=True)
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, null=True)

class SurveyOutputImage(models.Model):
    images = models.ImageField(upload_to="survey_output_images", null=True, blank=True)
    date = models.DateField(auto_now=True)
    geolocation = models.CharField(null=True, blank=True)
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE)

class TaskCategory(models.Model):
    name = models.CharField(max_length=100, unique=True, primary_key=True)

class TaskDetails(models.Model):
    # priority = {
    #     ''
    # }

    progress_status = {
        "Not Started": "Not Started",
        "In Progress": "In Progress",
        "Completed": "Completed",
        "Cancelled": "Cancelled",
    }

    name = models.CharField(max_length=100)
    description = models.CharField(max_length=300)
    priority = models.CharField(max_length=20, blank=True, null=True)
    progress = models.CharField(choices=progress_status, default="Not Started")
    start_date = models.DateField(auto_now_add=True)
    completion_date = models.DateField(blank=True, null=True)
    assignedby = models.ForeignKey(User, on_delete=models.CASCADE)
    assignedto = models.ForeignKey(UserProfile, on_delete=models.RESTRICT, null=True, blank=True)
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    category = models.ForeignKey(TaskCategory, on_delete=models.CASCADE)
    
class SurveyInvoice(models.Model):
    name = models.CharField(max_length=100, default='invoice')
    invoice_file = models.FileField(upload_to='invoices', blank=True, null=True)
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    
