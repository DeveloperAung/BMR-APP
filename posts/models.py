from django.db import models
from django.urls import reverse

from core.models import AuditModel
from django.conf import settings


def post_image_path(instance, filename):
    return "post/image/cover/{}/{}".format(instance.id, filename)

def post_file_path(instance, filename):
    return "post/file/{}/{}".format(instance.id, filename)


class PostCategory(AuditModel):
    title = models.CharField(max_length=250, unique=True)
    title_others = models.CharField(max_length=250, unique=True, blank=True)
    is_menu = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = 'Post Categories'

    def __str__(self):
        return self.title


class Post(AuditModel):
    title = models.CharField(max_length=500)
    title_others = models.CharField(max_length=250, unique=True, blank=True)
    short_description = models.CharField(max_length=500, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(blank=True, null=True)
    published_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="%(class)s_published_by",
        null=True,
        blank=True,
    )
    post_category = models.ForeignKey(PostCategory, on_delete=models.SET_NULL, null=True)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE)
    media = models.FileField(upload_to=post_file_path, null=True, blank=True)
    cover_image = models.ImageField(upload_to=post_image_path, null=True, blank=True)
    set_banner = models.BooleanField(default=False)
    banner_order = models.PositiveIntegerField(default=0)

    def get_absolute_url(self):
        return reverse('news_detail', args=[str(self.id)])

    def __str__(self):
        return self.title


        
