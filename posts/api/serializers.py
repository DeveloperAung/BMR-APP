from rest_framework import serializers
from ..models import PostCategory, Post


class PostCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PostCategory
        fields = ['id', 'title', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_title(self, value):
        instance = getattr(self, 'instance', None)
        if instance:
            if PostCategory.objects.exclude(id=instance.id).filter(title=value).exists():
                raise serializers.ValidationError("A category with this title already exists.")
        else:
            if PostCategory.objects.filter(title=value).exists():
                raise serializers.ValidationError("A category with this title already exists.")
        return value


class PostSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ['id', 'title', 'short_description', 'is_published', 'created_at']
        read_only_fields = ['id', 'created_at']


class PostDetailSerializer(serializers.ModelSerializer):

    published_by = serializers.CharField(source='published_by.username')
    post_category = serializers.CharField(source='post_category.title')
    parent = serializers.CharField(source='parent.title')
    media = serializers.CharField(source='media.title')
    class Meta:
        model = Post
        fields = ['id', 'title', 'short_description', 'description', 'is_published', 'post_category', 'parent', 'media', 'cover_image', 'set_banner', 'banner_order', 'published_at', 'published_by', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_title(self, value):
        instance = getattr(self, 'instance', None)
        if instance:
            if Post.objects.exclude(id=instance.id).filter(title=value).exists():
                raise serializers.ValidationError("A post with this title already exists.")
        else:
            if Post.objects.filter(title=value).exists():
                raise serializers.ValidationError("A post with this title already exists.")
        return value

