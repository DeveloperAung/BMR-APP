from django.conf import settings
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required

def home(request):
    return render(request, 'public/home.html')

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