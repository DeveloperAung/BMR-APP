from rest_framework import serializers
from donations.models import Donation, EventDonationOption, DonationCategory, DonationSubCategory
from events.models import Event
from django.contrib.auth import get_user_model

User = get_user_model()


class DonationCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = DonationCategory
        fields = ("id", "title")


class DonationSubCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = DonationSubCategory
        fields = ("id", "title", "donation_category")


class EventDonationOptionSerializer(serializers.ModelSerializer):
    donation_category = DonationCategorySerializer(read_only=True)

    class Meta:
        model = EventDonationOption
        fields = ("id", "event", "donation_category", "amount", "is_active")


class DonationReadSerializer(serializers.ModelSerializer):
    donated_by = serializers.SerializerMethodField()
    event_option = EventDonationOptionSerializer(read_only=True)
    donation_category = DonationCategorySerializer(read_only=True)
    donation_sub_category = DonationSubCategorySerializer(read_only=True)

    class Meta:
        model = Donation
        fields = (
            "id",
            "uuid",
            "donation_type",
            "donation_category",
            "donation_sub_category",
            "event",
            "event_option",
            "amount",
            "donation_date",
            "donated_by",
            "created_at",
        )

    def get_donated_by(self, obj):
        if obj.donated_by:
            return {"id": obj.donated_by.id, "name": str(obj.donated_by)}
        return None


class DonationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Donation
        fields = (
            "donation_type",
            "donation_category",
            "donation_sub_category",
            "event",
            "event_option",
            "amount",
            "donation_date",
        )

    def validate(self, attrs):
        # Basic validation: if event donation, event must be provided
        donation_type = attrs.get("donation_type")
        event = attrs.get("event")
        event_option = attrs.get("event_option")
        if donation_type == "event" and not event:
            raise serializers.ValidationError({"event": "Event is required for event donations."})
        # If event_option provided ensure it matches event
        if event_option and event and event_option.event_id != event.id:
            raise serializers.ValidationError({"event_option": "Event option does not belong to the selected event."})
        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        donation = Donation(**validated_data)
        if user and user.is_authenticated:
            donation.donated_by = user
        donation.save()
        return donation
from rest_framework import serializers
from ..models import DonationCategory, DonationSubCategory


class DonationCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = DonationCategory
        fields = ['id', 'title', 'title_others', 'is_date_required', 'is_multi_select_required', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_title(self, value):
        instance = getattr(self, 'instance', None)
        if instance:
            if DonationCategory.objects.exclude(id=instance.id).filter(title=value).exists():
                raise serializers.ValidationError("A category with this title already exists.")
        else:
            if DonationCategory.objects.filter(title=value).exists():
                raise serializers.ValidationError("A category with this title already exists.")
        return value


class DonationSubCategoryListSerializer(serializers.ModelSerializer):
    donation_category_title = serializers.CharField(source='donation_category.title', read_only=True)
    
    class Meta:
        model = DonationSubCategory
        fields = ['id', 'title', 'title_others', 'donation_category', 'donation_category_title', 'is_active', 'created_at']
        read_only_fields = ['id', 'donation_category_title', 'created_at']



class DonationSubCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = DonationSubCategory
        fields = ['id', 'title', 'title_others', 'donation_category', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']
        
    def update(self, instance, validated_data):        
        is_active = validated_data.pop('is_active', None)
        if is_active is not None:
            instance.is_active = is_active
        return super().update(instance, validated_data)

    def validate_title(self, value):
        if self.instance is None:
            if DonationSubCategory.objects.filter(title__iexact=value).exists():
                raise serializers.ValidationError("A donation subcategory with this title already exists.")
        else:
            if DonationSubCategory.objects.filter(title__iexact=value).exclude(id=self.instance.id).exists():
                raise serializers.ValidationError("Another donation subcategory with this title already exists.")
        return value