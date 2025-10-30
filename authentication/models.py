from django.contrib.auth.models import AbstractUser
from django.db import models

from core.models import AuditModel
from django.contrib.auth.models import Group


class Permission(AuditModel):
    code = models.CharField(max_length=100, unique=True)  # e.g. 'article_publish'
    description = models.TextField(blank=True)

    def __str__(self):
        return self.code


class RolePermission(AuditModel):
    group = models.ForeignKey(Group, on_delete=models.CASCADE)
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('group', 'permission')

    def __str__(self):
        return f"{self.group.name} - {self.permission.code}"


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

