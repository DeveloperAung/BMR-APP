from rest_framework import status, generics, filters, viewsets
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, DjangoModelPermissions
from django_filters.rest_framework import DjangoFilterBackend

from core.utils import mixins
from core.utils.pagination import StandardResultsSetPagination
from core.utils.responses import ok, fail
from ..models import EventCategory, EventSubCategory, Event
from .serializers import (
    EventCategorySerializer,
    EventSubCategorySerializer,
    EventSubCategoryListSerializer, EventListSerializer, EventSerializer
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
    permission_classes = [IsAuthenticated]
    
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
            return ok(
                data=serializer.data,
                message="Event category created successfully.",
                status=status.HTTP_201_CREATED
            )
        return fail(
            error=serializer.errors,
            message="Validation error"
        )


@extend_schema(
        tags=["Events"],
        responses={200: EventCategorySerializer},
        summary="Retrieve, Update, Destroy Event Category",
        description="Retrieve, update and destroy Event Category by id"
    )
class EventCategoryRetrieveUpdateDestroyView(
        mixins.SoftDeleteMixin,
        generics.RetrieveUpdateDestroyAPIView
    ):
    queryset = EventCategory.objects.all()
    serializer_class = EventCategorySerializer
    lookup_field = 'pk'

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return ok(
            data=serializer.data,
            message="",
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            self.perform_update(serializer)
            return ok(
                data=serializer.data,
                message="Event category updated successfully.",
            )
        return fail(
            error=serializer.errors,
            message="Validation error"
        )

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
            return ok(
                data=serializer.data,
                message="Event sub-category created successfully.",
                status=status.HTTP_201_CREATED
            )
        return fail(
            error=serializer.errors,
            message="Validation error",
        )


@extend_schema(
        tags=["Events"],
        responses={201: EventSubCategoryListSerializer},
        summary="Create, Update and Delete Event Sub Category",
        description="Create, Update and Delete Event Sub Category"
    )
class EventSubCategoryRetrieveUpdateDestroyView(
        mixins.SoftDeleteMixin,
        generics.RetrieveUpdateDestroyAPIView
    ):
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
        return ok(
            data=serializer.data,
            message="",
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            self.perform_update(serializer)
            return ok(
                data=serializer.data,
                message="Event sub-category updated successfully.",
            )
        return fail(
            error=serializer.errors,
            message="Validation error"
        )


@extend_schema(
        tags=["Events"],
        responses={201: EventListSerializer},
        summary="Event CRUD",
        description="Event CRUD"
    )
class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all().order_by('-created_at')
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'location']
    ordering_fields = ['published_at', 'created_at']

    def get_serializer_class(self):
        return EventListSerializer if self.action == 'list' else EventSerializer

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(published_by=user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return ok(
            data=serializer.data,
            message="Event details fetched successfully."
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return ok(
            data=serializer.data,
            message="Event created successfully.",
            status=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return ok(
            data=serializer.data,
            message="Event updated successfully."
        )
