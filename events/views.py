from django.shortcuts import render, get_object_or_404, redirect
from django.core.paginator import Paginator
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from .models import EventCategory, EventSubCategory
from .forms import EventCategoryForm, EventSubCategoryForm
from django.conf import settings

# Create your views here.

def event_category_list(request):
    return render(request, 'private/events/category/list.html')


def event_sub_category_list(request):
    return render(request, 'private/events/subcategory/list.html')


def event_category_create(request):
    if request.method == 'POST':
        form = EventCategoryForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Event category created successfully.')
            return redirect('event_category_list')
    else:
        form = EventCategoryForm()
    
    return render(request, 'private/events/category/form.html', {'form': form, 'title': 'Create Event Category'})

def event_category_update(request, pk):
    category = get_object_or_404(EventCategory, pk=pk)
    if request.method == 'POST':
        form = EventCategoryForm(request.POST, instance=category)
        if form.is_valid():
            form.save()
            messages.success(request, 'Event category updated successfully.')
            return redirect('event_category_list')
    else:
        form = EventCategoryForm(instance=category)
    
    return render(request, 'private/events/category/form.html', {'form': form, 'title': 'Update Event Category'})

@require_POST
def event_category_delete(request, pk):
    category = get_object_or_404(EventCategory, pk=pk)
    category.delete()
    messages.success(request, 'Event category deleted successfully.')
    return redirect('event_category_list')

def event_sub_category_create(request):
    if request.method == 'POST':
        form = EventSubCategoryForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Event sub category created successfully.')
            return redirect('event_sub_category_list')
    else:
        form = EventSubCategoryForm()
    
    return render(request, 'private/events/sub_category/form.html', {'form': form, 'title': 'Create Event Sub Category'})

def event_sub_category_update(request, pk):
    sub_category = get_object_or_404(EventSubCategory, pk=pk)
    if request.method == 'POST':
        form = EventSubCategoryForm(request.POST, instance=sub_category)
        if form.is_valid():
            form.save()
            messages.success(request, 'Event sub category updated successfully.')
            return redirect('event_sub_category_list')
    else:
        form = EventSubCategoryForm(instance=sub_category)
    
    return render(request, 'private/events/sub_category/form.html', {'form': form, 'title': 'Update Event Sub Category'})

@require_POST
def event_sub_category_delete(request, pk):
    sub_category = get_object_or_404(EventSubCategory, pk=pk)
    sub_category.delete()
    messages.success(request, 'Event sub category deleted successfully.')
    return redirect('event_sub_category_list')
