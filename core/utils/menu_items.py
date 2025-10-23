from posts.models import Post
from events.models import Event

def get_menu_items():
    menu_items = []
    model_classes = [Post, Event]

    for model_class in model_classes:
        model_name = model_class.__name__
        objects = model_class.objects.filter(set_banner=True, is_active=True)

        for obj in objects:
            menu_items.append({
                'title': obj.title,
                'model_name': model_name,
                'image': obj.cover_image.url if obj.cover_image else None,
                'url': obj.get_absolute_url()
            })

    return menu_items
