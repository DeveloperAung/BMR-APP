# memberships/api/serializers.py
from datetime import date
from decimal import Decimal
from urllib.parse import quote
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import models
from django.core.validators import RegexValidator

from memberships.models import (
    Status, EducationLevel, Institution, MembershipType,
    PersonalInfo, ContactInfo, WorkInfo, EducationInfo, Membership, MembershipPayment
)
from memberships.services.payments import HitPayClient

# from memberships.services.payments import create_hitpay_payment, PaymentCreateError

User = get_user_model()


# Lookup serializers
class EducationLevelListSerializer(serializers.ModelSerializer):
    class Meta:
        model = EducationLevel
        fields = ("uuid", "name", "description")


class InstitutionListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Institution
        fields = ("uuid", "name", "description")


class MembershipTypeListSerializer(serializers.ModelSerializer):
    class Meta:
        model = MembershipType
        fields = ("uuid", "name", "amount", "description")


# Read-only serializers with decrypted and masked data
class PersonalInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PersonalInfo
        fields = ("uuid", "full_name", "date_of_birth", "gender",
                  "country_of_birth", "city_of_birth", "citizenship")


class ContactInfoReadSerializer(serializers.ModelSerializer):
    # Include both full and masked versions
    nric_fin_full = serializers.SerializerMethodField()
    nric_fin_masked = serializers.SerializerMethodField()
    primary_contact_full = serializers.SerializerMethodField()
    primary_contact_masked = serializers.SerializerMethodField()
    secondary_contact_full = serializers.SerializerMethodField()
    secondary_contact_masked = serializers.SerializerMethodField()

    class Meta:
        model = ContactInfo
        fields = ("uuid", "nric_fin_full", "nric_fin_masked",
                  "primary_contact_full", "primary_contact_masked",
                  "secondary_contact_full", "secondary_contact_masked",
                  "residential_status", "postal_code", "address")

    def get_nric_fin_full(self, obj):
        # Only show full data to staff or object owner
        request = self.context.get('request')
        if request and (request.user.is_staff or self._is_owner(obj, request.user)):
            return obj.nric_fin
        return None

    def get_nric_fin_masked(self, obj):
        return obj.nric_fin_masked

    def get_primary_contact_full(self, obj):
        request = self.context.get('request')
        if request and (request.user.is_staff or self._is_owner(obj, request.user)):
            return obj.primary_contact
        return None

    def get_primary_contact_masked(self, obj):
        return obj.primary_contact_masked

    def get_secondary_contact_full(self, obj):
        request = self.context.get('request')
        if request and (request.user.is_staff or self._is_owner(obj, request.user)):
            return obj.secondary_contact
        return None

    def get_secondary_contact_masked(self, obj):
        return obj.secondary_contact_masked

    def _is_owner(self, obj, user):
        """Check if user owns this contact info"""
        try:
            return obj.membership.user == user
        except:
            return False


class WorkInfoReadSerializer(serializers.ModelSerializer):
    company_contact_full = serializers.SerializerMethodField()
    company_contact_masked = serializers.SerializerMethodField()

    class Meta:
        model = WorkInfo
        fields = ("uuid", "occupation", "company_name", "company_address",
                  "company_postal_code", "company_contact_full", "company_contact_masked")

    def get_company_contact_full(self, obj):
        request = self.context.get('request')
        if request and (request.user.is_staff or self._is_owner(obj, request.user)):
            return obj.company_contact
        return None

    def get_company_contact_masked(self, obj):
        return obj.company_contact_masked

    def _is_owner(self, obj, user):
        try:
            return obj.membership.user == user
        except:
            return False


class EducationInfoSerializer(serializers.ModelSerializer):
    education_name = serializers.CharField(source='education.name', read_only=True)
    institution_name = serializers.CharField(source='institution.name', read_only=True)

    class Meta:
        model = EducationInfo
        fields = ("uuid", "education", "education_name", "institution",
                  "institution_name", "other_societies")


class StatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Status
        fields = ("uuid", "internal_status", "external_status", "description",
                  "status_code")


