from drf_spectacular.utils import extend_schema
from rest_framework import status, generics, filters
from rest_framework.permissions import IsAuthenticated, DjangoModelPermissions
from django_filters.rest_framework import DjangoFilterBackend

from core.utils.pagination import StandardResultsSetPagination
from ..models import PostCategory
from .serializers import PostCategorySerializer
from core.utils.responses import ok, fail


@extend_schema(
    tags=["Posts"],
    request={
        'type': 'object',
        'properties': {
            'refresh': {'type': 'string'}
        }
    },
    responses={200: dict},
    summary="Posts Management",
    description="Posts Management"
)
class PostCategoryListCreateView(generics.ListCreateAPIView):
    serializer_class = PostCategorySerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['title']
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        show_all = self.request.query_params.get('show_all', '').lower() == 'true'
        queryset = PostCategory.objects.all()
        if not show_all:
            queryset = queryset.filter(is_active=True)
        return queryset.order_by('-created_at')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return ok(
            data={"results": serializer.data},
            message="Post categories retrieved successfully"
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            return ok(
                serializer.data,
                "Post category created successfully.",
                status=status.HTTP_201_CREATED
            )
        return fail(
            serializer.errors,
            "Validation error",
            status.HTTP_400_BAD_REQUEST
        )


@extend_schema(
    tags=["Posts"],
    request={
        'type': 'object',
        'properties': {
            'refresh': {'type': 'string'}
        }
    },
    responses={200: dict},
    summary="Posts Management",
    description="Posts Management"
)
class PostCategoryRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PostCategory.objects.all()
    serializer_class = PostCategorySerializer
    lookup_field = 'pk'
    permission_classes = [IsAuthenticated]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return ok(
            serializer.data,
            "Post Category retrieved successfully."
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            self.perform_update(serializer)
            return ok(
                serializer.data,
                "Post category updated successfully."
            )
        return fail(
            "Validation error",
            status.HTTP_400_BAD_REQUEST,
            serializer.errors
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Perform soft delete by setting is_active=False
        instance.is_active = False
        instance.save(update_fields=['is_active'])
        return ok(
            {"id": instance.id, "is_active": False},
            "Post category has been deactivated successfully."
        )
