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
    q = request.GET.get('q', '').strip()
    per_page = request.GET.get('per_page', settings.DEFAULT_PER_PAGE)
    options = getattr(settings, 'PER_PAGE_OPTIONS', [10, 25, 50, 100])
    categories = EventCategory.objects.all()
    if q:
        categories = categories.filter(title__icontains=q)
    try:
        per_page = int(per_page)
        if per_page not in options:
            per_page = settings.DEFAULT_PER_PAGE
    except ValueError:
        per_page = settings.DEFAULT_PER_PAGE
    paginator = Paginator(categories, per_page)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    total_count = paginator.count
    start_index = page_obj.start_index() if total_count > 0 else 0
    end_index = page_obj.end_index() if total_count > 0 else 0
    # Pagination context
    total_pages = page_obj.paginator.num_pages
    current_page = page_obj.number
    if total_pages <= 7:
        page_numbers = list(range(1, total_pages + 1))
        show_first_ellipsis = show_last_ellipsis = False
    else:
        if current_page <= 4:
            page_numbers = list(range(1, 6)) + [total_pages]
            show_first_ellipsis = False
            show_last_ellipsis = True
        elif current_page >= total_pages - 3:
            page_numbers = [1] + list(range(total_pages - 4, total_pages + 1))
            show_first_ellipsis = True
            show_last_ellipsis = False
        else:
            page_numbers = [1, current_page - 1, current_page, current_page + 1, total_pages]
            show_first_ellipsis = show_last_ellipsis = True
    query_params = request.GET.copy()
    if 'page' in query_params:
        query_params.pop('page')
    query_params = query_params.dict()
    context = {
        'categories': page_obj.object_list,
        'page_obj': page_obj,
        'per_page': per_page,
        'q': q,
        'total_count': total_count,
        'start_index': start_index,
        'end_index': end_index,
        'options': options,
        'query_params': query_params,
        'page_numbers': page_numbers,
        'show_first_ellipsis': show_first_ellipsis,
        'show_last_ellipsis': show_last_ellipsis,
    }
    return render(request, 'private/events/category/list.html', context)

def event_sub_category_list(request):
    q = request.GET.get('q', '').strip()
    per_page = request.GET.get('per_page', settings.DEFAULT_PER_PAGE)
    options = getattr(settings, 'PER_PAGE_OPTIONS', [10, 25, 50, 100])
    category_id = request.GET.get('category', '')
    sub_categories = EventSubCategory.objects.select_related('event_category').all()
    if q:
        sub_categories = sub_categories.filter(title__icontains=q)
    if category_id:
        sub_categories = sub_categories.filter(event_category_id=category_id)
    try:
        per_page = int(per_page)
        if per_page not in options:
            per_page = settings.DEFAULT_PER_PAGE
    except ValueError:
        per_page = settings.DEFAULT_PER_PAGE
    paginator = Paginator(sub_categories, per_page)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    total_count = paginator.count
    start_index = page_obj.start_index() if total_count > 0 else 0
    end_index = page_obj.end_index() if total_count > 0 else 0
    # Pagination context
    total_pages = page_obj.paginator.num_pages
    current_page = page_obj.number
    if total_pages <= 7:
        page_numbers = list(range(1, total_pages + 1))
        show_first_ellipsis = show_last_ellipsis = False
    else:
        if current_page <= 4:
            page_numbers = list(range(1, 6)) + [total_pages]
            show_first_ellipsis = False
            show_last_ellipsis = True
        elif current_page >= total_pages - 3:
            page_numbers = [1] + list(range(total_pages - 4, total_pages + 1))
            show_first_ellipsis = True
            show_last_ellipsis = False
        else:
            page_numbers = [1, current_page - 1, current_page, current_page + 1, total_pages]
            show_first_ellipsis = show_last_ellipsis = True
    query_params = request.GET.copy()
    if 'page' in query_params:
        query_params.pop('page')
    query_params = query_params.dict()
    categories = EventCategory.objects.all()
    context = {
        'sub_categories': page_obj.object_list,
        'page_obj': page_obj,
        'per_page': per_page,
        'q': q,
        'category_id': category_id,
        'categories': categories,
        'total_count': total_count,
        'start_index': start_index,
        'end_index': end_index,
        'options': options,
        'query_params': query_params,
        'page_numbers': page_numbers,
        'show_first_ellipsis': show_first_ellipsis,
        'show_last_ellipsis': show_last_ellipsis,
    }
    return render(request, 'private/events/sub_category/list.html', context)

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