class MembershipReadSerializer(serializers.ModelSerializer):
    user = serializers.CharField(source="user.username", read_only=True)
    membership_type_name = serializers.CharField(source="membership_type.name", read_only=True)
    workflow_status_name = serializers.CharField(source="workflow_status.internal_status", read_only=True)

    membership_type = MembershipTypeListSerializer(read_only=True)
    profile_info = PersonalInfoSerializer(read_only=True)
    contact_info = ContactInfoReadSerializer(read_only=True)
    education_info = EducationInfoSerializer(read_only=True)
    work_info = WorkInfoReadSerializer(read_only=True)
    workflow_status = StatusSerializer(read_only=True)
    can_edit = serializers.SerializerMethodField()

    class Meta:
        model = Membership
        fields = (
            "uuid", "reference_no", "user", "profile_picture", "applied_date",
            "membership_type", "membership_type_name", "membership_number", "profile_info", "contact_info",
            "education_info", "work_info", "workflow_status", "workflow_status_name", "reason",
            "is_profile_completed", "is_contact_completed", "is_education_completed",
            "is_work_completed", "is_payment_generated", "submitted_at", "can_edit"
        )

        read_only_fields = ("uuid", "reference_no", "user", "membership_type_name")

    def get_can_edit(self, obj):
        return obj.can_edit()


# Write serializers for creating/updating
class PersonalInfoCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PersonalInfo
        fields = ("full_name", "date_of_birth", "gender",
                  "country_of_birth", "city_of_birth", "citizenship")


class ContactInfoCreateSerializer(serializers.ModelSerializer):
    """
    Accepts plain text input, encrypts on save.
    Returns masked + full values on read.
    """
    nric_fin = serializers.CharField(
        validators=[RegexValidator(
            regex=r'^[STFG]\d{7}[A-Z]$',
            message='NRIC/FIN must start with S, T, F, or G followed by 7 digits and an alphabet.'
        )]
    )
    primary_contact = serializers.CharField(max_length=25)
    secondary_contact = serializers.CharField(max_length=25, required=False, allow_blank=True)

    class Meta:
        model = ContactInfo
        fields = ("nric_fin", "primary_contact", "secondary_contact",
                  "residential_status", "postal_code", "address")

    def create(self, validated_data):
        contact_info = ContactInfo()
        # Use property setters to trigger encryption
        contact_info.nric_fin = validated_data.get('nric_fin')
        contact_info.primary_contact = validated_data.get('primary_contact')
        contact_info.secondary_contact = validated_data.get('secondary_contact', '')

        # Set other fields normally
        contact_info.residential_status = validated_data.get('residential_status')
        contact_info.postal_code = validated_data.get('postal_code')
        contact_info.address = validated_data.get('address')
        contact_info.save()
        return contact_info

    def update(self, instance, validated_data):
        # Update encrypted fields using property setters
        if 'nric_fin' in validated_data:
            instance.nric_fin = validated_data['nric_fin']
        if 'primary_contact' in validated_data:
            instance.primary_contact = validated_data['primary_contact']
        if 'secondary_contact' in validated_data:
            instance.secondary_contact = validated_data['secondary_contact']

        # Update other fields
        instance.residential_status = validated_data.get('residential_status', instance.residential_status)
        instance.postal_code = validated_data.get('postal_code', instance.postal_code)
        instance.address = validated_data.get('address', instance.address)
        instance.save()
        return instance



class WorkInfoCreateSerializer(serializers.ModelSerializer):
    company_contact = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = WorkInfo
        fields = ("occupation", "company_name", "company_address",
                  "company_postal_code", "company_contact")

    def create(self, validated_data):
        work_info = WorkInfo()
        # Use property setter for encryption
        work_info.company_contact = validated_data.get('company_contact', '')

        # Set other fields
        work_info.occupation = validated_data.get('occupation')
        work_info.company_name = validated_data.get('company_name')
        work_info.company_address = validated_data.get('company_address')
        work_info.company_postal_code = validated_data.get('company_postal_code')
        work_info.save()
        return work_info

    def update(self, instance, validated_data):
        if 'company_contact' in validated_data:
            instance.company_contact = validated_data['company_contact']

        instance.occupation = validated_data.get('occupation', instance.occupation)
        instance.company_name = validated_data.get('company_name', instance.company_name)
        instance.company_address = validated_data.get('company_address', instance.company_address)
        instance.company_postal_code = validated_data.get('company_postal_code', instance.company_postal_code)
        instance.save()
        return instance


class EducationInfoCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EducationInfo
        fields = ("education", "institution", "other_societies")


# Membership operation serializers - Updated for 2-page workflow
class MembershipPage1Serializer(serializers.Serializer):
    """Page 1: Profile Info + Contact Info + Membership Type + Profile Image"""
    profile_info = PersonalInfoCreateSerializer()
    contact_info = ContactInfoCreateSerializer()
    membership_type = serializers.PrimaryKeyRelatedField(queryset=MembershipType.objects.all())
    profile_picture = serializers.ImageField(required=False, allow_null=True)

    def validate(self, attrs):
        membership = self.context['membership']
        if not membership.can_edit():
            raise serializers.ValidationError("Cannot edit membership after approval")
        return attrs

    def save(self):
        membership = self.context['membership']
        profile_data = self.validated_data['profile_info']
        contact_data = self.validated_data['contact_info']

        # Handle Profile Info
        if membership.profile_info:
            # Update existing
            for field, value in profile_data.items():
                setattr(membership.profile_info, field, value)
            membership.profile_info.save()
        else:
            # Create new
            membership.profile_info = PersonalInfo.objects.create(**profile_data)

        # Handle Contact Info (with encryption)
        if membership.contact_info:
            # Update existing using serializer to handle encryption
            contact_serializer = ContactInfoCreateSerializer(membership.contact_info, data=contact_data)
            contact_serializer.is_valid(raise_exception=True)
            contact_serializer.save()
        else:
            # Create new
            contact_serializer = ContactInfoCreateSerializer(data=contact_data)
            contact_serializer.is_valid(raise_exception=True)
            membership.contact_info = contact_serializer.save()

        # Update other fields
        if 'profile_picture' in self.validated_data:
            membership.profile_picture = self.validated_data['profile_picture']
        membership.membership_type = self.validated_data['membership_type']

        # Mark page 1 as completed
        membership.is_profile_completed = True
        membership.is_contact_completed = True
        membership.save()

        return membership


class MembershipPage2Serializer(serializers.Serializer):
    """Page 2: Education Info + Work Info + Submit Application + Generate HitPay QR"""
    education_info = EducationInfoCreateSerializer()
    work_info = WorkInfoCreateSerializer()

    def validate(self, attrs):
        membership = self.context['membership']
        if not membership.can_edit():
            raise serializers.ValidationError("Cannot edit membership after approval")

        # Ensure page 1 is completed
        if not (membership.is_profile_completed and membership.is_contact_completed):
            raise serializers.ValidationError("Please complete Page 1 (Profile & Contact Info) first")

        return attrs

    def save(self):
        from django.utils import timezone
        membership = self.context['membership']
        education_data = self.validated_data['education_info']
        work_data = self.validated_data['work_info']

        # Handle Education Info
        if membership.education_info:
            # Update existing
            for field, value in education_data.items():
                setattr(membership.education_info, field, value)
            membership.education_info.save()
        else:
            # Create new
            membership.education_info = EducationInfo.objects.create(**education_data)

        # Handle Work Info (with encryption)
        if membership.work_info:
            # Update existing using serializer to handle encryption
            work_serializer = WorkInfoCreateSerializer(membership.work_info, data=work_data)
            work_serializer.is_valid(raise_exception=True)
            work_serializer.save()
        else:
            # Create new
            work_serializer = WorkInfoCreateSerializer(data=work_data)
            work_serializer.is_valid(raise_exception=True)
            membership.work_info = work_serializer.save()

        # Mark page 2 as completed and set to pending payment status
        membership.is_education_completed = True
        membership.is_work_completed = True
        membership.submitted_at = timezone.now()

        # Set to pending payment status (status code 11)
        pending_payment_status, _ = Status.objects.get_or_create(
            status_code="11",
            defaults={"internal_status": "Pending Payment", "external_status": "Pending Payment"}
        )
        membership.workflow_status = pending_payment_status
        membership.save()

        # Generate HitPay payment if not already generated
        if not membership.is_payment_generated:
            amount = membership.calculate_membership_fee()
            payment_serializer = CreateOnlinePaymentSerializer(
                data={"amount": amount, "currency": "SGD"},
                context={"membership": membership}
            )
            payment_serializer.is_valid(raise_exception=True)
            payment = payment_serializer.save()

            membership.is_payment_generated = True
            membership.save()

            self.context['payment'] = payment

        return membership


