from django.shortcuts import render, get_object_or_404, redirect
from django.core.paginator import Paginator
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.views import View
from .models import EventCategory, EventSubCategory, Event
from .forms import EventCategoryForm, EventSubCategoryForm
from django.conf import settings

# Create your views here.

def EventCategoryList(request):
    return render(request, 'private/events/category/list.html')


class CategoryCreateView(View):
    """View for creating donation categories - template only, JS handles everything"""
    template_name = 'private/events/category/create.html'

    def get(self, request):
        """Display the category creation form"""
        context = {
            'mode': 'create',
            'page_title': 'Create Donation Category'
        }
        return render(request, self.template_name, context)


class CategoryEditView(View):
    template_name = 'private/events/category/create.html'

    def get(self, request, pk):
        try:
            category = get_object_or_404(EventCategory, pk=pk)
        except:
            category = None

        context = {
            'mode': 'edit',
            'category_id': pk,
            'category': category,
            'page_title': f'Edit Category: {category.title if category else "Unknown"}'
        }
        return render(request, self.template_name, context)


def EventSubCategoryList(request):
    return render(request, 'private/events/subcategory/list.html')


class SubCategoryCreateView(View):
    """View for creating event subcategories - template only, JS handles everything"""
    template_name = 'private/events/subcategory/create.html'
    
    def get(self, request):
        """Display the subcategory creation form"""
        # Get active categories for the dropdown
        categories = EventCategory.objects.filter(is_active=True).order_by('title')
        
        context = {
            'mode': 'create',
            'page_title': 'Create Event Subcategory',
            'categories': categories
        }
        return render(request, self.template_name, context)


class SubCategoryEditView(View):
    """View for editing event subcategories - template only, JS handles everything"""
    template_name = 'private/events/subcategory/create.html'  
    
    def get(self, request, pk):
        """Display the subcategory edit form"""
        
        categories = EventCategory.objects.filter(is_active=True).order_by('title')
                
        try:
            subcategory = get_object_or_404(EventSubCategory, pk=pk)
        except:
            subcategory = None

        context = {
            'mode': 'edit',
            'subcategory_id': pk,
            'subcategory': subcategory,  # May be None if not found
            'categories': categories,
            'page_title': f'Edit Subcategory: {subcategory.title if subcategory else "Unknown"}'
        }
        return render(request, self.template_name, context)


def EventList(request):
    return render(request, 'private/events/events/list.html')


class EventCreateView(View):
    """View for creating event subcategories - template only, JS handles everything"""
    template_name = 'private/events/events/create.html'

    def get(self, request):
        """Display the subcategory creation form"""
        # Get active categories for the dropdown
        categories = EventCategory.objects.filter(is_active=True).order_by('title')

        context = {
            'mode': 'create',
            'page_title': 'Create Event',
            'categories': categories,
            'subcategories': EventSubCategory.objects.filter(is_active=True).order_by('title'),
        }
        return render(request, self.template_name, context)


class EventEditView(View):
    template_name = 'private/events/events/create.html'

    def get(self, request, pk):
        categories = EventCategory.objects.filter(is_active=True).order_by('title')
        subcategories = EventSubCategory.objects.filter(is_active=True).order_by('title')

        try:
            event = get_object_or_404(Event, pk=pk)
        except:
            event = None

        context = {
            'mode': 'edit',
            'subcategory_id': pk,
            'event': event,
            'categories': categories,
            'subcategories': subcategories,
            'page_title': f'Edit Event: {event.title if event else "Unknown"}'
        }
        return render(request, self.template_name, context)
