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
    return render(request, 'private/donations/category/list.html')


def donation_sub_category_list(request):
    return render(request, 'private/donations/subcategory/list.html')


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
