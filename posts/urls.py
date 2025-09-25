from django.urls import path
from . import views

urlpatterns = [
    path('i/categories/', views.PostCategoryList, name='post_category_list'),
    path('i/categories/create/', views.CategoryCreateView.as_view(), name='post_category_create'),
    path('i/categories/<int:pk>/edit/', views.CategoryEditView.as_view(), name='post_category_edit'),

    path('i/posts/', views.PostList, name='post_list'),
    path('i/posts/create/', views.PostCreateView.as_view(), name='post_create'),
    path('i/posts/<int:pk>/edit/', views.PostEditView.as_view(), name='post_edit'),

] 