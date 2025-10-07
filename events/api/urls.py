from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import EventMediaUploadView

app_name = 'events_api'

router = DefaultRouter()
router.register(r'events', views.EventViewSet, basename='event')

urlpatterns = [
    path('', include(router.urls)),
    # Event Category URLs
    path('categories/', views.EventCategoryListCreateView.as_view(), name='category-list-create'),
    path('categories/<int:pk>/', views.EventCategoryRetrieveUpdateDestroyView.as_view(), 
         name='category-retrieve-update-destroy'),
    
    # Event Sub-Category URLs
    path('subcategories/', views.EventSubCategoryListCreateView.as_view(),
         name='sub-category-list-create'),
    path('subcategories/<int:pk>/', views.EventSubCategoryRetrieveUpdateDestroyView.as_view(),
         name='sub-category-retrieve-update-destroy'),

    path('event-media/upload/', EventMediaUploadView.as_view(), name='event-media-upload'),
]

urlpatterns += router.urls