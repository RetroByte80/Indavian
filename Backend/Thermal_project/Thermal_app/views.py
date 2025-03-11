from re import S
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.contrib.auth.password_validation import validate_password
from django.db.models import F
from django.core.mail import send_mail
import datetime
from io import BytesIO
from django.http import HttpResponse
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, Image, PageBreak, KeepTogether
from Thermal_app.models import (
    Organization,
    Project,
    ProjectImage,
    Report,
    Survey,
    SurveyInvoice,
    SurveyOutputImage,
    TaskCategory,
    TaskDetails,
    UserProfile,
)
from django.shortcuts import render
from django.db.models import Count
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
import json
import pyotp

from .serializers import (
    OrganizationSerializer,
    OutputImageSerializer,
    ProjectSerializer,
    ReportSerializer,
    SurveyInvoiceSerializer,
    SurveySerializer,
    TaskCategorySerializer,
    TaskDetailsSerializer,
    UserProfileSerializer,
)
from .utils import get_geolocation, send_otp


@api_view()
def start_page(request):
    return Response("Home page")

@api_view()
def index(request):
    return render(request, 'index.html')

@csrf_exempt
@api_view(["POST"])
def LoginPage(request):
    """
    The function handles the login process for the application.

    Parameters:
    request (HttpRequest): The incoming request object containing the username and password.

    Returns:
    JsonResponse: A JSON response indicating the status of the login process. If successful, it includes a message
    indicating successful login. If the username or password is missing, it returns a JSON response with a message
    indicating that the username and password must be provided. If the credentials are invalid, it returns a JSON
    response with a message indicating invalid credentials.
    """

    # data = json.loads(request.body)
    username = request.data.get("username")
    password = request.data.get("password")

    if username is None or password is None:
        return Response({"detail": "Please provide username and password"})
    user = authenticate(username=username, password=password)
    if user is None:
        return Response({"detail": "Invalid credentials"}, status=400)
    login(request, user)
    return Response({"detail": "Successfully logged in!"})


@csrf_exempt
@api_view(["POST"])
def UserProfileLogin(request):
    """
    This function handles the login process for user profiles. It retrieves the user's email from the request,
    checks if a corresponding user profile exists, and initiates the login process if found. If the user profile
    is not found, it returns a login failed status.

    Parameters:
    request (HttpRequest): The incoming request object containing the user's email.

    Returns:
    JsonResponse: A JSON response indicating the status of the login process. If successful, it includes a cookie
    with the user's email and sets relevant OTP cookies. If login fails, it returns a JSON response with a failure status.
    """

    # data = json.loads(request.body)
    email = request.data.get("email")
    userprofile = UserProfile.objects.get(email=email)

    if userprofile is not None:
        response = JsonResponse({"status": "login initiated!"})
        response.set_cookie("user-email", email, samesite="None", secure=True)
        otp_key, otp_valid_date = send_otp(request)
        response.set_cookie("otp_key", otp_key)
        response.set_cookie("otp_valid_date", otp_valid_date)
        request.session.modified = True
    else:
        return Response({"status": "login failed!"})

    return response


@csrf_exempt
@api_view(["POST"])
def OTPLogin(request):
    """
    This function handles the OTP login process. It verifies the OTP entered by the user
    with the one sent to their email. If the OTP is valid, it logs the user in and sets
    relevant cookies.

    Parameters:
    request (HttpRequest): The incoming request object containing the user's OTP and email.

    Returns:
    JsonResponse: A JSON response indicating the status of the login process.
    """
    if request.method == "POST":
        data = json.loads(request.body)
        email = data.get("email")
        otp = data.get("otp")
        # email = request.COOKIES.get("user-email")
        otp_key = request.COOKIES.get("otp_key")
        otp_valid_date = request.COOKIES.get("otp_valid_date")

        if otp_key and otp_valid_date is not None:
            totp = pyotp.TOTP(otp_key, interval=300)
            if totp.verify(otp):
                response = Response({"status": "OTP Verified!"})
                response.set_cookie("user-email", email)
                del request.COOKIES["otp_key"]
                del request.COOKIES["otp_valid_date"]
                response.set_cookie("user_status", "logged in")

            return response

        else:
            return Response({"status": "login failed!"})


