from rest_framework.response import Response
from rest_framework import status

class SoftDeleteMixin:
    """
    Replace destroy() with a soft delete using is_active flag
    """
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if hasattr(instance, "is_active"):
            instance.is_active = False
            instance.save(update_fields=["is_active"])
            return Response(
                {
                    "success": True,
                    "data": {"id": instance.id, "is_active": False},
                    "message": f"{instance.__class__.__name__} has been deactivated successfully."
                },
                status=status.HTTP_200_OK,
            )
        return Response(
            {"success": False, "message": "Model does not support soft delete"},
            status=status.HTTP_400_BAD_REQUEST,
        )