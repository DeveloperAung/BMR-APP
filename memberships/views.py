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

class RegistrationView(TemplateView):
    template_name = "public/memberships/registration.html"

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)

        # Use model CHOICES
        ctx["gender_choices"] = _as_choice_list(PersonalInfo.GENDER_CHOICES)
        ctx["countries"] = _as_choice_list(PersonalInfo.COUNTRY_CHOICES)
        ctx["citizenships"] = _as_choice_list(PersonalInfo.CITIZEN_CHOICES)
        ctx["resendial_statuses"] = _as_choice_list(ContactInfo.RESIDENTIAL_STATUS_CHOICES)

        # Use actual DB tables
        ctx["membership_types"] = [
            {"id": m.id, "name": m.name, "amount": str(m.amount)}
            for m in MembershipType.objects.all().order_by("name")
        ]
        ctx["educations"] = [{"id": e.id, "name": e.name} for e in EducationLevel.objects.all().order_by("name")]
        ctx["institutions"] = [{"id": i.id, "name": i.name} for i in Institution.objects.all().order_by("name")]

        # Default initial_data
        ctx["initial_data"] = {
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
                "resendial_status": "",
                "postal_code": "",
                "address": "",
            },
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
        return ctx

