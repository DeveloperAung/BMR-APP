from django.urls import path
from . import views
from authentication.api.views import google_callback

urlpatterns = [
    path('i/users/list', views.user_list, name='user_list'),
]