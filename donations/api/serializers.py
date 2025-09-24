from rest_framework import serializers
from ..models import DonationCategory, DonationSubCategory


class DonationCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = DonationCategory
        fields = ['id', 'title', 'is_date_required', 'is_multi_select_required', 'is_active', 'created_at']
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
        fields = ['id', 'title', 'donation_category', 'donation_category_title', 'is_active', 'created_at']
        read_only_fields = ['id', 'donation_category_title', 'created_at']



class DonationSubCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = DonationSubCategory
        fields = ['id', 'title', 'donation_category', 'is_active', 'created_at']
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