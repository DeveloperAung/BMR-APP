from django.utils import timezone
from rest_framework import serializers
from association.models import Association, AssociationPosts


class AssociationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Association
        fields = [
            'id', 'name', 'short_description', 'description',
            'is_published', 'published_at', 'published_by',
            'created_at', 'created_by', 'modified_at', 'modified_by'
        ]
        read_only_fields = ['id', 'created_at', 'created_by', 'modified_at', 'modified_by']


class AssociationPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssociationPosts
        fields = [
            'id', 'title', 'content', 'is_published', 'published_at', 'published_by',
            'created_at', 'created_by', 'modified_at', 'modified_by', 'is_active'
        ]
        read_only_fields = ['id', 'created_at', 'created_by', 'modified_at', 'modified_by']

    def update(self, instance, validated_data):
        is_published_now = validated_data.get('is_published', instance.is_published)

        # If publishing now and wasn't published before
        if is_published_now and not instance.is_published:
            instance.published_by = self.context['request'].user
            instance.published_at = timezone.now()

        return super().update(instance, validated_data)