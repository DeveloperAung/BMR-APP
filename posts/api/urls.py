from django.urls import path
from . import views

app_name = 'posts_api'

urlpatterns = [
    # Category endpoints
    path('categories/', views.PostCategoryListCreateView.as_view(), name='postcategory-list'),
    path('categories/<int:pk>/', views.PostCategoryRetrieveUpdateDestroyView.as_view(), name='postcategory-detail'),
    

    # Post endpoints
    path('', views.PostListCreateView.as_view(), name='post-list'),
    path('<int:pk>/', views.PostRetrieveUpdateDestroyView.as_view(), name='post-detail'),
    # path('posts/publish-toggle/<int:pk>/', views.PostPublishToggleView.as_view(), name='post-publish-toggle'),
    # Posts by category
    path('by-category/<int:category_id>/', views.PostByCategoryView.as_view({'get': 'list'}), name='posts-by-category'),
]
