from django.shortcuts import render, get_object_or_404
from django.views.generic import TemplateView
from django.conf import settings
from .models import *
from .api.serializers import PaymentReadSerializer


def membership_list(request):
    return render(request, 'private/memberships/list.html')


def _as_choice_list(choices):
    """Normalize Django choices (tuples or queryset) into list of dicts."""
    out = []
    if isinstance(choices, (list, tuple)):
        for v, lbl in choices:
            out.append({"id": v, "name": lbl})
    else:
        for obj in choices:
            out.append({"id": getattr(obj, "id", None), "name": str(obj)})
    return out

def member_reg_step_1(request):
    ctx = {
        "gender_choices": _as_choice_list(PersonalInfo.GENDER_CHOICES),
        "countries": _as_choice_list(PersonalInfo.COUNTRY_CHOICES),
        "citizenship": _as_choice_list(PersonalInfo.CITIZEN_CHOICES),
        "residential_statuses": _as_choice_list(ContactInfo.RESIDENTIAL_STATUS_CHOICES),
        "membership_types": MembershipType.objects.filter(is_active=True),
    }
    return render(request, 'public/users/membership/submit-page1.html', ctx)


def edit_member_reg_step_1(request, reference_no):
    ctx = {
        "gender_choices": _as_choice_list(PersonalInfo.GENDER_CHOICES),
        "countries": _as_choice_list(PersonalInfo.COUNTRY_CHOICES),
        "citizenship": _as_choice_list(PersonalInfo.CITIZEN_CHOICES),
        "residential_statuses": _as_choice_list(ContactInfo.RESIDENTIAL_STATUS_CHOICES),
        "membership_types": MembershipType.objects.filter(is_active=True, reference_no=reference_no),
    }
    return render(request, 'public/users/membership/submit-page1.html', ctx)


def member_reg_step_2(request):
    ctx = {
        "educations": EducationLevel.objects.filter(is_active=True),
        "institutions": Institution.objects.filter(is_active=True),
        "initial_data" : {
            "education_info": {
                "education": "",
                "institution": "",
                "other_societies": "",
            },
            "work_info": {
                "occupation": "",
                "company_name": "",
                "company_contact": "",
                "company_postal_code": "",
                "company_address": "",
            },
            "membership_type": "",
            "profile_picture": "",
        }
    }
    return render(request, 'public/users/membership/submit-page2.html', ctx)


def member_reg_step_3(request):
    payment_context = {
        "qr_code_url": "",
        "payment_amount": "",
        "payment_currency": "",
    }

    if request.user.is_authenticated:
        membership = Membership.objects.filter(user=request.user).order_by('-created_at').first()
        if membership:
            latest_payment = membership.payments.filter(method="hitpay").order_by('-created_at').first()
            if latest_payment:
                payment_data = PaymentReadSerializer(latest_payment).data
                payment_context.update({
                    "qr_code_url": payment_data.get("qr_code") or "",
                    "payment_amount": payment_data.get("amount") or "",
                    "payment_currency": payment_data.get("currency") or "",
                })

    ctx = {
        "initial_data": {
            "membership_type": "",
            "profile_picture": "",
        },
        "payment_context": payment_context,
    }

    return render(request, 'public/users/membership/submit-page3.html', ctx)


def membership_approval(request, reference_no):

    member = get_object_or_404(Membership, reference_no=reference_no)

    context = {
        'member': member,
    }
    return render(request, 'private/memberships/approval.html', context)


def member_event(request):
    return render(request, 'public/users/events/events.html')


def member_donation(request):
    return render(request, 'public/users/events/donations.html')
