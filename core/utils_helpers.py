from rest_framework.response import Response
from rest_framework import status


def custom_api_response(success=True, message="", data=None, error=None, status_code=status.HTTP_200_OK):
    """
    Custom API response format
    """
    response_data = {
        'success': success,
        'message': message,
        'data': data,
        'error': error
    }
    return Response(response_data, status=status_code)


