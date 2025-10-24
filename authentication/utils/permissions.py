# app/permissions.py
from rest_framework import permissions
from rest_framework.permissions import BasePermission

from authentication.models import RolePermission


class IsManagementUser(BasePermission):
    """
    Allows access only to users who are in 'Management' group OR is_staff.
    """
    message = "Only management users can perform this action."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_staff:
            return True
        return user.groups.filter(name__iexact="Management").exists()


class IsStaffOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff


class HasRolePermission(permissions.BasePermission):
    """
    Allows access only if user's group has a matching RolePermission.
    """

    def has_permission(self, request, view):
        required_permission = getattr(view, 'required_permission', None)
        user = request.user

        if not required_permission:
            return True  # no custom permission required

        if not user or not user.is_authenticated or not user.group:
            return False

        return RolePermission.objects.filter(
            group=user.group,
            permission_code=required_permission
        ).exists()