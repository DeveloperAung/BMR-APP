from rest_framework import serializers
from ..models import DonationCategory, DonationSubCategory


class DonationCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = DonationCategory
        fields = ['id', 'title', 'is_date_required', 'is_multi_select_required', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


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
