from django.shortcuts import render, get_object_or_404
from django.views import View
from .models import *

def association_post_list(request):
    return render(request, 'private/association_posts/list.html')


class AssoPostCreateView(View):
    template_name = 'private/association_posts/create.html'

    def get(self, request):
        context = {
            'mode': 'create',
            'page_title': 'Create Donation Category'
        }
        return render(request, self.template_name, context)


class AssoPostEditView(View):
    template_name = 'private/association_posts/create.html'

    def get(self, request, pk):
        try:
            asso_post = get_object_or_404(AssociationPosts, pk=pk)
        except:
            asso_post = None

        context = {
            'mode': 'edit',
            'asso_post_id': pk,
            'asso_post': asso_post,
            'page_title': f'Edit Category: {asso_post.title if asso_post else "Unknown"}'
        }
        return render(request, self.template_name, context)

