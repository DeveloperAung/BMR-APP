from django.contrib.auth.models import AbstractUser
from django.db import models

from core.models import AuditModel
from django.contrib.auth.models import Group

class RolePermission(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE)
    permission_code = models.CharField(max_length=100)  # e.g. 'article_publish'

    class Meta:
        unique_together = ('group', 'permission_code')

    def __str__(self):
        return f"{self.group.name} - {self.permission_code}"


class User(AbstractUser):
    email = models.EmailField(unique=True)
    profile_picture = models.URLField(blank=True, null=True)
    mobile = models.CharField(max_length=32, null=True, blank=True)
    secondary_mobile = models.CharField(max_length=32, blank=True, null=True)

    is_email_verified = models.BooleanField(default=False)
    otp_code = models.CharField(max_length=4, blank=True, null=True)
    otp_expired_at = models.DateTimeField(blank=True, null=True)
    google_id = models.CharField(max_length=100, blank=True, null=True)
    is_google_login = models.BooleanField(default=False)
    is_locked = models.BooleanField(default=False)

    group = models.OneToOneField(Group, on_delete=models.CASCADE, blank=True, null=True, related_name='custom_role_users')

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email

