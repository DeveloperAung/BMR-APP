from django import forms
from .models import EventCategory, EventSubCategory

class EventCategoryForm(forms.ModelForm):
    class Meta:
        model = EventCategory
        fields = ['title']

class EventSubCategoryForm(forms.ModelForm):
    class Meta:
        model = EventSubCategory
        fields = ['event_category', 'title'] 