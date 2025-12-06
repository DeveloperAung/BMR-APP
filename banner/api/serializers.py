from rest_framework import serializers
from posts.models import Post
from events.models import Event


class BannerBaseSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    model_name = serializers.CharField(read_only=True)
    title = serializers.CharField()
    cover_image = serializers.ImageField()
    set_banner = serializers.BooleanField()
    banner_order = serializers.IntegerField()
    detail_url = serializers.CharField(read_only=True)


class PostUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ['set_banner', 'banner_order']


class EventUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ['set_banner', 'banner_order']