from django.shortcuts import render, get_object_or_404
from django.views.generic import TemplateView
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model
from .models import *
from .api.serializers import PaymentReadSerializer

User = get_user_model()


def membership_list(request):
    # Provide status options (parent_code = '1') to populate the Status filter dropdown
    from core.models import Status
    statuses = Status.objects.filter(parent_code='1').order_by('internal_status')
    return render(request, 'private/memberships/list.html', {'statuses': statuses})


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
    # If the user already has a membership and it's not editable, show submitted/read-only page
    if request.user.is_authenticated:
        membership = Membership.objects.filter(user=request.user).order_by('-created_at').first()
        if membership:
            status_code = getattr(getattr(membership, 'workflow_status', None), 'status_code', None)
            # editable only when status is Draft (10), Incomplete (11), or Pending Approval (12)
            if status_code not in ("10", "11", "12"):
                return render(request, 'public/users/membership/submitted-readonly.html', {
                    'membership': membership,
                    'step': 1,
                })
        ctx['membership'] = membership if membership else None
        ctx['editable'] = True
    return render(request, 'public/users/membership/submit-page1.html', ctx)


def edit_member_reg_step_1(request, reference_no):
    ctx = {
        "gender_choices": _as_choice_list(PersonalInfo.GENDER_CHOICES),
        "countries": _as_choice_list(PersonalInfo.COUNTRY_CHOICES),
        "citizenship": _as_choice_list(PersonalInfo.CITIZEN_CHOICES),
        "residential_statuses": _as_choice_list(ContactInfo.RESIDENTIAL_STATUS_CHOICES),
        "membership_types": MembershipType.objects.filter(is_active=True, reference_no=reference_no),
    }
    # For editing via reference, determine if membership is editable
    membership = Membership.objects.filter(reference_no=reference_no).order_by('-created_at').first()
    if membership:
        status_code = getattr(getattr(membership, 'workflow_status', None), 'status_code', None)
        if status_code not in ("10", "11", "12"):
            return render(request, 'public/users/membership/submitted-readonly.html', {
                'membership': membership,
                'step': 1,
            })
    ctx['membership'] = membership if membership else None
    ctx['editable'] = True
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
    # If authenticated and membership exists, check editable status
    if request.user.is_authenticated:
        membership = Membership.objects.filter(user=request.user).order_by('-created_at').first()
        if membership:
            status_code = getattr(getattr(membership, 'workflow_status', None), 'status_code', None)
            if status_code not in ("10", "11", "12"):
                return render(request, 'public/users/membership/submitted-readonly.html', {
                    'membership': membership,
                    'step': 2,
                })
        ctx['membership'] = membership if membership else None
        ctx['editable'] = True
    return render(request, 'public/users/membership/submit-page2.html', ctx)


def member_reg_step_3(request):
    payment_context = {
        "qr_code_url": "",
        "payment_amount": "",
        "payment_currency": "",
        "payment_uuid": "",
        "payment_external_id": "",
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
                    "payment_uuid": payment_data.get("uuid") or "",
                    "payment_external_id": payment_data.get("external_id") or "",
                })

    ctx = {
        "initial_data": {
            "membership_type": "",
            "profile_picture": "",
        },
        "payment_context": payment_context,
    }

    # If authenticated and membership exists, check editable status
    if request.user.is_authenticated:
        membership = Membership.objects.filter(user=request.user).order_by('-created_at').first()
        if membership:
            status_code = getattr(getattr(membership, 'workflow_status', None), 'status_code', None)
            if status_code not in ("10", "11", "12"):
                return render(request, 'public/users/membership/submitted-readonly.html', {
                    'membership': membership,
                    'step': 3,
                })
        ctx['membership'] = membership if membership else None
        ctx['editable'] = True

    return render(request, 'public/users/membership/submit-page3.html', ctx)


def member_reg_step_4(request):
    reference_no = request.GET.get('ref', '')
    return render(request, 'public/users/membership/submit-page4.html', {
        'reference_no': reference_no
    })


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


def membership_details(request):
    membership = None
    if request.user.is_authenticated:
        membership = Membership.objects.filter(user=request.user).order_by('-created_at').first()
    return render(request, 'public/users/membership/details.html', {'membership': membership})


