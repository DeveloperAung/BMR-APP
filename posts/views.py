from django.shortcuts import render, get_object_or_404
from .models import PostCategory, Post
from django.views import View


def PostCategoryList(request):
    return render(request, 'private/posts/category/list.html')

def post_details (request, slug):
    post = get_object_or_404(Post, slug=slug)
    return render(request, '')

def book_list(request):
    books = Post.objects.filter(is_published=True, is_active=True, post_category=6)
    return render(request, 'public/posts/books.html', {'books': books})

def article_list(request):
    articles = Post.objects.filter(is_published=True, is_active=True, post_category=2)
    return render(request, 'public/posts/articles.html', {'articles': articles})


def article_details(request, pk):
    article = get_object_or_404(Post, id=pk)
    return render(request, 'public/posts/article_details.html', {'article': article})


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
