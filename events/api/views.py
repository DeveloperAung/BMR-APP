from rest_framework import status, generics, filters, viewsets
from rest_framework.generics import ListAPIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, DjangoModelPermissions
from django_filters.rest_framework import DjangoFilterBackend

from core.utils import mixins
from core.utils.pagination import StandardResultsSetPagination
from core.utils.responses import ok, fail
from ..models import EventCategory, EventSubCategory, Event, EventMedia, EventMediaInfo
from .serializers import (
    EventCategorySerializer,
    EventSubCategorySerializer,
    EventSubCategoryListSerializer, EventListSerializer, EventSerializer, EventMediaUploadSerializer,
    EventMediaSerializer, EventMediaInfoSerializer
)
from drf_spectacular.utils import (
    extend_schema, OpenApiExample, OpenApiResponse, OpenApiParameter
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
        # responses={201: EventSubCategoryListSerializer},
        summary="Create, Update and Delete Event Sub Category",
        description="Create, Update and Delete Event Sub Category",
        parameters=[
            OpenApiParameter(
                name="event_id",
                description="Filter subcategories by event ID (for list mode)",
                required=False,
                type=int,
                location=OpenApiParameter.QUERY,
            )
        ],
        responses={
            200: EventSubCategoryListSerializer(many=True),
            201: EventSubCategorySerializer,
        },
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

@extend_schema(
    tags=["Events"],
    summary="Media files for an event",
    description="Retrieve a paginated list of media files for events, ordered and filtered as specified.",
    responses={200: EventMediaInfoSerializer(many=True)}
)
class EventMediaInfoView(ListAPIView):
    queryset = EventMediaInfo.objects.all().order_by('-created_at')
    serializer_class = EventMediaInfoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['event__title', 'sub_category__title']
    ordering_fields = ['created_at']
    pagination_class = StandardResultsSetPagination

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        return response


@extend_schema(
    tags=["Events"],
    summary="List subcategories related to a specific event",
    description="Retrieve unique subcategories that have media linked to the given event ID via EventMediaInfo.",
    responses={200: EventSubCategoryListSerializer(many=True)},
)
class EventSubCategoryByEventView(generics.ListAPIView):
    serializer_class = EventSubCategoryListSerializer

    def get_queryset(self):
        event_id = self.kwargs.get("event_id")

        # ✅ Get unique subcategories linked through EventMediaInfo
        subcategory_ids = (
            EventMediaInfo.objects.filter(event_id=event_id)
            .values_list("sub_category_id", flat=True)
            .distinct()
        )

        return EventSubCategory.objects.filter(id__in=subcategory_ids, is_active=True).order_by("title")


@extend_schema(
    tags=["Events"],
    summary="Upload multiple media files for an event",
    request={
        "multipart/form-data": {
            "type": "object",
            "properties": {
                "event": {"type": "integer", "example": 1, "description": "Event ID"},
                "sub_category": {"type": "integer", "example": 2, "description": "SubCategory ID"},
                "media_title": {"type": "string", "example": "Meditation Day 2024 Photos"},
                "media_date": {"type": "string", "format": "date-time", "example": "2025-10-06T09:00:00Z"},
                "media_location": {"type": "string", "example": "Singapore Dhamma Center"},
                "media_files": {
                    "type": "array",
                    "items": {"type": "string", "format": "binary"},
                    "description": "Attach one or more media files",
                },
            },
            "required": ["event", "sub_category", "media_title", "media_files"],
        }
    },
    responses={
        201: OpenApiResponse(
            description="Media uploaded successfully",
            examples=[
                OpenApiExample(
                    "Example success",
                    value={
                        "success": True,
                        "message": "Media uploaded successfully.",
                        "data": {
                            "media_info_id": 12,
                            "created_count": 3,
                            "media_info_created": True,
                        },
                    },
                )
            ],
        ),
    },
)
class EventMediaUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    """
    Handle multiple media uploads for a specific event & subcategory.
    """
    def post(self, request, *args, **kwargs):
        serializer = EventMediaUploadSerializer(data=request.data)
        if serializer.is_valid():
            result = serializer.save()
            return ok(
                message= "Media uploaded successfully.",
                data=result
            )
        return fail(
            error=serializer.errors,
        )


@extend_schema(
        tags=["Events"],
        responses={201: EventMediaSerializer(many=True)},
        summary="Event Media CRUD",
        description="Event Media CRUD"
    )
class EventMediaViewSet(viewsets.ModelViewSet):
    queryset = EventMedia.objects.all().order_by('-created_at')
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'media_info', 'media_type']
    ordering_fields = ['created_at']

    def get_serializer_class(self):
        return EventMediaSerializer # if self.action == 'list' else EventSerializer
