from django.urls import path
from . import views

urlpatterns = [
    path('i/categories/', views.donation_category_list, name='donation_category_list'),
    path('i/categories/create/', views.CategoryCreateView.as_view(), name='donation_category_create'),
    path('i/categories/<int:pk>/edit/', views.CategoryEditView.as_view(), name='donation_category_edit'),
    # path('categories/create/', views.donation_category_create, name='donation_category_create'),
    # path('categories/<int:pk>/edit/', views.donation_category_update, name='donation_category_update'),
    # path('categories/<int:pk>/delete/', views.donation_category_delete, name='donation_category_delete'),
    # path('categories/export/', views.donation_category_export_csv, name='donation_category_export_csv'),

    path('i/sub-categories/', views.donation_sub_category_list, name='donation_sub_category_list'),
    # path('sub-categories/create/', views.donation_sub_category_create, name='donation_sub_category_create'),
    # path('sub-categories/<int:pk>/edit/', views.donation_sub_category_update, name='donation_sub_category_update'),
    # path('sub-categories/<int:pk>/delete/', views.donation_sub_category_delete, name='donation_sub_category_delete'),
    # path('sub-categories/export/', views.donation_sub_category_export_csv, name='donation_sub_category_export_csv'),
] 