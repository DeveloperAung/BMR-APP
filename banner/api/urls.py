from django.urls import path
from .views import BannerListAPIView, BannerUpdateAPIView

urlpatterns = [
    path('banners/', BannerListAPIView.as_view(), name='banner-list'),
    path('banners/<str:model_name>/<int:object_id>/update/', BannerUpdateAPIView.as_view(), name='banner-update'),
]