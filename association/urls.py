from django.urls import path
from . import views


urlpatterns = [
    path('i/post/list/', views.association_post_list, name='association_post_list'),
]