@api_view(["GET"])
def LogoutPage(request):
    """
    Handles the logout process for both authenticated and unauthenticated users.

    Parameters:
    request (HttpRequest): The incoming request object.

    Returns:
    JsonResponse: A JSON response indicating the status of the logout process.
    """
    if not request.user.is_authenticated:
        # Handle logout for unauthenticated users (e.g., those logged in via email)
        try:
            del request.COOKIES["user-email"]
        except KeyError:
            # If the user-email cookie doesn't exist, return an error
            return Response({"message": "logout failed!"}, status=400)
        return Response({"detail": "Successfully logged out!"})

    # Handle logout for authenticated users
    logout(request)
    response = Response({"detail": "Successfully logged out!"})

    # Delete relevant cookies
    response.delete_cookie("sessionid")
    response.delete_cookie("csrftoken")
    response.delete_cookie("user-email")

    return response


@ensure_csrf_cookie
def SessionView(request):
    if not request.user.is_authenticated:
        return Response({"isAuthenticated": False})
    return Response({"isAuthenticated": True})


@api_view(["GET", "POST"])
def csrf_token(request):
    """
    This function retrieves the CSRF token from the request cookies.

    Parameters:
    request (HttpRequest): The incoming request object containing the user's authentication details and the HTTP method.

    Returns:
    Response: A JSON response containing the CSRF token if the user is authenticated. If the user is not authenticated,
    it returns a JSON response indicating the unauthenticated status.
    """
    if request.user.is_authenticated:
        data = {"csrftoken": request.COOKIES.get("csrftoken")}
        return Response(data)
    else:
        return Response({"detail": "User is not authenticated"})


@api_view(["GET"])
def UserRoleView(request):
    if request.method == "GET":
        if request.user.is_authenticated:
            return Response({"role": "manager"})
        else:
            return Response({"role": "member"})


@permission_classes([IsAuthenticated])
@api_view(["GET", "POST"])
def ChangePasswordView(request):
    """
    This function handles the password change process for authenticated users.

    Parameters:
    request (HttpRequest): The incoming request object containing the user's authentication details and the HTTP method.

    Returns:
    Response: A JSON response indicating the status of the password change process.
    If the request method is POST and the user is authenticated, it validates the new password, updates the user's password,
    and saves the changes. It returns a success message if the password is changed successfully.
    """
    if request.method == "POST":
        if request.user.is_authenticated:
            user = User.objects.get(username=request.user.username)
            new_password = request.data.get("new_password1")
            validate_password(new_password, user=user)
            user.set_password(new_password)
            user.save()

            return Response({"message": "Password changed successfully!"})


@permission_classes([IsAuthenticated])
@api_view(["GET", "POST"])
def ProjectsView(request):
    """
    This function handles the retrieval and creation of projects for authenticated users.

    Parameters:
    request (HttpRequest): The incoming request object containing the user's authentication details and the HTTP method.

    Returns:
    Response: A JSON response containing the serialized data of the projects if the request method is GET.
    If the request method is POST, it returns a JSON response indicating the successful creation of a project.
    """

    if request.user.is_authenticated:
        user = User.objects.get(username=request.user.username)
        organization = Organization.objects.get(user_id=user.id)

    else:
        email = request.COOKIES.get("user-email")
        org_id = UserProfile.objects.get(email=email).organization_id
        organization = Organization.objects.get(id=org_id)

    if request.method == "GET":
        projects = Project.objects.filter(organization=organization).annotate(
            image_count=Count("survey__projectimage")
        )
        serializer = ProjectSerializer(projects, many=True)
        return Response(serializer.data)


@permission_classes([IsAuthenticated])
@api_view(["GET", "POST"])
def SurveyView(request, pk):
    """
    This function handles the retrieval and creation of surveys for a specific project.

    Parameters:
    request (HttpRequest): The incoming request object containing the user's authentication details and the HTTP method.
    pk (int): The primary key of the project for which the surveys are to be retrieved or created.

    Returns:
    Response: A JSON response containing the serialized data of the surveys if the request method is GET.
    If the request method is POST, it returns a JSON response indicating the successful creation of a survey.
    """
    project = Project.objects.get(id=pk)

    if request.method == "GET":
        survey = Survey.objects.filter(project_id=project.id)
        serializer = SurveySerializer(survey, many=True)
        return Response(serializer.data)


