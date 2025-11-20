from enum import unique
from django.db import models

from core.models import AuditModel
from events.models import Event


class DonationCategory(AuditModel):
    title = models.CharField(max_length=250, unique=True)
    title_others = models.CharField(max_length=250, unique=True, blank=True)
    is_date_required = models.BooleanField(default=True)
    is_multi_select_required = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = 'Donation Categories'

    def __str__(self):
        return self.title


class DonationSubCategory(AuditModel):
    donation_category = models.ForeignKey(DonationCategory, on_delete=models.SET_NULL, blank=True, null=True,
                                          related_name='donation_sub_category')
    title = models.CharField(max_length=250, unique=True, error_messages={'unique': 'Donation Sub Category already exists.'})
    title_others = models.CharField(max_length=250, unique=True, blank=True)

    class Meta:
        verbose_name_plural = 'Donation Sub Categories'

    def __str__(self):
        return self.title


class Donation(AuditModel):
    donation_choices = [
        ('Event-Based', 'Event-Based'),
        ('Campaign-Based', 'Campaign-Based'),
        ('General', 'General'),
        ('One-Time', 'One-Time'),
        ('Monthly', 'Monthly'),
        ('Yearly', 'Yearly'),
    ]
    donation_category = models.ForeignKey(DonationCategory, on_delete=models.SET_NULL, blank=True, null=True,
                                          related_name='donation_category')
    donation_sub_category = models.ForeignKey(DonationSubCategory, on_delete=models.SET_NULL, blank=True, null=True,
                                              related_name='donation_sub_category')
    event  = models.ForeignKey(Event, on_delete=models.SET_NULL, blank=True, null=True,
                               related_name='donation_event')
    donation_type = models.CharField(max_length=20, choices=donation_choices)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    donation_date = models.DateField(blank=True, null=True)

    def __str__(self):
        return f"{self.donation_category} - {self.donation_sub_category} - {self.amount}"