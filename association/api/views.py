from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import viewsets, permissions, filters
from association.models import Association, AssociationPosts
from association.api.serializers import AssociationSerializer, AssociationPostSerializer
from core.utils.pagination import StandardResultsSetPagination


@extend_schema(
    tags=["Association"],
)
class AssociationViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows associations to be viewed or edited.
    """
    queryset = Association.objects.all()
    serializer_class = AssociationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(modified_by=self.request.user)


@extend_schema(
    tags=["Association"],
)
class AssociationPostViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows association posts to be viewed or edited.
    """
    queryset = AssociationPosts.objects.all()
    serializer_class = AssociationPostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_published', 'published_by']
    search_fields = ['title', 'content']
    ordering_fields = ['published_at', 'title']
    ordering = ['-published_at']

    pagination_class = StandardResultsSetPagination  # 👈 DRF auto-uses this unless you override `list()`

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        paginator = StandardResultsSetPagination()
        paginated_qs = paginator.paginate_queryset(queryset, request)
        serializer = self.get_serializer(paginated_qs, many=True)

        return paginator.get_paginated_response(serializer.data)

    def perform_create(self, serializer):
        """
        Automatically assign `published_by` and `published_at` if is_published is True on creation.
        """
        is_published = serializer.validated_data.get('is_published', False)
        if is_published:
            serializer.save(
                created_by=self.request.user,
                published_by=self.request.user,
                published_at=timezone.now()
            )
        else:
            serializer.save()

    def perform_update(self, serializer):
        """
        Automatically assign `published_by` and `published_at` if post is being published now.
        """
        instance = serializer.instance
        is_published_before = instance.is_published
        is_published_now = serializer.validated_data.get('is_published', is_published_before)

        if is_published_now and not is_published_before:
            serializer.save(
                published_by=self.request.user,
                published_at=timezone.now(),
                modified_by=self.request.user
            )
        else:
            serializer.save()