@permission_classes([IsAuthenticated])
@api_view(["GET", "POST"])
def SurveyDetailView(request, pk):
    """
    This function handles the retrieval and display of detailed information about a specific survey.

    Parameters:
    request (HttpRequest): The incoming request object containing the user's authentication details and the HTTP method.
    pk (int): The primary key of the survey for which the detailed information is to be retrieved.

    Returns:
    Response: A JSON response containing the serialized data of the survey if the request method is GET.
    If the request method is POST, it returns a JSON response indicating the successful retrieval of the survey details.
    """
    if request.method == "GET":
        survey = Survey.objects.get(id=pk)
        serializer = SurveySerializer(survey)
        return Response(serializer.data)


@permission_classes([IsAuthenticated])
@api_view(["GET", "PUT", "DELETE"])
def ProjectDetailView(request, pk):
    """
    This function handles the retrieval, update, and deletion of a specific project based on its primary key.
    It requires authentication and supports GET, PUT, and DELETE HTTP methods.

    Parameters:
    request (HttpRequest): The incoming request object containing the user's authentication details and the HTTP method.
    pk (int): The primary key of the project to be retrieved, updated, or deleted.

    Returns:
    Response: A JSON response containing the serialized data of the project if the request method is GET.
    If the request method is DELETE, it returns a JSON response indicating the successful deletion of the project.
    If the request method is PUT, it returns a JSON response indicating the successful update of the project.
    """

    project = Project.objects.get(id=pk)

    if request.method == "GET":
        serializer = ProjectSerializer(project)
        return Response(serializer.data)

    if request.method == "DELETE":
        project.delete()
        return Response("Project deleted successfully!")

    if request.method == "PUT":
        project.power_capacity = request.data.get("power_capacity")
        project.location = request.data.get("location")
        project.type_of_survey = request.data.get("type_of_survey")

        project.save(update_fields=["location", "power_capacity", "type_of_survey"])

        return Response("Project updated successfully!")


@permission_classes([IsAuthenticated])
@api_view(["GET"])
def PredictionImageView(request, pk):
    """
    This function retrieves the prediction images associated with a specific project.

    Parameters:
    request (HttpRequest): The incoming request object containing the user's authentication details and the HTTP method.
    pk (int): The primary key of the project for which the prediction images are to be retrieved.

    Returns:
    Response: A JSON response containing the serialized data of the prediction images associated with the project.
    """

    survey = Survey.objects.get(id=pk)

    if request.method == "GET":
        images = SurveyOutputImage.objects.filter(survey_id=survey.id).all()
        serializer = OutputImageSerializer(images, many=True)
        return Response(serializer.data)


@api_view(["GET"])
def ReportView(request, pk):
    """
    This function retrieves the reports associated with a specific project.

    Parameters:
    request (HttpRequest): The incoming request object containing the user's authentication details and the HTTP method.
    pk (int): The primary key of the project for which the reports are to be retrieved.

    Returns:
    Response: A JSON response containing the serialized data of the reports associated with the project.
    """
    try:
        project = Project.objects.get(id=pk)
    except Project.DoesNotExist:
        return Response({"error": "Project not found"}, status=404)

    if request.method == "GET":
        surveys = Survey.objects.filter(project_id=project.id)
        reports = Report.objects.filter(survey__in=surveys)
        serializer = ReportSerializer(reports, many=True)

        return Response(serializer.data)
    
@api_view(['POST'])
def SurveyReportView(request, pk):
    if request.method == "POST":
        survey = Survey.objects.get(id=pk)
        images = SurveyOutputImage.objects.filter(survey_id=survey.id)  # Adjust based on your data structure

        # Set up PDF buffer
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        body = []

        # Add report content based on survey data
        body.append(Paragraph("Drone Mission Report", styles['Heading1']))
        body.append(Paragraph("**Purpose of the Report**", styles['Heading2']))
        body.append(Paragraph(survey.purpose, styles['BodyText']))

        # Project Information Section
        body.append(Paragraph("**Project Information**", styles['Heading2']))
        project_info = [
            ['Date', survey.date.strftime("%Y-%m-%d")],
            ['Location', survey.location],
            ['Drone Model', survey.drone_model]
        ]
        body.append(Table(project_info, style=[('ALIGN', (0, 0), (-1, -1), 'LEFT')]))

        # Image details with defect coordinates and details
        for image in images:
            image_data = {
                'image_path': image.image_path,
                'defect_coordinates': f"{image.latitude}, {image.longitude}",
                'defect_location': image.location_code,
                'defect_severity': image.severity,
                'date': image.date_taken.strftime("%Y-%m-%d")
            }

            # Add image and details
            img = Image(image_data['image_path'], width=200, height=100)
            data_table = Table([[key, value] for key, value in image_data.items()],
                            style=[('ALIGN', (0, 0), (-1, -1), 'LEFT')])
            body.append(KeepTogether([img, data_table]))
            body.append(PageBreak())

        # Add Insights and Solutions sections
        body.append(Paragraph("**Insights**", styles['Heading2']))
        body.append(Paragraph(survey.insights, styles['BodyText']))
        body.append(Paragraph("**Solutions**", styles['Heading2']))
        body.append(Paragraph(survey.solutions, styles['BodyText']))

        # Final Footer
        footer = Paragraph("Generated on: " + datetime.datetime.now().strftime("%Y-%m-%d"), styles['Normal'])
        body.append(footer)

        # Build PDF and prepare response
        doc.build(body)
        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="survey_report_{{survey_id}}.pdf"'

        return response
    
