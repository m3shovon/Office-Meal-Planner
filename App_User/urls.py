from django.urls import path
from . import views

app_name = 'App_User'

urlpatterns = [
    path('login/', views.user_login, name='login'),
    path('logout/', views.user_logout, name='logout'),
    path('', views.home, name='home'),
    # path('profile/', views.profile, name='profile'),
]
