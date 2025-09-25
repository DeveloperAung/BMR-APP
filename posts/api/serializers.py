from rest_framework import serializers
from ..models import PostCategory


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

