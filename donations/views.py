from django.shortcuts import render, get_object_or_404, redirect
from django.http import HttpResponse, JsonResponse
from django.urls import reverse
from django.core.paginator import Paginator
from .models import DonationCategory, DonationSubCategory
from .forms import DonationCategoryForm, DonationSubCategoryForm
import csv
from django.utils.http import urlencode
from django.conf import settings


def donation_category_list(request):
    q = request.GET.get('q', '').strip()
    per_page = request.GET.get('per_page', settings.DEFAULT_PER_PAGE)
    is_date_required = request.GET.get('is_date_required', '')
    is_multi_select_required = request.GET.get('is_multi_select_required', '')
    order_by = request.GET.get('order_by', 'id')
    order_dir = request.GET.get('order_dir', 'asc')
    options = getattr(settings, 'PER_PAGE_OPTIONS', [10, 25, 50, 100])
    valid_columns = {'id': 'id', 'title': 'title', 'is_date_required': 'is_date_required', 'is_multi_select_required': 'is_multi_select_required'}
    order_field = valid_columns.get(order_by, 'id')
    if order_dir == 'desc':
        order_field = '-' + order_field

    categories = DonationCategory.objects.all()
    if q:
        categories = categories.filter(title__icontains=q)
    if is_date_required in ['yes', 'no']:
        categories = categories.filter(is_date_required=(is_date_required == 'yes'))
    if is_multi_select_required in ['yes', 'no']:
        categories = categories.filter(is_multi_select_required=(is_multi_select_required == 'yes'))
    categories = categories.order_by(order_field)

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
        'is_date_required': is_date_required,
        'is_multi_select_required': is_multi_select_required,
        'total_count': total_count,
        'start_index': start_index,
        'end_index': end_index,
        'order_by': order_by,
        'order_dir': order_dir,
        'options': options,
        'query_params': query_params,
        'page_numbers': page_numbers,
        'show_first_ellipsis': show_first_ellipsis,
        'show_last_ellipsis': show_last_ellipsis,
    }
    return render(request, 'private/donations/category/list.html', context)

def donation_category_create(request):
    if request.method == 'POST':
        form = DonationCategoryForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('donation_category_list')
    else:
        form = DonationCategoryForm()
    return render(request, 'private/donations/category/form.html', {'form': form})

def donation_category_update(request, pk):
    category = get_object_or_404(DonationCategory, pk=pk)
    if request.method == 'POST':
        form = DonationCategoryForm(request.POST, instance=category)
        if form.is_valid():
            form.save()
            return redirect('donation_category_list')
    else:
        form = DonationCategoryForm(instance=category)
    return render(request, 'private/donations/category/form.html', {'form': form, 'category': category})

def donation_category_delete(request, pk):
    category = get_object_or_404(DonationCategory, pk=pk)
    if request.method == 'POST':
        category.delete()
        return redirect('donation_category_list')
    return render(request, 'private/donations/category/confirm_delete.html', {'category': category})

def donation_category_export_csv(request):
    categories = DonationCategory.objects.all()
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="donation_categories.csv"'
    writer = csv.writer(response)
    writer.writerow(['ID', 'Title', 'Date Required', 'Multi Select'])
    for c in categories:
        writer.writerow([c.id, c.title, c.is_date_required, c.is_multi_select_required])
    return response

def donation_sub_category_list(request):
    q = request.GET.get('q', '').strip()
    per_page = request.GET.get('per_page', settings.DEFAULT_PER_PAGE)
    category_id = request.GET.get('category', '')
    order_by = request.GET.get('order_by', 'id')
    order_dir = request.GET.get('order_dir', 'asc')
    options = getattr(settings, 'PER_PAGE_OPTIONS', [10, 25, 50, 100])
    valid_columns = {'id': 'id', 'title': 'title', 'donation_category': 'donation_category__title'}
    order_field = valid_columns.get(order_by, 'id')
    if order_dir == 'desc':
        order_field = '-' + order_field

    sub_categories = DonationSubCategory.objects.select_related('donation_category').all()
    if q:
        sub_categories = sub_categories.filter(title__icontains=q)
    if category_id:
        sub_categories = sub_categories.filter(donation_category_id=category_id)
    sub_categories = sub_categories.order_by(order_field)

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

    categories = DonationCategory.objects.all()
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
        'order_by': order_by,
        'order_dir': order_dir,
        'options': options,
        'query_params': query_params,
        'page_numbers': page_numbers,
        'show_first_ellipsis': show_first_ellipsis,
        'show_last_ellipsis': show_last_ellipsis,
    }
    return render(request, 'private/donations/sub_category/list.html', context)

def donation_sub_category_create(request):
    if request.method == 'POST':
        form = DonationSubCategoryForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('donation_sub_category_list')
    else:
        form = DonationSubCategoryForm()
    return render(request, 'private/donations/sub_category/form.html', {'form': form})

def donation_sub_category_update(request, pk):
    sub_category = get_object_or_404(DonationSubCategory, pk=pk)
    if request.method == 'POST':
        form = DonationSubCategoryForm(request.POST, instance=sub_category)
        if form.is_valid():
            form.save()
            return redirect('donation_sub_category_list')
    else:
        form = DonationSubCategoryForm(instance=sub_category)
    return render(request, 'private/donations/sub_category/form.html', {'form': form, 'sub_category': sub_category})

def donation_sub_category_delete(request, pk):
    sub_category = get_object_or_404(DonationSubCategory, pk=pk)
    if request.method == 'POST':
        sub_category.delete()
        return redirect('donation_sub_category_list')
    return render(request, 'private/donations/sub_category/confirm_delete.html', {'sub_category': sub_category})

def donation_sub_category_export_csv(request):
    sub_categories = DonationSubCategory.objects.select_related('donation_category').all()
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="donation_sub_categories.csv"'
    writer = csv.writer(response)
    writer.writerow(['ID', 'Category', 'Title'])
    for sc in sub_categories:
        writer.writerow([sc.id, sc.donation_category.title if sc.donation_category else '', sc.title])
    return response
