from rest_framework.routers import DefaultRouter
from .views import (
    DonationCategoryViewSet,
    DonationSubCategoryViewSet,
    get_donation_subcategories,
)
from django.urls import path, include

router = DefaultRouter()
router.register(r"categories", DonationCategoryViewSet, basename="donation-category")
router.register(r"subcategories", DonationSubCategoryViewSet, basename="donation-subcategory")

urlpatterns = [
    path("", include(router.urls)),
    path("subcategories/", get_donation_subcategories, name="get-donation-subcategories"),
]
