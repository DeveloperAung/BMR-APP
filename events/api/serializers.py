from rest_framework import serializers
from ..models import EventCategory, EventSubCategory


class EventCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = EventCategory
        fields = ['id', 'title', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_title(self, value):
        instance = getattr(self, 'instance', None)
        if instance:
            if EventCategory.objects.exclude(id=instance.id).filter(title=value).exists():
                raise serializers.ValidationError("A category with this title already exists.")
        else:
            if EventCategory.objects.filter(title=value).exists():
                raise serializers.ValidationError("A category with this title already exists.")
        return value

class EventSubCategorySerializer(serializers.ModelSerializer):
    event_category_title = serializers.CharField(source='event_category.title', read_only=True)
    
    class Meta:
        model = EventSubCategory
        fields = [
            'id', 'title', 'event_category', 'event_category_title', 'created_at'
        ]
        read_only_fields = ['id', 'event_category_title', 'created_at']


class EventSubCategoryListSerializer(EventSubCategorySerializer):
    class Meta(EventSubCategorySerializer.Meta):
        fields = ['id', 'title', 'event_category_title', 'created_at']

    def validate_title(self, value):
        if self.instance is None:
            if EventSubCategory.objects.filter(title__iexact=value).exists():
                raise serializers.ValidationError("A event subcategory with this title already exists.")
        else:
            if EventSubCategory.objects.filter(title__iexact=value).exclude(id=self.instance.id).exists():
                raise serializers.ValidationError("Another event subcategory with this title already exists.")
        return value