# Remove old individual serializers - no longer needed
# Keep only the ones we still use for updates if needed


def _normalize_qr_code_value(raw_value):
    """
    Format QR code strings returned from HitPay. They can be absolute URLs,
    server-static paths or raw base64 without the data URI prefix.
    """
    if not raw_value:
        return None

    qr_code = str(raw_value).strip()
    if not qr_code:
        return None

    lowered = qr_code.lower()
    if lowered.startswith("data:image"):
        return qr_code

    # For http/https links: if not already an image, wrap into a QR image once.
    if qr_code.startswith(("http://", "https://")):
        if lowered.endswith((".png", ".jpg", ".jpeg")):
            return qr_code
        encoded = quote(qr_code, safe="")
        return f"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={encoded}"

    # For absolute/relative paths, return as-is
    if qr_code.startswith("/"):
        return qr_code

    compact = ''.join(qr_code.split())
    return f"data:image/png;base64,{compact}"


def _extract_qr_code_from_response(data):
    """
    HitPay sometimes returns qr_code as a nested object or within qr_code_data.
    Normalize those variations into a single string.
    """
    if not isinstance(data, dict):
        return data

    qr_blob = data.get("qr_code")
    if isinstance(qr_blob, dict):
        qr_blob = (
            qr_blob.get("qr_code")
            or qr_blob.get("base64")
            or qr_blob.get("image")
            or qr_blob.get("url")
        )
    if isinstance(qr_blob, str) and qr_blob.strip():
        return qr_blob

    qr_data = data.get("qr_code_data") or {}
    if isinstance(qr_data, dict):
        qr_blob = (
            qr_data.get("qr_code")
            or qr_data.get("base64")
            or qr_data.get("image")
        )
        if isinstance(qr_blob, str) and qr_blob.strip():
            return qr_blob

    fallback = data.get("qr_code_url") or data.get("qr_code_link") or data.get("url")
    return fallback


class PaymentReadSerializer(serializers.ModelSerializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, coerce_to_string=True)
    qr_code = serializers.SerializerMethodField()

    class Meta:
        model = MembershipPayment
        fields = ("uuid", "method", "provider", "status", "external_id", "reference_no",
                  "description", "amount", "currency", "period_year", "due_date",
                  "paid_at", "qr_code")

    def get_qr_code(self, obj):
        return _normalize_qr_code_value(getattr(obj, "qr_code", None))


class CreateOnlinePaymentSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    currency = serializers.CharField(required=False, default="SGD")
    period_year = serializers.IntegerField(required=False)
    description = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        membership = self.context["membership"]
        if "amount" not in attrs or attrs["amount"] is None:
            if membership.membership_type and membership.membership_type.amount is not None:
                attrs["amount"] = membership.calculate_membership_fee()
            else:
                raise serializers.ValidationError("Amount is required when membership has no membership_type amount.")
        if "period_year" not in attrs or not attrs["period_year"]:
            attrs["period_year"] = date.today().year
        if "description" not in attrs or not attrs["description"]:
            attrs["description"] = f"Membership application payment - {membership.reference_no}"
        return attrs

    def save(self):
        membership = self.context["membership"]
        amount = self.validated_data["amount"]
        currency = self.validated_data.get("currency", "SGD")
        description = self.validated_data["description"]
        period_year = self.validated_data["period_year"]

        from django.conf import settings
        webhook_url = getattr(settings, 'HITPAY_WEBHOOK_URL', None)
        client = HitPayClient()

        # Require a webhook for HitPay, but allow localhost in debug; still call HitPay to get a real QR.
        if not webhook_url:
            raise serializers.ValidationError("HITPAY_WEBHOOK_URL is not configured")

        # Create real payment
        try:
            data = client.create_payment_request(
                amount=str(amount),
                currency=currency,
                payment_methods=["paynow_online"],
                generate_qr=True,
                reference_number=f"membership_{membership.id}",
                webhook_url=webhook_url
            )
        except Exception as e:
            raise serializers.ValidationError(f"Payment creation failed: {str(e)}")

        external_id = data.get("id")
        qr_code = _extract_qr_code_from_response(data)

        return MembershipPayment.objects.create(
            membership=membership,
            method="hitpay",
            provider="hitpay",
            status="created",
            external_id=external_id,
            description=description,
            amount=amount,
            currency=currency.upper(),
            period_year=period_year,
            qr_code=qr_code,
            raw_response=data
        )


