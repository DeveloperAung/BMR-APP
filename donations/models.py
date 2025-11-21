from enum import unique
from django.db import models
from django.core.exceptions import ValidationError
from django.conf import settings

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
        ('regular', 'Regular'),
        ('event', 'Event'),
    ]
    donation_category = models.ForeignKey(DonationCategory, on_delete=models.SET_NULL, blank=True, null=True,
                                          related_name='donation_category')
    donation_sub_category = models.ForeignKey(DonationSubCategory, on_delete=models.SET_NULL, blank=True, null=True,
                                              related_name='donation_sub_category')
    # Who made the donation (explicit donor). AuditModel.created_by may be used,
    # but having an explicit `donated_by` makes queries clearer.
    donated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, blank=True, null=True,
                                   related_name='donations')
    # when donation is of type 'event' the `event` should be set and optionally the
    # `event_option` selected which carries the fixed amount for that category.
    event = models.ForeignKey(Event, on_delete=models.SET_NULL, blank=True, null=True,
                              related_name='donation_event')
    donation_type = models.CharField(max_length=20, choices=donation_choices)
    # For event donations we recommend selecting an EventDonationOption which defines the fixed amount.
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    donation_date = models.DateField(blank=True, null=True)
    # Optional link to a per-event donation option (fixed amount per category per event)
    # defined by `EventDonationOption` below.
    event_option = models.ForeignKey('EventDonationOption', on_delete=models.SET_NULL, blank=True, null=True,
                                     related_name='donations')

    def __str__(self):
        return f"{self.donation_type} - {self.donation_category} - {self.amount}"

    def clean(self):
        # Validate consistency for event donations
        if self.donation_type == 'event':
            if not self.event:
                raise ValidationError({'event': 'Event must be set for event donations.'})
            if self.event_option:
                # event_option must belong to the same event
                if self.event_option.event_id != self.event_id:
                    raise ValidationError({'event_option': 'Selected event option does not belong to the chosen event.'})
                # amount must match fixed amount
                if self.amount != self.event_option.amount:
                    raise ValidationError({'amount': 'Amount must match the selected event option amount.'})
            else:
                # If no event_option provided it's allowed but amount should be > 0
                if not self.amount or self.amount <= 0:
                    raise ValidationError({'amount': 'Enter a valid amount for the event donation.'})
        else:
            # Regular donations shouldn't have an event_option
            if self.event_option:
                raise ValidationError({'event_option': 'Event option should not be set for regular donations.'})

    def save(self, *args, **kwargs):
        # Run validation before save to enforce business rules
        self.full_clean()
        return super().save(*args, **kwargs)


class EventDonationOption(AuditModel):
    """Defines a fixed donation amount for a given DonationCategory within an Event.

    Example: Event 'Marathon 2025' may have a DonationCategory 'Gold Sponsor' with amount 500.00
    """
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='donation_options')
    donation_category = models.ForeignKey(DonationCategory, on_delete=models.CASCADE, related_name='event_options')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('event', 'donation_category')
        verbose_name = 'Event Donation Option'
        verbose_name_plural = 'Event Donation Options'

    def __str__(self):
        return f"{self.event} - {self.donation_category} : {self.amount}"
    

# class EventDonation(AuditModel):
#     donated_by = models.ForeignKey('auth.User', on_delete=models.CASCADE, related_name='event_donated_by')
#     donation = models.ForeignKey(Donation, on_delete=models.CASCADE, related_name='event_donations')

#     def __str__(self):
#         return f"Donation for Event: {self.event.name} - Amount: {self.donation.amount}"