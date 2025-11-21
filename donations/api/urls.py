from rest_framework.routers import DefaultRouter
from .views import (
    DonationViewSet,
    EventDonationOptionViewSet,
    DonationCategoryViewSet,
    DonationSubCategoryViewSet,
)
from django.urls import path, include

router = DefaultRouter()
router.register(r"", DonationViewSet, basename="donation")
router.register(r"options", EventDonationOptionViewSet, basename="event-donation-option")
router.register(r"categories", DonationCategoryViewSet, basename="donation-category")
router.register(r"subcategories", DonationSubCategoryViewSet, basename="donation-subcategory")

urlpatterns = [
    path("", include(router.urls)),
]
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
