from django.contrib import admin
from .models import *

admin.site.register(EventCategory)
admin.site.register(EventSubCategory)
admin.site.register(Event)
admin.site.register(EventMedia)
admin.site.register(EventMediaInfo)