def profile(request):
    """Profile page for the logged-in user.

    This mirrors the membership details lookup and renders the profile template
    so profile-related pages live under the `memberships` app (consistent
    with other member pages like events/donations).
    
    Works with both Django sessions and JWT tokens (from localStorage).
    """
    membership = None
    user = None
    
    # Check Django session authentication first
    if request.user.is_authenticated and not request.user.is_anonymous:
        user = request.user
        membership = Membership.objects.filter(user=user).order_by('-created_at').first()
    else:
        # If not authenticated via Django session, try to get user from JWT token
        from rest_framework_simplejwt.authentication import JWTAuthentication
        from rest_framework.request import Request as DRFRequest
        
        try:
            jwt_auth = JWTAuthentication()
            drf_request = DRFRequest(request)
            auth_result = jwt_auth.authenticate(drf_request)
            if auth_result:
                user, token = auth_result
                membership = Membership.objects.filter(user=user).order_by('-created_at').first()
        except:
            # Check for Authorization header manually
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')
            if auth_header.startswith('Bearer '):
                token_str = auth_header[7:]
                try:
                    from rest_framework_simplejwt.tokens import AccessToken
                    token = AccessToken(token_str)
                    user_id = token.get('user_id')
                    if user_id:
                        user = User.objects.get(id=user_id)
                        membership = Membership.objects.filter(user=user).order_by('-created_at').first()
                except:
                    pass
    
    return render(request, 'public/users/profile/details.html', {'membership': membership})


def member_donation(request):
    """Show donation page with make donation form and history."""
    from donations.models import MemberDonation, DonationCategory
    
    donations = None
    categories = None
    membership = None
    
    # Check Django session authentication
    if request.user.is_authenticated and not request.user.is_anonymous:
        membership = Membership.objects.filter(user=request.user).order_by('-created_at').first()
        if membership:
            donations = MemberDonation.objects.filter(member=membership).order_by('-donation_date')
            categories = DonationCategory.objects.filter(is_active=True)
    else:
        # Try JWT token authentication as fallback
        from rest_framework_simplejwt.authentication import JWTAuthentication
        from rest_framework.request import Request as DRFRequest
        
        try:
            jwt_auth = JWTAuthentication()
            drf_request = DRFRequest(request)
            auth_result = jwt_auth.authenticate(drf_request)
            if auth_result:
                user, token = auth_result
                membership = Membership.objects.filter(user=user).order_by('-created_at').first()
                if membership:
                    donations = MemberDonation.objects.filter(member=membership).order_by('-donation_date')
                    categories = DonationCategory.objects.filter(is_active=True)
        except:
            # Try Authorization header manually
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')
            if auth_header.startswith('Bearer '):
                token_str = auth_header[7:]
                try:
                    from rest_framework_simplejwt.tokens import AccessToken
                    token = AccessToken(token_str)
                    user_id = token.get('user_id')
                    if user_id:
                        user = User.objects.get(id=user_id)
                        membership = Membership.objects.filter(user=user).order_by('-created_at').first()
                        if membership:
                            donations = MemberDonation.objects.filter(member=membership).order_by('-donation_date')
                            categories = DonationCategory.objects.filter(is_active=True)
                except:
                    pass
    
    # Compute summary statistics for the template
    total_amount = 0
    total_donations = 0
    completed_count = 0
    pending_count = 0

    if donations is not None:
        try:
            from django.db.models import Sum, Q
            agg = donations.aggregate(total=Sum('amount'))
            total_amount = agg.get('total') or 0
        except Exception:
            # Fallback: sum in Python in case of any issues
            try:
                total_amount = sum([d.amount for d in donations])
            except Exception:
                total_amount = 0

        try:
            total_donations = donations.count()
            completed_count = donations.filter(status='completed').count()
            pending_count = donations.filter(status='pending').count()
        except Exception:
            # Best-effort fallbacks
            total_donations = len(donations) if hasattr(donations, '__len__') else 0
            completed_count = 0
            pending_count = 0

    return render(request, 'public/users/donation/details.html', {
        'donations': donations,
        'categories': categories,
        'membership': membership,
        'total_amount': total_amount,
        'total_donations': total_donations,
        'completed_count': completed_count,
        'pending_count': pending_count,
    })


