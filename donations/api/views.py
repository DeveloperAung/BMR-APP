from rest_framework import viewsets, permissions, mixins
from donations.models import Donation, EventDonationOption, DonationCategory, DonationSubCategory
from .serializers import (
    DonationReadSerializer,
    DonationCreateSerializer,
    EventDonationOptionSerializer,
    DonationCategorySerializer,
    DonationSubCategorySerializer,
)
from rest_framework.response import Response
from rest_framework import status


class DonationViewSet(viewsets.GenericViewSet, mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin):
    queryset = Donation.objects.all().select_related("donated_by", "event", "event_option")
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.action in ("list", "retrieve"):
            return DonationReadSerializer
        return DonationCreateSerializer

    def perform_create(self, serializer):
        # ensure donated_by is set to request.user if available
        user = getattr(self.request, "user", None)
        serializer.save(donated_by=user if user and user.is_authenticated else None)


class EventDonationOptionViewSet(viewsets.ModelViewSet):
    """CRUD for EventDonationOption."""
    queryset = EventDonationOption.objects.all().select_related("event", "donation_category")
    serializer_class = EventDonationOptionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class DonationCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DonationCategory.objects.filter(is_active=True)
    serializer_class = DonationCategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class DonationSubCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DonationSubCategory.objects.filter(is_active=True)
    serializer_class = DonationSubCategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
from rest_framework import status, generics, filters
from rest_framework.permissions import IsAuthenticated, DjangoModelPermissions
from django_filters.rest_framework import DjangoFilterBackend

from core.utils.mixins import SoftDeleteMixin
from core.utils.pagination import StandardResultsSetPagination
from core.utils.responses import ok, fail

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
        show_all = self.request.query_params.get('show_all', '').lower() == 'true'
        queryset = DonationCategory.objects.all()
        
        if not show_all:
            queryset = queryset.filter(is_active=True)
            
        return queryset.order_by('-created_at')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            return ok(
                data=serializer.data,
                message="Donation category created successfully.",
                status=status.HTTP_201_CREATED
            )
        return fail(
            error=serializer.errors,
            message="Validation error"
        )


@extend_schema(
    tags=["Donation"],
    summary="Donation - Category Update Delete",
    description="Donation - Category Update Delete"
)
class DonationCategoryRetrieveUpdateDestroyView(
        SoftDeleteMixin,
        generics.RetrieveUpdateDestroyAPIView
    ):
    queryset = DonationCategory.objects.all()
    serializer_class = DonationCategorySerializer
    lookup_field = 'pk'
    permission_classes = [IsAuthenticated]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return ok(
            data=serializer.data,
            message="Data Retrieve Successfully",
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            self.perform_update(serializer)
            return ok(
                data=serializer.data,
                message="Donation category updated successfully."
            )
        return fail(
            error=serializer.errors,
            message="Validation error"
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
    permission_classes = [IsAuthenticated]

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
            return ok(
                data=serializer.data,
                message="Donation subcategory created successfully.",
                status=status.HTTP_201_CREATED
            )
        return fail(
            error=serializer.errors,
            message="Validation error"
        )


@extend_schema(
    tags=["Donation"],
    summary="Donation - Sub Category Update Delete",
    description="Donation - Sub Category Update Delete"
)
class DonationSubCategoryRetrieveUpdateDestroyView(
        SoftDeleteMixin,
        generics.RetrieveUpdateDestroyAPIView
    ):
    queryset = DonationSubCategory.objects.select_related('donation_category')
    serializer_class = DonationSubCategorySerializer
    lookup_field = 'pk'
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return DonationSubCategoryListSerializer
        return DonationSubCategorySerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return ok(
            data=serializer.data,
            message="Data Retrieve Successfully",

        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            self.perform_update(serializer)
            return ok(
                data=serializer.data,
                message="Donation subcategory updated successfully.",
            )
        return fail(
            error=serializer.errors,
            message="Validation error",
        )

