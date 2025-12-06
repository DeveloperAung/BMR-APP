from django.conf import settings
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required

from authentication.models import Permission, RolePermission, User
from core.utils.menu_items import get_menu_items
from django.contrib.auth.models import Group

from events.models import EventCategory


def home(request):
    slideshow_items = get_menu_items()
    # event_category_menus = EventCategory.objects.filter(is_active=True)
    context = {
        'slideshow_items': slideshow_items,
        # 'event_category_menus': event_category_menus,
    }
    return render(request, 'public/home.html', context)

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

def forgot_password_page(request):
    return render(request, 'forgot_password.html')

def reset_password_page(request):
    return render(request, 'reset_password.html')

def change_password_page(request):
    return render(request, 'change_password.html')


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
    roles = Group.objects.all().order_by('name')
    context = {
        'mode': 'create',
        'user': None,
        'roles': roles,
        'page_title': 'Create User'
    }
    return render(request, 'private/users/create.html', context)

def user_edit(request, pk):
    roles = Group.objects.all().order_by('name')
    user = get_object_or_404(User, pk=pk)

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
        'permissions': Permission.objects.all().order_by('code'),
        'assigned_permissions': [],
    }
    return render(request, 'private/users/role/create.html', context)

def role_edit(request, pk):

    try:
        role = get_object_or_404(Group, pk=pk)
    except:
        role = None

    assigned_permissions = RolePermission.objects.filter(
        group_id=pk
    ).values_list('permission_id', flat=True)

    context = {
        'mode': 'edit',
        'role': role,
        'role_id': pk,
        'permissions': Permission.objects.all().order_by('code'),
        'assigned_permissions': assigned_permissions,
    }
    return render(request, 'private/users/role/create.html', context)
