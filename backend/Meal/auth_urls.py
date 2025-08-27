# auth_urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .auth_views import (
    LoginView,
    RegisterView,
    LogoutView,
    UserProfileView,
    ChangePasswordView
)

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('register/', RegisterView.as_view(), name='register'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
]
