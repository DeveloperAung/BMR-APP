from django.urls import path
from . import views

urlpatterns = [
    path('i/event/category/list/', views.event_category_list, name='event_category_list'),
    # path('categories/', views.event_category_list, name='event_category_list'),
    # path('categories/create/', views.event_category_create, name='event_category_create'),
    # path('categories/<int:pk>/update/', views.event_category_update, name='event_category_update'),
    # path('categories/<int:pk>/delete/', views.event_category_delete, name='event_category_delete'),
    # path('sub-categories/', views.event_sub_category_list, name='event_sub_category_list'),
    # path('sub-categories/create/', views.event_sub_category_create, name='event_sub_category_create'),
    # path('sub-categories/<int:pk>/update/', views.event_sub_category_update, name='event_sub_category_update'),
    # path('sub-categories/<int:pk>/delete/', views.event_sub_category_delete, name='event_sub_category_delete'),
] 