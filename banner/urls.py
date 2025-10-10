from django.urls import path
from . import views
from authentication.api.views import google_callback

urlpatterns = [
    path('i/banner/list', views.banner_list, name='banner_list'),
]