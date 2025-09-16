from rest_framework import status, generics, filters
from rest_framework.permissions import IsAuthenticated, DjangoModelPermissions
from django_filters.rest_framework import DjangoFilterBackend

from core.utils.pagination import StandardResultsSetPagination
from ..models import DonationCategory, DonationSubCategory
from .serializers import (
    DonationCategorySerializer,
    DonationSubCategorySerializer,
    DonationSubCategoryListSerializer
)
from drf_spectacular.utils import (
    extend_schema, OpenApiExample, OpenApiResponse
)


@extend_schema(
    tags=["Donation"],
    summary="Donation - Category Retrieve Create",
    description="Donation - Category Retrieve Create"
)
class DonationCategoryListCreateView(generics.ListCreateAPIView):
    serializer_class = DonationCategorySerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['title']
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    
    def get_queryset(self):
        show_all = self.request.query_params.get('show_all', '').lower() == 'true'
        queryset = DonationCategory.objects.all()
        
        if not show_all:
            queryset = queryset.filter(is_active=True)
            
        return queryset.order_by('-created_at')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            return custom_api_response(
                success=True,
                message="Donation category created successfully.",
                data=serializer.data,
                status_code=status.HTTP_201_CREATED
            )
        return custom_api_response(
            success=False,
            message="Validation error",
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST
        )


@extend_schema(
    tags=["Donation"],
    summary="Donation - Category Update Delete",
    description="Donation - Category Update Delete"
)
class DonationCategoryRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = DonationCategory.objects.all()
    serializer_class = DonationCategorySerializer
    lookup_field = 'pk'
    permission_classes = [IsAuthenticated, DjangoModelPermissions]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return custom_api_response(
            success=True,
            message="",
            data=serializer.data
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            self.perform_update(serializer)
            return custom_api_response(
                success=True,
                message="Donation category updated successfully.",
                data=serializer.data
            )
        return custom_api_response(
            success=False,
            message="Validation error",
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save(update_fields=['is_active'])
        return custom_api_response(
            success=True,
            message="Donation category has been deactivated successfully.",
            data={"id": instance.id, "is_active": False}
        )


@extend_schema(
    tags=["Donation"],
    summary="Donation - Sub Category Retrieve Create",
    description="Donation - Sub Category Retrieve Create"
)
class DonationSubCategoryListCreateView(generics.ListCreateAPIView):
    serializer_class = DonationSubCategoryListSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['title']
    filterset_fields = ['donation_category']
    permission_classes = [IsAuthenticated, DjangoModelPermissions]

    def get_queryset(self):
        show_all = self.request.query_params.get('show_all', '').lower() == 'true'
        queryset = DonationSubCategory.objects.select_related('donation_category')
        
        # Filter by donation_category if provided
        donation_category = self.request.query_params.get('donation_category')
        if donation_category:
            queryset = queryset.filter(donation_category_id=donation_category)
            
        # Filter by is_active if show_all is not True
        if not show_all:
            queryset = queryset.filter(is_active=True)
            
        return queryset.order_by('-created_at')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return DonationSubCategorySerializer
        return DonationSubCategoryListSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            return custom_api_response(
                success=True,
                message="Donation subcategory created successfully.",
                data=serializer.data,
                status_code=status.HTTP_201_CREATED
            )
        return custom_api_response(
            success=False,
            message="Validation error",
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST
        )


@extend_schema(
    tags=["Donation"],
    summary="Donation - Sub Category Update Delete",
    description="Donation - Sub Category Update Delete"
)
class DonationSubCategoryRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = DonationSubCategory.objects.select_related('donation_category')
    serializer_class = DonationSubCategorySerializer
    lookup_field = 'pk'
    permission_classes = [IsAuthenticated, DjangoModelPermissions]

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return DonationSubCategoryListSerializer
        return DonationSubCategorySerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return custom_api_response(
            success=True,
            message="",
            data=serializer.data
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            self.perform_update(serializer)
            return custom_api_response(
                success=True,
                message="Donation subcategory updated successfully.",
                data=serializer.data
            )
        return custom_api_response(
            success=False,
            message="Validation error",
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save(update_fields=['is_active'])
        return custom_api_response(
            success=True,
            message="Donation subcategory has been deactivated successfully.",
            data={"id": instance.id, "is_active": False}
        )
