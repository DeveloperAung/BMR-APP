from django.urls import path
from . import views

app_name = 'donations_api'

urlpatterns = [
    # Donation Categories
    path('categories/', views.DonationCategoryListCreateView.as_view(), name='donationcategory-list'),
    path('categories/<int:pk>/', views.DonationCategoryRetrieveUpdateDestroyView.as_view(), name='donationcategory-detail'),
    
    # Donation Subcategories
    path('subcategories/', views.DonationSubCategoryListCreateView.as_view(), name='donationsubcategory-list'),
    path('subcategories/<int:pk>/', views.DonationSubCategoryRetrieveUpdateDestroyView.as_view(), name='donationsubcategory-detail'),
]
