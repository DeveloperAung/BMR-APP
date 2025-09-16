from django.shortcuts import render, get_object_or_404, redirect
from django.core.paginator import Paginator
from django.contrib import messages
from django.views.decorators.http import require_POST
from .models import PostCategory
from .forms import PostCategoryForm
from django.conf import settings


def post_category_list(request):
    return render(request, 'private/posts/category/list.html')

def post_category_create(request):
    if request.method == 'POST':
        form = PostCategoryForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Post category created successfully.')
            return redirect('post_category_list')
    else:
        form = PostCategoryForm()
    return render(request, 'private/posts/category/form.html', {'form': form, 'title': 'Create Post Category'})

def post_category_update(request, pk):
    category = get_object_or_404(PostCategory, pk=pk)
    if request.method == 'POST':
        form = PostCategoryForm(request.POST, instance=category)
        if form.is_valid():
            form.save()
            messages.success(request, 'Post category updated successfully.')
            return redirect('post_category_list')
    else:
        form = PostCategoryForm(instance=category)
    return render(request, 'private/posts/category/form.html', {'form': form, 'title': 'Update Post Category'})

@require_POST
def post_category_delete(request, pk):
    category = get_object_or_404(PostCategory, pk=pk)
    category.delete()
    messages.success(request, 'Post category deleted successfully.')
    return redirect('post_category_list')