@api_view(['GET'])
def SurveyInvoiceView(request):
    """
    Retrieves the survey invoices associated with the user's organization.

    Parameters:
    request (HttpRequest): The incoming request object containing the user's authentication details and cookies.

    Returns:
    Response: A JSON response containing the serialized data of the survey invoices associated with the user's organization.
    The response includes the project name associated with each invoice.
    """
    if request.user.is_authenticated:
        user = User.objects.get(username=request.user.username)
        organization = Organization.objects.get(user_id=user.id)
        
        invoices = SurveyInvoice.objects.filter(organization_id=organization.id).annotate(project_name=F('survey__project__title'))
        serializer = SurveyInvoiceSerializer(invoices, many=True)
        return Response(serializer.data)
    
    elif request.COOKIES.get("user-email"):
        email = request.COOKIES.get("user-email")
        org_id = UserProfile.objects.get(email=email).organization_id
        organization = Organization.objects.get(id=org_id)
        
        invoices = SurveyInvoice.objects.filter(organization_id=organization.id).annotate(project_name=F('survey__project__title'))
        serializer = SurveyInvoiceSerializer(invoices, many=True)
        return Response(serializer.data)


@permission_classes([IsAuthenticated])
@api_view(["GET", "POST"])
def UserProfileView(request):
    """
    This function handles the retrieval and creation of user profiles for authenticated users.

    Parameters:
    request (HttpRequest): The incoming request object containing the user's authentication details and the HTTP method.

    Returns:
    Response: A JSON response containing the serialized data of the user profile if the request method is POST.
    If the request method is GET, it returns a JSON response containing the serialized data of all user profiles
    associated with the user's organization.
    """

    if request.user.is_authenticated:
        user = User.objects.get(username=request.user.username)
        organization = Organization.objects.get(user_id=user.id)

        if request.method == "POST":

            data = request.POST
            userprofile = UserProfile.objects.create(
                name=data.get("name"),
                email=data.get("email"),
                phone=data.get("phone"),
                user=user,
                organization=organization,
            )
            serializer = UserProfileSerializer(userprofile)

            return Response(serializer.data)

        if request.method == "GET":
            userprofile = UserProfile.objects.filter(organization=organization).all()
            serializer = UserProfileSerializer(userprofile, many=True)
            return Response(serializer.data)
    
    elif request.COOKIES.get("user-email"):
        email = request.COOKIES.get("user-email")
        org_id = UserProfile.objects.get(email=email).organization_id
        organization = Organization.objects.get(id=org_id)
        
        if request.method == "GET":
            userprofile = UserProfile.objects.filter(organization=organization).all()
            serializer = UserProfileSerializer(userprofile, many=True)
            return Response(serializer.data) 
        

@permission_classes([IsAuthenticated])
@api_view(["GET"])
def Userdetails(request):
    if request.user.is_authenticated:
        username = request.user.username
        email = request.user.email
        return Response({"username": username, "email": email})
    else:
        email = request.COOKIES.get("user-email")
        user = UserProfile.objects.get(email=email)
        return Response({"username": user.name, "email": email})


@api_view(["GET"])
def TaskCategoryView(request):
    if request.method == "GET":
        taskcategories = TaskCategory.objects.all()
        serializer = TaskCategorySerializer(taskcategories, many=True)
        return Response(serializer.data)


