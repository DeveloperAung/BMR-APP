from django.shortcuts import render
from django.views.generic import TemplateView
from django.conf import settings
from .models import *


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
           "membership_type": MembershipType.objects.filter(is_active=True),
           "initial_data": {
                "profile_info": {
                    "name": "",
                    "gender": "",
                    "date_of_birth": "",
                    "city_of_birth": "",
                    "country_of_birth": "",
                    "citizenship": "",
                },
                "contact_info": {
                    "nric_fin": "",
                    "primary_contact": "",
                    "secondary_contact": "",
                    "residential_statuses": "",
                    "postal_code": "",
                    "address": "",
                },
                "membership_type": "",
                "profile_picture": "",
            }
        }
    return render(request, 'public/users/membership/submit-page1.html', ctx)


def member_reg_step_2(request):
    ctx = {}
    ctx["initial_data"] = {
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
    return render(request, 'public/users/membership/submit-page2.html', ctx)


def member_reg_step_3(request):
    ctx = {
        "initial_data" : {
            "membership_type": "",
            "profile_picture": "",
        }
    }

    return render(request, 'public/users/membership/submit-page3.html', ctx)



