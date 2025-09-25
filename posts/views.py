from django.shortcuts import render, get_object_or_404
from .models import PostCategory, Post
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


def PostList(request):
    return render(request, 'private/posts/posts/list.html')


class PostCreateView(View):
    template_name = 'private/posts/posts/create.html'

    def get(self, request):
        categories = PostCategory.objects.filter(is_active=True)
        posts = Post.objects.filter(is_active=True)
        
        context = {
            'mode': 'create',
            'page_title': 'Create Post',
            'categories': categories,
            'posts': posts
        }
        return render(request, self.template_name, context)


class PostEditView(View):
    template_name = 'private/posts/posts/create.html'

    def get(self, request, pk):
        categories = PostCategory.objects.filter(is_active=True)
        posts = Post.objects.filter(is_active=True)
        
        try:
            post = get_object_or_404(Post, pk=pk)
        except:
            post = None

        context = {
            'mode': 'edit',
            'post_id': pk,
            'post': post,
            'categories': categories,
            'posts': posts,
            'page_title': f'Edit Post: {post.title if post else "Unknown"}'
        }
        return render(request, self.template_name, context)