@api_view(["GET", "POST", "PATCH"])
def TaskDetailsView(request):
    """
    This function handles the creation, retrieval, and updating of task details.

    Parameters:
    request (HttpRequest): The incoming request object containing the task details and method type.

    Returns:
    Response: A JSON response indicating the status of the task operation.
    """

    if request.user.is_authenticated:
        user = User.objects.get(username=request.user.username)
        organization = Organization.objects.get(user_id=user.id)

        if request.method == "POST":
            """
            Creates a new task with the provided details.
            """
            name = request.data.get("name")
            description = request.data.get("description")
            assignedTo = UserProfile.objects.get(id=request.data.get("assignedTo"))
            survey = Survey.objects.get(id=request.data.get("survey"))
            priority = request.data.get("priority")
            category = TaskCategory.objects.get(name = request.data.get("category"))
            organization_id = organization

            TaskDetails.objects.create(
                name=name,
                description=description,
                priority=priority,
                assignedto=assignedTo,
                assignedby=user,
                survey=survey,
                organization=organization_id,
                category=category,
            )
            
            send_mail(subject='New Task Update',
                      message=f'Hello {assignedTo.name}, \nYou have been assigned a new task "{name}". Visit the task page of the application for more information. \nThis is an auto-generated email. Kindly do not reply to it. \nRegards, \nIndavain Technologies',
                      from_email='notify@indavian.com',
                      recipient_list=[assignedTo.email],
                      fail_silently=False,
                      )
            
            return Response({"detail": "Task created successfully!"}, status=200)
        
        if request.method == "GET":
            """
            Retrieves all tasks associated with the user's organization.
            """
            tasks = TaskDetails.objects.filter(organization_id=organization.id).annotate(manager_name=F('assignedby__username'))
            serializer = TaskDetailsSerializer(tasks, many=True)
            return Response(serializer.data)
        
    elif request.COOKIES.get("user-email"):
        email = request.COOKIES.get("user-email")
        member = UserProfile.objects.get(email=email)
        organization = Organization.objects.get(id=member.organization_id)

        if request.method == "GET":
            """
            Retrieves all tasks associated with the user's organization.
            """
            tasks = TaskDetails.objects.filter(organization_id=organization.id).annotate(manager_name=F('assignedby__username'))
            serializer = TaskDetailsSerializer(tasks, many=True)
            return Response(serializer.data)
        
        if request.method == "PATCH":
            """
            Updates the progress of a specific task.
            """
            progress = request.data.get('progressStatus')
            task = TaskDetails.objects.get(id=request.data.get('id'))
            manager = User.objects.get(id=task.assignedby_id)
            task.progress = progress
            task.save(update_fields=['progress'])
            
            send_mail(subject='Task Update',
                      message=f'Hello {manager.username}, \nThe task {task.name} has been updated by {member.name}. \nPlease see the Tasks section for more details. \nRegards, \nIndavain Technologies',
                      from_email='notify@indavian.com',
                      recipient_list=[manager.email],
                      fail_silently=False)
            
            return Response({'detail':'Task Update Successful!'})


# -------------------------------- Functions for Indavian Admin  --------------------------------


@csrf_exempt
@login_required
@api_view(['GET', 'POST'])
def IndavianLogin(request):
    """
    This function handles the login process for Indavian admin users. It extracts the username and password from the
    incoming request, verifies the credentials, and logs the user in if the credentials are valid.

    Parameters:
    request (HttpRequest): The incoming request object containing the username and password. The request must be
    marked as csrf_exempt and authenticated using the login_required decorator.

    Returns:
    JsonResponse: A JSON response indicating the status of the login process. If the username and password are missing,
    it returns a JSON response with a message indicating that the username and password must be provided. If the
    credentials are invalid, it returns a JSON response with a message indicating invalid credentials. If the login
    is successful, it returns a JSON response with a message indicating successful login.
    """

    username = request.data.get("username")
    password = request.data.get("password")

    if username is None or password is None:
        return Response({"detail": "Please provide username and password"})
    user = authenticate(username=username, password=password)
    if user is None:
        return Response({"detail": "Invalid credentials"}, status=400)
    login(request, user)
    return Response({"detail": "Successfully logged in!"})


