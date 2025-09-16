# memberships/api/routers.py
from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import (
    MembershipViewSet, 
    EducationLevelListAPIView, 
    InstitutionListAPIView, 
    MembershipTypeListAPIView,
    HitPayWebhookView,
    MembershipMetaView,
    ManagementMembershipViewSet
)

router = DefaultRouter()
router.register(r"", MembershipViewSet, basename="memberships")
router.register(r"management", ManagementMembershipViewSet, basename="mgmt-membership")

urlpatterns = [
    # Lookups
    path("education-levels/", EducationLevelListAPIView.as_view(), name="education-levels-list"),
    path("institutions/", InstitutionListAPIView.as_view(), name="institutions-list"),
    path("membership-types/", MembershipTypeListAPIView.as_view(), name="membership-types-list"),
    path("meta/", MembershipMetaView.as_view(), name="memberships-meta"),

    # Webhooks
    path("payments/webhooks/hitpay/", HitPayWebhookView.as_view(), name="hitpay-webhook"),
]

urlpatterns += router.urls