from rest_framework import serializers
from ..models import PostCategory, Post


class PostCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PostCategory
        fields = ['id', 'title', 'title_others', 'is_active', 'created_at']
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
        fields = ['id', 'title', 'short_description', 'is_published', 'published_at', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class PostDetailSerializer(serializers.ModelSerializer):
    title = serializers.CharField(required=False)
    short_description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    post_category = serializers.PrimaryKeyRelatedField(queryset=PostCategory.objects.all(), required=False,
                                                       allow_null=True)
    parent = serializers.PrimaryKeyRelatedField(queryset=Post.objects.all(), required=False, allow_null=True)

    published_by_name = serializers.CharField(source='published_by.username', read_only=True)
    post_category_title = serializers.CharField(source='post_category.title', read_only=True)
    parent_title = serializers.CharField(source='parent.title', read_only=True)
    cover_image = serializers.ImageField(required=False, allow_null=True)
    # media = serializers.CharField(source='media.title')
    class Meta:
        model = Post
        fields = [
            'id',
            'title',
            'title_others',
            'short_description',
            'description',
            'is_published',
            'post_category',
            'post_category_title',
            'parent',
            'parent_title',
            'media',
            'cover_image',
            'set_banner',
            'banner_order',
            'published_at',
            'published_by',
            'published_by_name',
            'created_at',
            'is_active'
        ]
        read_only_fields = ['id', 'created_at', 'published_by_name', 'post_category_title', 'parent_title']

    def validate_title(self, value):
        instance = getattr(self, 'instance', None)
        if instance:
            if Post.objects.exclude(id=instance.id).filter(title=value).exists():
                raise serializers.ValidationError("A post with this title already exists.")
        else:
            if Post.objects.filter(title=value).exists():
                raise serializers.ValidationError("A post with this title already exists.")
        return value

