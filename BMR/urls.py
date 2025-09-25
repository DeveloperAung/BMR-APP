from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

from authentication.api.views import google_callback

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('authentication.urls')),
    path('association/', include('association.urls')),
    path('posts/', include('posts.urls')),
    path('events/', include('events.urls')),
    path('donations/', include('donations.urls')),
    path('memberships/', include('memberships.urls')),

    path('api/auth/', include('authentication.api.urls')),
    path('api/association/', include('association.api.routers')),
    path('api/posts/', include('posts.api.urls')),
    path('api/events/', include('events.api.urls')),
    path('api/donations/', include('donations.api.urls')),
    path('api/membership/', include('memberships.api.routers')),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    path('google-callback/', google_callback, name='google_callback'),
]