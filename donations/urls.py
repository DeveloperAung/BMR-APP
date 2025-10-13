from django.urls import path, include
from . import views

internal_urls = [
    path('categories/', views.DonationCategoryList, name='donation_category_list'),
    path('categories/create/', views.CategoryCreateView.as_view(), name='donation_category_create'),
    path('categories/<int:pk>/edit/', views.CategoryEditView.as_view(), name='donation_category_edit'),
    # path('categories/create/', views.donation_category_create, name='donation_category_create'),
    # path('categories/<int:pk>/edit/', views.donation_category_update, name='donation_category_update'),
    # path('categories/<int:pk>/delete/', views.donation_category_delete, name='donation_category_delete'),
    # path('categories/export/', views.donation_category_export_csv, name='donation_category_export_csv'),

    path('subcategories/', views.DonationSubCategoryList, name='donation_sub_category_list'),
    path('subcategories/create/', views.SubCategoryCreateView.as_view(), name='donation_sub_category_create'),
    path('subcategories/<int:pk>/edit/', views.SubCategoryEditView.as_view(), name='donation_sub_category_edit'),
    # path('sub-categories/<int:pk>/delete/', views.donation_sub_category_delete, name='donation_sub_category_delete'),
    # path('sub-categories/export/', views.donation_sub_category_export_csv, name='donation_sub_category_export_csv'),
]

urlpatterns = [
    path('i/', include(internal_urls)),
] 