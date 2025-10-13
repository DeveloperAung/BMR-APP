from django.urls import path,include
from . import views
from authentication.api.views import google_callback

internal_urls = [
    path('banner/list', views.banner_list, name='banner_list'),
]

urlpatterns = [
    path('i/',include(internal_urls)),
]