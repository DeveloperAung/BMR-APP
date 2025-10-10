from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response

from posts.models import Post
from events.models import Event

from posts.api.serializers import PostSerializer
from events.api.serializers import EventSerializer
from .serializers import BannerBaseSerializer
from django.apps import apps

MODEL_MAP = {
    'post': apps.get_model('posts', 'Post'),
    'event': ('events', 'Event'),
}

@extend_schema(
        tags=["Banner"],
        responses={201: BannerBaseSerializer},
        summary="Banner Update"
    )
class BannerListAPIView(APIView):
    def get(self, request, *args, **kwargs):
        data = []

        for model_class in [Post, Event]:
            items = model_class.objects.filter(set_banner=True).order_by('banner_order')

            for obj in items:
                data.append({
                    'id': obj.id,
                    'model_name': model_class.__name__,
                    'title': obj.title,
                    'cover_image': obj.cover_image.url if obj.cover_image else None,
                    'set_banner': obj.set_banner,
                    'banner_order': obj.banner_order,
                    'detail_url': obj.get_absolute_url() if hasattr(obj, 'get_absolute_url') else None
                })

        serializer = BannerBaseSerializer(data, many=True)
        return Response(serializer.data)


class BannerUpdateAPIView(APIView):
    """
    PATCH /api/banners/<model>/<id>/update/
    Body: { "banner_order": <int>, "set_banner": <bool> }
    """
    permission_classes = [permissions.IsAuthenticated]  # change as needed

    def patch(self, request, model_name, object_id):
        model_name = model_name.lower()
        if model_name not in MODEL_MAP:
            return Response({"detail": "Invalid model"}, status=status.HTTP_400_BAD_REQUEST)

        Model = MODEL_MAP[model_name]
        instance = get_object_or_404(Model, pk=object_id)

        # Accept only a whitelist of fields
        allowed_fields = ('banner_order', 'set_banner')
        data = {k: v for k, v in request.data.items() if k in allowed_fields}

        if not data:
            return Response({"detail": "No valid fields provided"}, status=status.HTTP_400_BAD_REQUEST)

        # apply changes
        for field, val in data.items():
            setattr(instance, field, val)
        instance.save()

        # Build a small response payload
        resp = {
            "id": instance.pk,
            "model": model_name,
            "banner_order": getattr(instance, 'banner_order', None),
            "set_banner": getattr(instance, 'set_banner', None),
        }
        return Response(resp, status=status.HTTP_200_OK)

    # Optionally support PUT or POST if you prefer
    def post(self, request, model_name, object_id):
        return self.patch(request, model_name, object_id)