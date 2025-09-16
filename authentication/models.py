from django.contrib.auth.models import AbstractUser
from django.db import models


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

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email