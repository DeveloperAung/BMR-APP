from django.conf import settings
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required

from authentication.models import User
from core.utils.menu_items import get_menu_items
from django.contrib.auth.models import Group


def home(request):
    slideshow_items = get_menu_items()
    return render(request, 'public/home.html', {'slideshow_items': slideshow_items})

def login_page(request):
    context = {
        'GOOGLE_CLIENT_ID': settings.GOOGLE_CLIENT_ID
    }
    return render(request, 'login.html', context)

def register_page(request):
    context = {
        'GOOGLE_CLIENT_ID': settings.GOOGLE_CLIENT_ID
    }
    return render(request, 'register.html', context)


@login_required(login_url='login')
def dashboard(request):
    if request.user.is_staff:
        print('private dashboard', request.user.is_staff)
        return redirect('private_dashboard')
    else:
        print('public ', request.user.is_staff)
        return redirect('public_dashboard')

def public_dashboard(request):
    return render(request, 'public/users/dashboard.html')

def private_dashboard(request):
    return render(request, 'private/users/list.html')

def test_page(request):
    return render(request, 'test_google.html')

def user_list(request):
    return render(request, 'private/users/list.html')

def user_create(request):
    context = {
        'mode': 'create',
        'page_title': 'Create Donation Category'
    }
    return render(request, 'private/users/create.html', context)

def user_edit(request, pk):
    roles = Role.objects.filter(is_active=True)

    try:
        user = get_object_or_404(User, pk=pk)
    except:
        user = None

    context = {
        'mode': 'edit',
        'user_id': pk,
        'user': user,
        'roles': roles,
        'page_title': 'Update User'
    }
    return render(request, 'private/users/create.html', context)


def role_list(request):
    return render(request, 'private/users/role/list.html')


def role_create(request):
    context = {
        'mode': 'create',
    }
    return render(request, 'private/users/role/create.html', context)

def role_edit(request, pk):

    try:
        role = get_object_or_404(Group, pk=pk)
    except:
        role = None

    context = {
        'mode': 'edit',
        'role': role,
        'role_id': pk,
    }
    return render(request, 'private/users/role/create.html', context)