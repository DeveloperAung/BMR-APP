from rest_framework import status, generics, filters
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, DjangoModelPermissions
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

from core.utils.pagination import StandardResultsSetPagination
from ..models import EventCategory, EventSubCategory
from .serializers import (
    EventCategorySerializer,
    EventSubCategorySerializer,
    EventSubCategoryListSerializer
)
from drf_spectacular.utils import (
    extend_schema, OpenApiExample, OpenApiResponse
)


@extend_schema(
        tags=["Events"],
        responses={201: EventCategorySerializer},
        summary="Create Event Category",
        description="Create Event Category"
    )
class EventCategoryListCreateView(generics.ListCreateAPIView):
    serializer_class = EventCategorySerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['title']
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    
    def get_queryset(self):
        # Get the 'show_all' parameter from query params
        show_all = self.request.query_params.get('show_all', '').lower() == 'true'
        
        # Start with all objects
        queryset = EventCategory.objects.all()
        
        # Filter by is_active if show_all is not True
        if not show_all:
            queryset = queryset.filter(is_active=True)
            
        # Order by created_at in descending order
        return queryset.order_by('-created_at')

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        return response

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            return custom_api_response(
                success=True,
                message="Event category created successfully.",
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
        tags=["Events"],
        responses={200: EventCategorySerializer},
        summary="Retrieve, Update, Destroy Event Category",
        description="Retrieve, update and destroy Event Category by id"
    )
class EventCategoryRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = EventCategory.objects.all()
    serializer_class = EventCategorySerializer
    lookup_field = 'pk'

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
                message="Event category updated successfully.",
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
        # Perform soft delete by setting is_active=False
        instance.is_active = False
        instance.save(update_fields=['is_active'])
        return custom_api_response(
            success=True,
            message="Event category has been deactivated successfully.",
            data={"id": instance.id, "is_active": False}
        )

    # def soft_delete(self, request, *args, **kwargs):
    #     instance = self.get_object()
    #     instance.is_active = False
    #     instance.save(update_fields=['is_active', 'updated_at'])
    #     return custom_api_response(
    #         success=True,
    #         message="Event category has been deactivated successfully.",
    #         data={"id": instance.id, "is_active": False}
    #     )


@extend_schema(
        tags=["Events"],
        responses={201: EventSubCategoryListSerializer},
        summary="Create Event Sub Category",
        description="Create Event Sub Category"
    )
class EventSubCategoryListCreateView(generics.ListCreateAPIView):
    serializer_class = EventSubCategoryListSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['title']
    filterset_fields = ['event_category']

    def get_queryset(self):
        queryset = EventSubCategory.objects.select_related('event_category').all()
        return queryset.order_by('-created_at')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return EventSubCategorySerializer
        return EventSubCategoryListSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            return custom_api_response(
                success=True,
                message="Event sub-category created successfully.",
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
        tags=["Events"],
        responses={201: EventSubCategoryListSerializer},
        summary="Create, Update and Delete Event Sub Category",
        description="Create, Update and Delete Event Sub Category"
    )
class EventSubCategoryRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = EventSubCategory.objects.select_related('event_category')
    serializer_class = EventSubCategorySerializer
    lookup_field = 'pk'

    def get_serializer_class(self):
        if self.request.method == 'GET' and 'list' in self.request.path:
            return EventSubCategoryListSerializer
        return EventSubCategorySerializer

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
                message="Event sub-category updated successfully.",
                data=serializer.data
            )
        return custom_api_response(
            success=False,
            message="Validation error",
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST
        )

    # def destroy(self, request, *args, **kwargs):
    #     instance = self.get_object()
    #     self.perform_destroy(instance)
    #     return custom_api_response(
    #         success=True,
    #         message="Event sub-category deleted successfully.",
    #         status_code=status.HTTP_204_NO_CONTENT
    #     )

    def soft_delete(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save(update_fields=['is_active', 'updated_at'])
        return custom_api_response(
            success=True,
            message="Event sub-category has been deactivated successfully.",
            data={"id": instance.id, "is_active": False}
        )
