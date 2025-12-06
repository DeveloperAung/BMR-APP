from django.urls import path,include
from . import views
from authentication.api.views import google_callback

internal_urls = [
    path('banner/list', views.banner_list, name='banner_list'),
]

public_urls = [
    path('banner/list', views.landing_page_view, name='home'),
]

urlpatterns = [
    path('i/',include(internal_urls)),
    path('',include(public_urls)),
]