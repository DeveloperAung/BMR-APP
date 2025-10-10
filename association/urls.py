from django.urls import path
from . import views


urlpatterns = [
    path('i/asso_post/list/', views.association_post_list, name='association_post_list'),
    path('i/asso_post/create/', views.AssoPostCreateView.as_view(), name='association_post_create'),
    path('i/asso_post/<int:pk>/edit/', views.AssoPostEditView.as_view(), name='association_post_edit'),
]