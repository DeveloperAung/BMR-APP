from rest_framework import serializers
from ..models import PostCategory


class PostCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PostCategory
        fields = ['id', 'title', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']
