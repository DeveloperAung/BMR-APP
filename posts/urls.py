from django.urls import path
from . import views

urlpatterns = [
    path('i/categories/', views.PostCategoryList, name='post_category_list'),
    path('i/categories/create/', views.CategoryCreateView.as_view(), name='post_category_create'),
    path('i/categories/<int:pk>/edit/', views.CategoryEditView.as_view(), name='post_category_edit'),
    
] 