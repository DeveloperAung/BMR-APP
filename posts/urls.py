from django.urls import path, include
from . import views


internal_urls = [
    path('categories/', views.PostCategoryList, name='post_category_list'),
    path('categories/create/', views.CategoryCreateView.as_view(), name='post_category_create'),
    path('categories/<int:pk>/edit/', views.CategoryEditView.as_view(), name='post_category_edit'),

    path('posts/', views.PostList, name='post_list'),
    path('posts/create/', views.PostCreateView.as_view(), name='post_create'),
    path('posts/<int:pk>/edit/', views.PostEditView.as_view(), name='post_edit'),
]

public_urls = [
    path('books/', views.book_list, name='book_list'),
    path('articles/', views.article_list, name='article_list'),
    path('article/<int:pk>/details/', views.article_details, name='article_details'),
]

urlpatterns = [
    path('i/', include(internal_urls)),
    path('', include(public_urls)),
] 