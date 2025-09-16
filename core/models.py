from django.db import models
import uuid
from django.conf import settings


class AuditModel(models.Model):
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(blank=True, null=True, auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='created_%(class)s_set',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    modified_at = models.DateTimeField(auto_now=True)
    modified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='modified_%(class)s_set',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        if user and not self.created_by:
            self.created_by = user
        if user:
            self.modified_by = user
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.pk} - {self.__class__.__name__}"


class Status(AuditModel):
    internal_status = models.CharField(max_length=255, blank=True)
    external_status = models.CharField(max_length=255, blank=True)
    description = models.TextField(max_length=350, blank=True, null=True)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE)
    parent_code = models.CharField(max_length=10, blank=True)
    status_code = models.CharField(max_length=10, unique=True)

    class Meta:
        verbose_name = 'Status'
        verbose_name_plural = 'Status'

        unique_together = ('internal_status', 'parent_code')

    def save(self, *args, **kwargs):
        # Check if field2 is empty before setting its value
        if not self.external_status:
            self.external_status = self.internal_status  # Set field2 to field1 if field2 is empty
        super().save(*args, **kwargs)  # Call the parent class's save method

    def __str__(self):
        status = self.parent.internal_status if self.parent else ''
        return f'{status} - {self.internal_status}'


class MediaModel(AuditModel):
    title = models.CharField(max_length=255)
    media_info = models.TextField(blank=True, null=True)
    location = models.CharField(max_length=255)
    file_type = models.CharField(max_length=100, blank=True, null=True)
    file_name = models.CharField(max_length=255, blank=True, null=True)
    file = models.FileField(upload_to='media', blank=True, null=True)
    embed_code = models.TextField(blank=True, null=True)
    downloaded_count = models.IntegerField(default=0)

    def __str__(self):
        return self.title