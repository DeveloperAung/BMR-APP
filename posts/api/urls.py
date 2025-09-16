from django.urls import path
from . import views

app_name = 'posts_api'

urlpatterns = [
    path('categories/', views.PostCategoryListCreateView.as_view(), name='postcategory-list'),
    path('categories/<int:pk>/', views.PostCategoryRetrieveUpdateDestroyView.as_view(), name='postcategory-detail'),
]
