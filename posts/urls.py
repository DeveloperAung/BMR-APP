from django.urls import path
from . import views

urlpatterns = [
    path('i/post/category/list', views.post_category_list, name='post_category_list'),
] 