from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'events_api'

router = DefaultRouter()

urlpatterns = [
    # Event Category URLs
    path('categories/', views.EventCategoryListCreateView.as_view(), name='category-list-create'),
    path('categories/<int:pk>/', views.EventCategoryRetrieveUpdateDestroyView.as_view(), 
         name='category-retrieve-update-destroy'),
    
    # Event Sub-Category URLs
    path('subcategories/', views.EventSubCategoryListCreateView.as_view(),
         name='sub-category-list-create'),
    path('subcategories/<int:pk>/', views.EventSubCategoryRetrieveUpdateDestroyView.as_view(),
         name='sub-category-retrieve-update-destroy'),
]

urlpatterns += router.urls