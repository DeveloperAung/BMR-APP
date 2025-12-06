from django.urls import path, include
from . import views
from authentication.api.views import google_callback

internal_urls = [
    path('dashboard/', views.private_dashboard, name='private_dashboard'),
    path('users/list', views.user_list, name='user_list'),
    path('users/create', views.user_create, name='user_create'),
    path('users/<int:pk>/edit', views.user_edit, name='user_edit'),

    path('roles/list/', views.role_list, name='role_list'),
    path('roles/create/', views.role_create, name='role_create'),
    path('roles/<int:pk>/edit/', views.role_edit, name='role_edit'),
]

urlpatterns = [
    path('', views.home, name='home'),
    path('login/', views.login_page, name='login_page'),
    path('register/', views.register_page, name='register_page'),
    path('password/forgot/', views.forgot_password_page, name='forgot_password_page'),
    path('password/reset/', views.reset_password_page, name='reset_password_page'),
    path('password/change/', views.change_password_page, name='change_password_page'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('e/dashboard/', views.public_dashboard, name='public_dashboard'),
    path('google-callback/', google_callback, name='google_callback'),

    path('i/', include(internal_urls)),
]
