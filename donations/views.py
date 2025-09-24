from django.contrib.auth.decorators import login_required
from django.shortcuts import render, get_object_or_404, redirect
from django.http import HttpResponse
from django.utils.decorators import method_decorator
from django.views import View

from .models import DonationCategory, DonationSubCategory
from .forms import DonationCategoryForm, DonationSubCategoryForm
import csv


def DonationCategoryList(request):
    return render(request, 'private/donations/category/list.html')


class CategoryCreateView(View):
    """View for creating donation categories - template only, JS handles everything"""
    template_name = 'private/donations/category/create.html'

    def get(self, request):
        """Display the category creation form"""
        context = {
            'mode': 'create',
            'page_title': 'Create Donation Category'
        }
        return render(request, self.template_name, context)


class CategoryEditView(View):
    """View for editing donation categories - template only, JS handles everything"""
    template_name = 'private/donations/category/create.html'  # Same template, different mode

    def get(self, request, pk):
        """Display the category edit form"""
        # Get category for basic info (title for breadcrumb, etc.)
        # No auth check here - JS will handle authentication
        try:
            category = get_object_or_404(DonationCategory, pk=pk)
        except:
            # If category not found, still show template - JS will handle the error
            category = None

        context = {
            'mode': 'edit',
            'category_id': pk,
            'category': category,  # May be None if not found
            'page_title': f'Edit Category: {category.title if category else "Unknown"}'
        }
        return render(request, self.template_name, context)


def DonationSubCategoryList(request):
    """View for listing donation subcategories"""
    return render(request, 'private/donations/subcategory/list.html')


class SubCategoryCreateView(View):
    """View for creating donation subcategories - template only, JS handles everything"""
    template_name = 'private/donations/subcategory/create.html'
    
    def get(self, request):
        """Display the subcategory creation form"""
        # Get active categories for the dropdown
        categories = DonationCategory.objects.filter(is_active=True).order_by('title')
        
        context = {
            'mode': 'create',
            'page_title': 'Create Donation Subcategory',
            'categories': categories
        }
        return render(request, self.template_name, context)


class SubCategoryEditView(View):
    """View for editing donation subcategories - template only, JS handles everything"""
    template_name = 'private/donations/subcategory/create.html'  
    
    def get(self, request, pk):
        """Display the subcategory edit form"""
        
        categories = DonationCategory.objects.filter(is_active=True).order_by('title')
                
        try:
            subcategory = get_object_or_404(DonationSubCategory, pk=pk)
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
