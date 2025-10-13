from django.urls import path, include
from . import views


internal_urls = [
    # Event Category URLs
    path('categories/', views.EventCategoryList, name='event_category_list'),
    path('categories/create/', views.CategoryCreateView.as_view(), name='event_category_create'),
    path('categories/<int:pk>/edit/', views.CategoryEditView.as_view(), name='event_category_edit'),

    # Event Subcategory URLs
    path('subcategories/', views.EventSubCategoryList, name='event_sub_category_list'),
    path('subcategories/create/', views.SubCategoryCreateView.as_view(), name='event_sub_category_create'),
    path('subcategories/<int:pk>/edit/', views.SubCategoryEditView.as_view(), name='event_sub_category_edit'),

    path('list/', views.EventList, name='event_list'),
    path('create/', views.EventCreateView.as_view(), name='event_create'),
    path('<int:pk>/edit/', views.EventEditView.as_view(), name='event_edit'),

    path('media-info/list/', views.EventMediaInfoList, name='event_media_info_list'),
    path('media-info/details/', views.EventMediaInfoDetails, name='event_media_info_details'),
    path('media/list/', views.EventMediaList, name='event_media_list'),
    path('media/create/', views.EventMediaCreate.as_view(), name='event_media_create'),
]

urlpatterns = [
    path('i/', include(internal_urls)),
]

