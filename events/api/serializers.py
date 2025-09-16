from rest_framework import serializers
from ..models import EventCategory, EventSubCategory


class EventCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = EventCategory
        fields = ['id', 'title', 'created_at']
        read_only_fields = ['id', 'created_at']


class EventSubCategorySerializer(serializers.ModelSerializer):
    event_category_title = serializers.CharField(source='event_category.title', read_only=True)
    
    class Meta:
        model = EventSubCategory
        fields = [
            'id', 'title', 'event_category', 'event_category_title',
            'created_at'
        ]
        read_only_fields = ['id', 'event_category_title', 'created_at']


class EventSubCategoryListSerializer(EventSubCategorySerializer):
    class Meta(EventSubCategorySerializer.Meta):
        fields = ['id', 'title', 'event_category_title', 'created_at']
