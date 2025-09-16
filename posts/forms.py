from django import forms
from .models import PostCategory

class PostCategoryForm(forms.ModelForm):
    class Meta:
        model = PostCategory
        fields = ['title'] 
