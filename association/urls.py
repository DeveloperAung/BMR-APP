from django.urls import path, include
from . import views


internal_urls = [
    path('asso_post/list/', views.association_post_list, name='association_post_list'),
    path('asso_post/create/', views.AssoPostCreateView.as_view(), name='association_post_create'),
    path('asso_post/<int:pk>/edit/', views.AssoPostEditView.as_view(), name='association_post_edit'),
]

public_urls = [
    path('post/<str:title_others>/', views.association_post_details, name='association_post_details'),
]

urlpatterns = [
    path('i/', include(internal_urls)),
    path('', include(public_urls)),
]

