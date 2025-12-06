from events.models import EventCategory


def event_category_menus(request):
    """Expose active event categories to all templates."""
    return {
        "event_category_menus": EventCategory.objects.filter(is_active=True).order_by("title")
    }
