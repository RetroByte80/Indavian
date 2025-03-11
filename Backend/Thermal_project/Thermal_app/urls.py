from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    # path('', views.start_page, name='Home'),
    path('', views.index, name='home'),

    path('login/', views.LoginPage, name='login'),
    path('logout/', views.LogoutPage, name='logout'),
    path('session/', views.SessionView, name='api-session'),
    path('csrftoken/', views.csrf_token, name='csrf-token'),
    path('change-password/', views.ChangePasswordView, name='change-password'),
    path('checkrole/', views.UserRoleView, name='user-role'),
    
    path('projects/', views.ProjectsView, name='Project'),
    path('project/<int:pk>/', views.ProjectDetailView, name='ProjectDetails'),
    path('reports/<int:pk>/', views.ReportView, name='reports'),
    path('projectimages/<int:pk>/', views.PredictionImageView, name='survey-output-images'),
    path('projectsurvey/<int:pk>/', views.SurveyView, name='surveys'),
    path('surveydetail/<int:pk>/', views.SurveyDetailView, name='survey-detail'),
    path('categories/', views.TaskCategoryView, name='categories'),
    path('tasks/', views.TaskDetailsView, name='task-details'),
    path('invoices/', views.SurveyInvoiceView, name='survey-invoice'),
    
    path('userprofilelogin/', views.UserProfileLogin, name='UserProfileLogin'),
    path('userotp/', views.OTPLogin, name='user-otp-verify'),
    path('userprofile/', views.UserProfileView, name='UserProfiles'),
    path('userdetails/', views.Userdetails, name='manager-details'),
    path('generate_report/<int:pk>/', views.SurveyReportView, name='survey-report'),
    
    path('indavianlogin/', views.IndavianLogin, name='indavian-login'),
    path('organizations/', views.OrganizationView, name='organization'),
    path('org_projects/<int:pk>/', views.OrgProjects, name='organization-projects'),
    path('pro-survey/<int:pk>/', views.ProjectSurvey, name='project-survey'),
    
    # path('prediction/', views.ModelPrediction, name='prediction'),
    path('createproject/', views.AdminCreateProject, name='create-project'),
    path('createsurvey/', views.AdminCreateSurvey, name='create-survey'),
    path('editsurvey/', views.AdminEditSurvey, name='edit-survey'),
    path('surveyresults/', views.AdminUploadPredictions, name='survey-results'),
    
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)