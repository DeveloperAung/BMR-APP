import os
from django.conf import settings
from django.db import models
from django.utils.text import slugify
from core.models import AuditModel


def event_image_path(instance, filename):
    return "event/image/cover/{}/{}".format(instance.id, filename)


def event_media_path(instance, filename):
    """
    Save file to: event/media/{event_title}/{event_sub_category}/{filename}
    """
    event_title = instance.media_info.event.title if instance.media_info and instance.media_info.event else "unknown_event"
    sub_category_title = instance.media_info.sub_category.title if instance.media_info and instance.media_info.sub_category else "unknown_subcategory"

    # use slugify (remove spaces/special chars)
    event_folder = slugify(event_title)
    sub_folder = slugify(sub_category_title)

    return os.path.join("event", "media", event_folder, sub_folder, filename)

class EventCategory(AuditModel):
    title = models.CharField(max_length=250, unique=True)
    title_others = models.CharField(max_length=250, unique=True, blank=True)
    is_menu = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = 'Event Categories'

    def __str__(self):
        return self.title


class EventSubCategory(AuditModel):
    title = models.CharField(max_length=250, unique=True)
    title_others = models.CharField(max_length=250, unique=True, blank=True)
    event_category = models.ForeignKey(EventCategory, on_delete=models.SET_NULL, related_name='event_sub_category', null=True)
    is_menu = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = 'Event Sub Categories'

    def __str__(self):
        return f'{self.event_category.title} - {self.title}'


class Event(AuditModel):
    title = models.CharField(max_length=1500)
    title_others = models.CharField(max_length=250, unique=True, blank=True)
    short_description = models.CharField(max_length=1500, blank=True)
    category = models.ForeignKey(EventCategory, on_delete=models.SET_NULL, null=True)
    description = models.TextField(blank=True)
    location = models.CharField(blank=True, max_length=1500)
    feature_image = models.CharField(blank=True, max_length=1500)
    cover_image = models.ImageField(upload_to=event_image_path, blank=True)
    is_registered = models.BooleanField(default=False)
    is_short_course = models.BooleanField(default=False)
    max_seat = models.IntegerField(default=0, blank=True)
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(blank=True, null=True)
    published_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="%(class)s_published_by",
        null=True,
        blank=True,
    )
    set_banner = models.BooleanField(default=False)
    banner_order = models.PositiveIntegerField(default=0)
    media_sent_at = models.DateTimeField(null=True, blank=True)
    media_sent_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="%(class)s_media_sent_by",
        null=True,
        blank=True,
    )
    media_sent_count = models.IntegerField(default=0)

    def __str__(self):
        return self.title.encode("utf-8", "ignore").decode("utf-8")


class EventDate(AuditModel):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="event_dates", null=True)
    event_date = models.DateField()
    from_time = models.TimeField(blank=True)
    to_time = models.TimeField(blank=True)

    def __str__(self):
        return f"{self.event.title} on {self.event_date}"


class EventMediaInfo(AuditModel):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="event_media_info", null=True)
    sub_category = models.ForeignKey(EventSubCategory, on_delete=models.CASCADE, related_name="event_media_info", null=True)

    def __str__(self):
        return f"{self.event.title} on {self.sub_category.title}"


class EventMedia(AuditModel):
    media_info = models.ForeignKey(EventMediaInfo, on_delete=models.CASCADE, related_name="event_media_info", null=True)
    media_type = models.CharField(max_length=250)
    title = models.CharField(max_length=500)
    media_location = models.CharField(blank=True, max_length=1500)
    filename = models.CharField(max_length=500)
    file_type = models.CharField(max_length=50, blank=True, null=True, help_text="live video, home video, image, mp3, etc.")
    media_date = models.DateTimeField(blank=True, null=True)
    media_file = models.FileField(upload_to=event_media_path, blank=True, null=True)
    embed_url = models.URLField(blank=True, null=True)
    downloaded_count = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.media_type} on {self.title}"


