from django.contrib.auth.models import Group
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import get_user_model
from django.utils import timezone

from authentication.models import RolePermission, Permission
from django.contrib.auth.models import Group

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'username', 'first_name', 'last_name', 'password', 'password_confirm')

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            user = authenticate(username=email, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            attrs['user'] = user
        return attrs


class GoogleAuthSerializer(serializers.Serializer):
    token = serializers.CharField()


class UserSerializer(serializers.ModelSerializer):
    group = serializers.PrimaryKeyRelatedField(queryset=Group.objects.all(), allow_null=True, required=False)
    group_name = serializers.CharField(source='group.name', read_only=True)

    class Meta:
        model = User
        fields = (
            'id', 'email', 'username', 'first_name', 'last_name', 'profile_picture',
            'is_email_verified', 'mobile', 'secondary_mobile', 'is_staff', 'last_login',
            'date_joined', 'is_active', 'is_locked', 'group', 'group_name'
        )
        read_only_fields = ('id', 'is_email_verified', 'last_login', 'date_joined')


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate(self, attrs):
        # We intentionally do not error when the user is missing to avoid leaking account existence
        attrs['user'] = User.objects.filter(email=attrs['email'], is_active=True).first()
        return attrs


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=4)
    new_password = serializers.CharField(write_only=True)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("Passwords don't match")

        try:
            user = User.objects.get(email=attrs['email'])
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found")

        if user.otp_code != attrs['otp']:
            raise serializers.ValidationError("Invalid OTP code")

        if not user.otp_expired_at or user.otp_expired_at < timezone.now():
            raise serializers.ValidationError("OTP code has expired")

        validate_password(attrs['new_password'], user=user)
        attrs['user'] = user
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        request = self.context.get('request')
        user = getattr(request, 'user', None)

        if not user:
            raise serializers.ValidationError("Authenticated user is required")

        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("Passwords don't match")

        if not user.check_password(attrs['old_password']):
            raise serializers.ValidationError({"old_password": "Incorrect password"})

        validate_password(attrs['new_password'], user=user)
        attrs['user'] = user
        return attrs


class StaffUserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password_confirm = serializers.CharField(write_only=True, required=False, allow_blank=True)
    group = serializers.PrimaryKeyRelatedField(queryset=Group.objects.all(), allow_null=True, required=False)

    class Meta:
        model = User
        fields = ('email', 'username', 'first_name', 'last_name', 'password', 'password_confirm', 'is_staff', 'is_active', 'is_locked', 'group')

    def validate(self, attrs):
        password = attrs.get('password')
        password_confirm = attrs.get('password_confirm')

        # Allow passwordless creation; if one field provided without the other, raise error
        if (password and not password_confirm) or (password_confirm and not password):
            raise serializers.ValidationError("Both password and password_confirm are required when setting a password")

        if password and password_confirm and password != password_confirm:
            raise serializers.ValidationError("Passwords don't match")

        if password:
            validate_password(password)

        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm', None)
        password = validated_data.pop('password', None)
        group = validated_data.pop('group', None)

        # Create user without password first
        user = User.objects.create_user(**validated_data)

        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        if group:
            user.group = group

        user.save()
        if group:
            user.groups.add(group)
        return user


class GroupSerializer(serializers.ModelSerializer):
    permissions = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    permissions_detail = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Group
        fields = ['id', 'name', 'permissions', 'permissions_detail']

    def get_permissions_detail(self, obj):
        qs = RolePermission.objects.filter(group=obj).select_related('permission')
        return [
            {
                'id': rp.permission.id,
                'code': rp.permission.code,
                'description': rp.permission.description
            }
            for rp in qs
        ]

    def _set_permissions(self, group, permission_ids):
        valid_permissions = Permission.objects.filter(id__in=permission_ids)
        valid_ids = set(valid_permissions.values_list('id', flat=True))

        # Remove stale links
        RolePermission.objects.filter(group=group).exclude(permission_id__in=valid_ids).delete()

        # Add new links
        for perm_id in valid_ids:
            RolePermission.objects.get_or_create(group=group, permission_id=perm_id)

    def create(self, validated_data):
        permission_ids = validated_data.pop('permissions', [])
        group = super().create(validated_data)
        if permission_ids:
            self._set_permissions(group, permission_ids)
        return group

    def update(self, instance, validated_data):
        permission_ids = validated_data.pop('permissions', None)
        group = super().update(instance, validated_data)
        if permission_ids is not None:
            self._set_permissions(group, permission_ids)
        return group

class RolePermissionSerializer(serializers.ModelSerializer):
    group_name = serializers.CharField(source='group.name', read_only=True)
    permission_code = serializers.CharField(source='permission.code', read_only=True)

    class Meta:
        model = RolePermission
        fields = ['id', 'group', 'group_name', 'permission', 'permission_code']


class UserGroupAssignSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    group_id = serializers.IntegerField()

    def validate(self, data):
        try:
            data['user'] = User.objects.get(id=data['user_id'])
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found")

        try:
            data['group'] = Group.objects.get(id=data['group_id'])
        except Group.DoesNotExist:
            raise serializers.ValidationError("Group not found")

        return data

    def create(self, validated_data):
        user = validated_data['user']
        group = validated_data['group']
        user.groups.add(group)
        return user
