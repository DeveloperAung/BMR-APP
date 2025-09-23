from rest_framework.views import exception_handler
from rest_framework.response import Response
from .responses import fail
from django.db import IntegrityError

def enveloped_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return None
    return fail(error=response.data, message="Request failed", status=response.status_code)

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if isinstance(exc, IntegrityError):
        return Response(
            {"error": {"detail": "Duplicate entry not allowed."}},
            status=400
        )

    return response