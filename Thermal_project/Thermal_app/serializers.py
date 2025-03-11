# Serializers are used to convert complex data types to native python data types which can easily be rendered into JSON

from dataclasses import fields
from pyexpat import model
from rest_framework import serializers
from .models import (
    Project,
    Organization,
    ProjectImage,
    Report,
    Survey,
    SurveyInvoice,
    SurveyOutputImage,
    TaskCategory,
    TaskDetails,
    UserProfile,
)


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ["id", "name"]


class ProjectImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectImage
        fields = "__all__"


class ProjectSerializer(serializers.ModelSerializer):

    image_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "title",
            "location",
            "power_capacity",
            "type_of_survey",
            "date",
            "report_status",
            "ortho_image",
            "coordinates",
            "image_count",
        ]


class UserProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = UserProfile
        fields = "__all__"

        def create(self, validated_data):
            return UserProfile.objects.create(**validated_data)


class ReportSerializer(serializers.ModelSerializer):

    class Meta:
        model = Report
        fields = ["id", "name", "report_file"]


class SurveySerializer(serializers.ModelSerializer):
    class Meta:
        model = Survey
        fields = "__all__"


class OutputImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = SurveyOutputImage
        fields = "__all__"
        
class TaskCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskCategory
        fields = "__all__"
        
class TaskDetailsSerializer(serializers.ModelSerializer):
    manager_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = TaskDetails
        fields = '__all__'
        
class SurveyInvoiceSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = SurveyInvoice
        fields = '__all__'


# For nested relations, use HyperlinkedRelatedField or HyperlinkedIdentityField - define another class as object serialzer and instantiate it in the other class
# for custom fields, use serializer.SerializerMethodField()
# relations can be serialized by serializer.StringRelatedField() PrimarykeyRelatedField()
