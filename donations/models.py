from enum import unique
from django.db import models

from core.models import AuditModel


class DonationCategory(AuditModel):
    title = models.CharField(max_length=250, unique=True)
    is_date_required = models.BooleanField(default=True)
    is_multi_select_required = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = 'Donation Categories'

    def __str__(self):
        return self.title


class DonationSubCategory(AuditModel):
    donation_category = models.ForeignKey(DonationCategory, on_delete=models.SET_NULL, blank=True, null=True,
                                          related_name='donation_sub_category')
    title = models.CharField(max_length=250, unique=True)

    class Meta:
        verbose_name_plural = 'Donation Sub Categories'

    def __str__(self):
        return self.title

