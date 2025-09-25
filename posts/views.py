from django.shortcuts import render, get_object_or_404
from .models import PostCategory
from django.views import View


def PostCategoryList(request):
    return render(request, 'private/posts/category/list.html')


class CategoryCreateView(View):
    template_name = 'private/posts/category/create.html'

    def get(self, request):
        context = {
            'mode': 'create',
            'page_title': 'Create Post Category'
        }
        return render(request, self.template_name, context)


class CategoryEditView(View):
    template_name = 'private/posts/category/create.html'

    def get(self, request, pk):
        try:
            category = get_object_or_404(PostCategory, pk=pk)
        except:
            category = None

        context = {
            'mode': 'edit',
            'category_id': pk,
            'category': category, 
            'page_title': f'Edit Post Category: {category.title if category else "Unknown"}'
        }
        return render(request, self.template_name, context)



