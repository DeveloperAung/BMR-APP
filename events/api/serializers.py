from rest_framework import serializers
from ..models import EventCategory, EventSubCategory, Event, EventMediaInfo, EventMedia


class EventCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = EventCategory
        fields = ['id', 'title', 'title_others', 'is_active', 'is_menu', 'created_at']
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
            'id', 'title', 'title_others', 'event_category', 'event_category_title', 'created_at', 'is_menu', 'is_active'
        ]
        read_only_fields = ['id', 'event_category_title', 'created_at']

    def validate_title(self, value):
        if self.instance is None:
            if EventSubCategory.objects.filter(title__iexact=value).exists():
                raise serializers.ValidationError("A event subcategory with this title already exists.")
        else:
            if EventSubCategory.objects.filter(title__iexact=value).exclude(id=self.instance.id).exists():
                raise serializers.ValidationError("Another event subcategory with this title already exists.")
        return value


class EventSubCategoryListSerializer(EventSubCategorySerializer):
    class Meta(EventSubCategorySerializer.Meta):
        fields = ['id', 'title', 'title_others', 'event_category_title', 'created_at', 'is_active', 'is_menu']


class EventSerializer(serializers.ModelSerializer):
    category_title = serializers.CharField(source='category.title', read_only=True)
    published_by_email = serializers.CharField(source='published_by.email', read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'title_others', 'short_description', 'description', 'location',
            'category', 'category_title', 'cover_image', 'is_registered', 'is_short_course', 'max_seat',
            'is_published', 'published_at', 'created_at', 'is_active', 'published_by_email',
            'set_banner', 'banner_order'
        ]
        read_only_fields = ['id', 'category_title', 'published_by_email', 'created_at']

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance._request = self.context.get('request')
        instance.save()
        return instance

    def validate_title(self, value):
        if self.instance is None:
            if Event.objects.filter(title__iexact=value).exists():
                raise serializers.ValidationError("A event with this title already exists.")
        else:
            if Event.objects.filter(title__iexact=value).exclude(id=self.instance.id).exists():
                raise serializers.ValidationError("Another event with this title already exists.")
        return value

class EventListSerializer(EventSerializer):
    class Meta(EventSerializer.Meta):
        fields = ['id', 'title', 'title_others', 'category_title', 'is_published', 'published_at', 'created_at', 'is_active']

class EventMediaInfoSerializer(serializers.ModelSerializer):
    event_title = serializers.CharField(source='event.title', read_only=True)
    subcategory_title = serializers.CharField(source='sub_category.title', read_only=True)

    class Meta:
        model = EventMediaInfo
        fields = [
            'id', 'event_title', 'subcategory_title', 'event', 'sub_category', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'event_title', 'subcategory_title', 'is_active', 'created_at']

class EventMediaSerializer(serializers.ModelSerializer):
    event_title = serializers.CharField(source='media_info.event.title', read_only=True)
    subcategory_title = serializers.CharField(source='media_info.subcategory.title', read_only=True)

    class Meta:
        model = EventMedia
        fields = [
            'id',
            'media_info',
            'media_type',
            'title',
            'event_title',
            'subcategory_title',
            'media_location',
            'filename',
            'file_type',
            'media_date',
            'media_file',
            'embed_url',
            'downloaded_count',
            'created_at',
        ]
        read_only_fields = ['downloaded_count', 'created_at', 'event_name', 'subcategory_name']


class EventMediaUploadSerializer(serializers.Serializer):
    """
    For frontend upload form.
    """
    event = serializers.PrimaryKeyRelatedField(queryset=Event.objects.all())
    sub_category = serializers.PrimaryKeyRelatedField(queryset=EventSubCategory.objects.all())
    media_title = serializers.CharField(max_length=500)
    media_date = serializers.DateTimeField(required=False, allow_null=True)
    media_location = serializers.CharField(max_length=1500, required=False, allow_blank=True)
    media_files = serializers.ListField(
        child=serializers.FileField(),
        allow_empty=False,
        write_only=True
    )

    def create(self, validated_data):
        """
        Get or create EventMediaInfo, then bulk create EventMedia entries.
        """
        event = validated_data['event']
        sub_category = validated_data['sub_category']

        # Step 1: get_or_create EventMediaInfo
        media_info, created = EventMediaInfo.objects.get_or_create(
            event=event,
            sub_category=sub_category
        )

        # Step 2: prepare EventMedia objects
        media_title = validated_data['media_title']
        media_date = validated_data.get('media_date')
        media_location = validated_data.get('media_location', '')
        files = validated_data['media_files']

        media_objs = []
        for file in files:
            media_objs.append(EventMedia(
                media_info=media_info,
                media_type='file',
                title=media_title,
                media_location=media_location,
                filename=file.name,
                media_date=media_date,
                media_file=file
            ))

        # Step 3: bulk insert
        EventMedia.objects.bulk_create(media_objs)

        return {
            'media_info_id': media_info.id,
            'created_count': len(media_objs),
            'media_info_created': created
        }
