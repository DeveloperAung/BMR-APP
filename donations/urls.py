from django.urls import path
from . import views

urlpatterns = [
    path('i/categories/', views.DonationCategoryList, name='donation_category_list'),
    path('i/categories/create/', views.CategoryCreateView.as_view(), name='donation_category_create'),
    path('i/categories/<int:pk>/edit/', views.CategoryEditView.as_view(), name='donation_category_edit'),
    # path('categories/create/', views.donation_category_create, name='donation_category_create'),
    # path('categories/<int:pk>/edit/', views.donation_category_update, name='donation_category_update'),
    # path('categories/<int:pk>/delete/', views.donation_category_delete, name='donation_category_delete'),
    # path('categories/export/', views.donation_category_export_csv, name='donation_category_export_csv'),

    path('i/subcategories/', views.DonationSubCategoryList, name='donation_sub_category_list'),
    path('i/subcategories/create/', views.SubCategoryCreateView.as_view(), name='donation_sub_category_create'),
    path('i/subcategories/<int:pk>/edit/', views.SubCategoryEditView.as_view(), name='donation_sub_category_edit'),
    # path('sub-categories/<int:pk>/delete/', views.donation_sub_category_delete, name='donation_sub_category_delete'),
    # path('sub-categories/export/', views.donation_sub_category_export_csv, name='donation_sub_category_export_csv'),
] 