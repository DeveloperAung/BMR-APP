from django.urls import path
from . import views

urlpatterns = [
    # Event Category URLs
    path('i/categories/', views.EventCategoryList.as_view(), name='event_category_list'),
    path('i/categories/create/', views.CategoryCreateView.as_view(), name='event_category_create'),
    path('i/categories/<int:pk>/edit/', views.CategoryEditView.as_view(), name='event_category_edit'),
    
    # Event Subcategory URLs
    path('i/subcategories/', views.EventSubCategoryList.as_view(), name='event_sub_category_list'),
    path('i/subcategories/create/', views.SubCategoryCreateView.as_view(), name='event_sub_category_create'),
    path('i/subcategories/<int:pk>/edit/', views.SubCategoryEditView.as_view(), name='event_sub_category_edit'),
]