class CreateOfflinePaymentSerializer(serializers.Serializer):
    method = serializers.ChoiceField(choices=[("bank_transfer", "bank_transfer"), ("cash", "cash")])
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    currency = serializers.CharField(required=False, default="SGD")
    period_year = serializers.IntegerField(required=False)
    reference_no = serializers.CharField(required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
    receipt_image = serializers.ImageField(required=False, allow_null=True)

    def validate(self, attrs):
        membership = self.context["membership"]
        if "amount" not in attrs or attrs["amount"] in (None, ""):
            amount = membership.calculate_membership_fee()
            if amount is None:
                raise serializers.ValidationError({"amount": "Unable to determine membership fee amount."})
            attrs["amount"] = amount
        if "currency" not in attrs or not attrs["currency"]:
            attrs["currency"] = "SGD"
        if "period_year" not in attrs or not attrs["period_year"]:
            attrs["period_year"] = date.today().year
        return attrs

    def save(self):
        membership = self.context["membership"]
        p = MembershipPayment.objects.create(
            membership=membership,
            method=self.validated_data["method"],
            provider=None,
            status="pending",  # pending staff confirmation
            amount=self.validated_data["amount"],
            currency=self.validated_data.get("currency", "SGD").upper(),
            period_year=self.validated_data["period_year"],
            reference_no=self.validated_data.get("reference_no"),
            description=self.validated_data.get("description", ""),
            receipt_image=self.validated_data.get("receipt_image"),
        )
        return p


class MembershipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Membership
        fields = "__all__"  # keep your existing fields visible as needed

class MembershipWorkflowDecisionSerializer(serializers.Serializer):
    """
    Accepts either an action or an explicit status reference.
    - action: 'approve' | 'reject' | 'revise'
    - comment: stored in Membership.reason
    Optional overrides:
    - status_id: primary key of Status
    - status_code: your seed_data 'status_code' (e.g. "40")
    """
    action = serializers.ChoiceField(choices=["approve", "reject", "revise"], required=False)
    comment = serializers.CharField(required=False, allow_blank=True, max_length=2000)
    status_id = serializers.IntegerField(required=False)
    status_code = serializers.CharField(required=False)

    def _resolve_status_from_action(self, action: str) -> Status:
        """
        Map action -> Status row using seed_data naming.
        We try internal_status/external_status case-insensitively with common labels.
        """
        label_map = {
            "approve": ["Approved", "APPROVED"],
            "reject": ["Rejected", "REJECTED"],
            "revise": ["Revision Requested", "REVISION_REQUESTED", "Revision_required", "Needs Revision"],
        }
        labels = label_map[action]
        qs = Status.objects.filter(
            models.Q(internal_status__in=labels) | models.Q(external_status__in=labels)
        )
        obj = qs.order_by("id").first()
        if not obj:
            code_map = {"approve": "16", "reject": "14", "revise": "13"}
            code = code_map[action]
            obj = Status.objects.filter(status_code=str(code)).first()
        if not obj:
            raise serializers.ValidationError(
                f"Cannot resolve a Status for action '{action}'. "
                "Provide 'status_id' or 'status_code' explicitly."
            )
        return obj

    def validate(self, data):
        # Explicit status wins if provided
        status_obj = None
        if "status_id" in data and data["status_id"] is not None:
            try:
                status_obj = Status.objects.get(pk=data["status_id"])
            except Status.DoesNotExist:
                raise serializers.ValidationError({"status_id": "Invalid status_id."})

        if not status_obj and data.get("status_code"):
            status_obj = Status.objects.filter(status_code=str(data["status_code"])).first()
            if not status_obj:
                raise serializers.ValidationError({"status_code": "Invalid status_code."})

        if not status_obj:
            action = data.get("action")
            if not action:
                raise serializers.ValidationError(
                    "Provide either 'action' (approve/reject/revise) or 'status_id' / 'status_code'."
                )
            status_obj = self._resolve_status_from_action(action)

        data["target_status"] = status_obj
        return data
