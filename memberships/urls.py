from django.urls import path
from .views import *
from . import views

urlpatterns = [
    path('list/', membership_list, name='membership_list'),
    path('registration/', views.RegistrationView.as_view(), name='membership_registration'),
]