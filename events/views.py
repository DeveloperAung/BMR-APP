import json

from django.shortcuts import render, get_object_or_404, redirect
from django.core.paginator import Paginator
from django.contrib import messages
from django.http import JsonResponse
from datetime import date
from django.utils.safestring import mark_safe
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

        try:
            event = get_object_or_404(Event, pk=pk)
        except:
            event = None

        context = {
            'mode': 'edit',
            'subcategory_id': pk,
            'event': event,
            "event_dates_json": mark_safe(json.dumps(event.event_dates or [])),
            'categories': categories,
            'page_title': f'Edit Event: {event.title if event else "Unknown"}'
        }
        return render(request, self.template_name, context)


def EventMediaInfoList(request):
    return render(request, 'private/events/event_media_info/list.html')


def EventMediaList(request):
    return render(request, 'private/events/event_media/list.html')


def EventMediaInfoDetails(request):
    return render(request, 'private/events/event_media_info/details.html')

def event_medias(request):
    events = Event.objects.filter(is_active=True).order_by('title')
    return render(request, 'public/events/details.html', {'events': events})

class EventMediaCreate(View):
    template_name = 'private/events/event_media/create.html'

    def get(self, request):
        events = Event.objects.filter(is_active=True).order_by('title')
        subcategories = EventSubCategory.objects.filter(is_active=True).order_by('title')

        context = {
            'mode': 'edit',
            'subcategories': subcategories,
            'events': events,
            'page_title': f'Create Event Media'
        }
        return render(request, self.template_name, context)
    

def event_details(request, title_others):
    category = get_object_or_404(EventCategory, title_others=title_others, is_active=True)
    events = Event.objects.filter(category=category, is_active=True).prefetch_related("event_media_info__event_media_info")

    # association_posts = AssociationPosts.objects.filter(is_active=True)

    context = {
        'events': events,
        'category': category,
        # 'association_posts': association_posts,
    }
    return render(request, 'public/events/event-details.html', context)


def public_event_list(request):
    filter_key = request.GET.get('filter', 'all').lower()
    today = date.today()

    base_qs = Event.objects.filter(is_active=True, is_published=True).order_by('-published_at', '-created_at')

    filtered = []
    for ev in base_qs:
        parsed_dates = []
        for d in ev.event_dates or []:
            try:
                parsed_dates.append(date.fromisoformat(str(d)))
            except (ValueError, TypeError):
                continue

        ev.first_event_date = min(parsed_dates) if parsed_dates else None
        ev.last_event_date = max(parsed_dates) if parsed_dates else None
        ev._parsed_dates = parsed_dates 

        if filter_key == 'upcoming':
            if parsed_dates and any(d >= today for d in parsed_dates):
                filtered.append(ev)
        elif filter_key == 'completed':
            if parsed_dates and all(d < today for d in parsed_dates):
                filtered.append(ev)
        else:
            filtered.append(ev)

    paginator = Paginator(filtered, 10)  # Show 10 events per page
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    return render(request, 'public/events/event-list.html', {
        'page_obj': page_obj,
        'filter_key': filter_key,
    })
