from django.shortcuts import render


def association_post_list(request):
    return render(request, 'private/association_posts/list.html')
