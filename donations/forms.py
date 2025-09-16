from django import forms
from .models import DonationCategory, DonationSubCategory


class DonationCategoryForm(forms.ModelForm):
    class Meta:
        model = DonationCategory
        fields = ['title', 'is_date_required', 'is_multi_select_required']


class DonationSubCategoryForm(forms.ModelForm):
    class Meta:
        model = DonationSubCategory
        fields = ['donation_category', 'title'] 