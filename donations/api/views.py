from rest_framework import viewsets, permissions, mixins, status, generics, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, DjangoModelPermissions
from django_filters.rest_framework import DjangoFilterBackend

from donations.models import DonationCategory, DonationSubCategory
from .serializers import (
    DonationCategorySerializer,
    DonationSubCategorySerializer,
)
from core.utils.pagination import StandardResultsSetPagination
from core.utils.responses import ok, fail
from drf_spectacular.utils import extend_schema, OpenApiExample, OpenApiResponse


class DonationCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DonationCategory.objects.filter(is_active=True)
    serializer_class = DonationCategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class DonationSubCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DonationSubCategory.objects.filter(is_active=True)
    serializer_class = DonationSubCategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        """Filter subcategories by category if provided."""
        queryset = super().get_queryset()
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(donation_category_id=category_id)
        return queryset


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_donation_subcategories(request):
    """Get subcategories for a given donation category."""
    category_id = request.query_params.get('category')
    if not category_id:
        return Response({'results': []}, status=status.HTTP_200_OK)
    
    subcategories = DonationSubCategory.objects.filter(
        donation_category_id=category_id,
        is_active=True
    )
    serializer = DonationSubCategorySerializer(subcategories, many=True)
    return Response({'results': serializer.data}, status=status.HTTP_200_OK)


@extend_schema(
    tags=["Donation"],
    summary="Donation - Category Retrieve Create",
    description="Donation - Category Retrieve Create",
    responses={
        200: DonationCategorySerializer(many=True),
        201: DonationCategorySerializer,
        400: OpenApiResponse(
            response=None,
            description="Validation error (e.g., duplicate title)"
        ),
    }
)
class DonationCategoryListCreateView(generics.ListCreateAPIView):
    serializer_class = DonationCategorySerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['title']
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = DonationCategory.objects.all()
        show_all = self.request.query_params.get('show_all', '').lower() == 'true'
        if not show_all:
            queryset = queryset.filter(is_active=True)
        return queryset.order_by('-created_at')


class DonationSubCategoryListCreateView(generics.ListCreateAPIView):
    serializer_class = DonationSubCategorySerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['title']
    filterset_fields = ['donation_category']
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = DonationSubCategory.objects.select_related('donation_category')
        donation_category = self.request.query_params.get('donation_category')
        if donation_category:
            queryset = queryset.filter(donation_category_id=donation_category)
        show_all = self.request.query_params.get('show_all', '').lower() == 'true'
        if not show_all:
            queryset = queryset.filter(is_active=True)
        return queryset.order_by('-created_at')


