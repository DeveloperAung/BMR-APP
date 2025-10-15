from django.shortcuts import render

from core.utils.menu_items import get_menu_items
from posts.models import Post
from events.models import Event

def banner_list(request):
    banners = []

    # collect from Post
    for post in Post.objects.filter(set_banner=True).order_by("banner_order"):
        banners.append({
            'id': post.id,
            'title': post.title,
            'model_name': 'Post',
            'order_index': post.banner_order,
            'category_title': 'Post'  # or custom logic
        })

    # collect from Event
    for event in Event.objects.filter(set_banner=True).order_by("banner_order"):
        banners.append({
            'id': event.id,
            'title': event.title,
            'model_name': 'Event',
            'order_index': event.banner_order,
            'category_title': 'Event'
        })

    banners.sort(key=lambda x: x['order_index'])
    return render(request, "private/banners/list.html", {'data': banners})


def landing_page_view(request):
    slideshow_items = get_menu_items()
    print('slideshow_items', slideshow_items)
    return render(request, 'public/home.html', {'slideshow_items': slideshow_items})


def menu_list(request):
    menus = []

    # collect from Post
    for post in Post.objects.filter(set_banner=True).order_by("banner_order"):
        menus.append({
            'id': post.id,
            'title': post.title,
            'model_name': 'Post',
            'order_index': post.banner_order,
            'category_title': 'Post'  # or custom logic
        })

    # collect from Event
    for event in Event.objects.filter(set_banner=True).order_by("banner_order"):
        menus.append({
            'id': event.id,
            'title': event.title,
            'model_name': 'Event',
            'order_index': event.banner_order,
            'category_title': 'Event'
        })

    menus.sort(key=lambda x: x['order_index'])
    return render(request, "private/banners/list.html", {'data': menus})
