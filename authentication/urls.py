from django.urls import path, include
from . import views
from authentication.api.views import google_callback

internal_urls = [
    path('dashboard/', views.private_dashboard, name='private_dashboard'),
    path('users/list', views.user_list, name='user_list'),
]

urlpatterns = [
    path('', views.home, name='home'),
    path('login/', views.login_page, name='login_page'),
    path('register/', views.register_page, name='register_page'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('e/dashboard/', views.public_dashboard, name='public_dashboard'),
    path('google-callback/', google_callback, name='google_callback'),

    path('i/', include(internal_urls)),
]