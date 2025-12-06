from django.contrib import admin
from .models import Status, MediaModel


@admin.register(Status)
class StatusAdmin(admin.ModelAdmin):
    list_display = ('internal_status', 'external_status', 'status_code', 'parent_code', 'is_active', 'created_at')
    list_filter = ('is_active', 'parent_code')
    search_fields = ('internal_status', 'external_status', 'status_code', 'parent_code')
    autocomplete_fields = ('parent',)


@admin.register(MediaModel)
class MediaModelAdmin(admin.ModelAdmin):
    list_display = ('title', 'location', 'file_type', 'is_active', 'created_at')
    list_filter = ('is_active', 'file_type')
    search_fields = ('title', 'location', 'file_type')