@api_view(["GET"])
def OrganizationView(request):
    organizations = Organization.objects.all()
    serializer = OrganizationSerializer(organizations, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def OrgProjects(request, pk):
    projects = Project.objects.filter(organization_id=pk).all()
    serializer = ProjectSerializer(projects, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def ProjectSurvey(request, pk):
    surveys = Survey.objects.filter(project_id=pk).all()
    serializer = SurveySerializer(surveys, many=True)
    return Response(serializer.data)


@login_required
@api_view(["POST"])
def AdminCreateProject(request):
    """
    This function handles the creation of a new project by an admin user. It retrieves the necessary data from the request,
    creates a new project instance, associates it with the specified organization, and saves the project details. It also
    processes and saves the uploaded images, including extracting geolocation information.

    Parameters:
    request (HttpRequest): The incoming request object containing the project details and uploaded images.

    Returns:
    Response: A JSON response indicating the successful creation of the project. The response includes the serialized
    data of the newly created project.
    """

    if request.method == "POST":
        data = request.POST
        org_id = data.get("organization")
        organization = Organization.objects.get(id=org_id)
        project = Project.objects.create(
            title=data.get("title"),
            location=data.get("location"),
            type_of_survey=data.get("type_of_survey"),
            power_capacity=data.get("power_capacity"),
            organization=organization,
        )

        serializer = ProjectSerializer(project)
        return Response(serializer.data)


@login_required
@api_view(["POST"])
def AdminCreateSurvey(request):
    """
    This function handles the creation of a new project by an admin user. It retrieves the necessary data from the request,
    creates a new project instance, associates it with the specified organization, and saves the project details. It also
    processes and saves the uploaded images, including extracting geolocation information.

    Parameters:
    request (HttpRequest): The incoming request object containing the project details and uploaded images.

    Returns:
    Response: A JSON response indicating the successful creation of the project. The response includes the serialized
    data of the newly created project.
    """

    if request.method == "POST":
        data = request.POST
        # org_id = data.get("organization")
        # organization = Organization.objects.get(id=org_id)
        project_id = request.data.get("project")
        project = Project.objects.get(id=project_id)
        survey = Survey.objects.create(
            name=data.get("survey_name"),
            type_of_survey=data.get("type_of_survey"),
            project=project,
        )

        images = request.FILES.getlist("images")
        for image in images:
            geolocation = get_geolocation(image)
            ProjectImage.objects.create(
                images=image,
                geolocation=geolocation,
                survey=survey,
            )

        # serializer = ProjectSerializer(project)
        return Response({"message": "Survey created successfully!"}, status=200)


@login_required
@api_view(["POST"])
def AdminEditSurvey(request):

    if request.method == "POST":
        # org_id = request.POST.get('organization')
        # organization = Organization.objects.get(id=org_id)
        # project_id = request.POST.get("project")
        # project = Project.objects.get(id=project_id)
        survey_id = request.POST.get("survey")
        survey = Survey.objects.get(id=survey_id)

        images = request.FILES.getlist("images")
        for image in images:
            geolocation = get_geolocation(image)
            ProjectImage.objects.create(
                images=image, geolocation=geolocation, survey_id=survey.id
            )

        return Response({"message": f"{survey.name} edited successfully!"}, status=200)


@login_required
@api_view(["POST"])
def AdminUploadPredictions(request):
    try:
        if request.method == "POST":
            survey_id = request.POST.get("survey")
            survey = Survey.objects.get(id=survey_id)

            images = request.FILES.getlist("images")
            for image in images:
                SurveyOutputImage.objects.create(images=image, survey_id=survey.id)
            return Response(
                {"message": f"Predictions for {survey.name} uploaded successfully!"},
                status=200,
            )
    except Exception as e:
        return Response({"error": str(e)}, status=500)


# @login_required
# @api_view(['POST', 'GET'])
# def ModelPrediction(request):
#     if request.method == "POST":
#         org_id = request.POST.get('organization')
#         organization = Organization.objects.get(id=org_id)
#         id = request.POST.get('project_id')
#         project = Project.objects.get(id=id, organization_id=organization.id)

#         project_images = ProjectImage.objects.filter(project=project)
#         detect_images = []

#         for image in project_images:
#             imgs_bytes = image.images.read()
#             img = Image.open(io.BytesIO(imgs_bytes))
#             detect_images.append(img)

#         prediction = detect(detect_images)
#         project.report_status = 'In Progress'

#     return Response("Prediction started")
