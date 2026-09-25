from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

def global_exception_handler(exc, context):
    """
    Custom exception handler for Django Rest Framework.
    Returns a consistent error format for all API errors.
    """
    # Call DRF's default exception handler first to get the standard error response
    response = exception_handler(exc, context)

    if response is not None:
        # Customize the standard error response
        custom_data = {
            'success': False,
            'status_code': response.status_code,
            'message': 'An error occurred during processing.',
            'errors': response.data
        }
        
        # Extract meaningful messages if possible
        if isinstance(response.data, dict) and 'detail' in response.data:
            custom_data['message'] = response.data['detail']
        
        response.data = custom_data
    else:
        # Handle non-DRF exceptions (e.g. database errors, zero division, etc.)
        # These would normally result in a 500 server error
        custom_data = {
            'success': False,
            'status_code': 500,
            'message': 'Internal Server Error. Our team has been notified.',
            'errors': str(exc) if hasattr(exc, '__str__') else 'Unknown Error'
        }
        return Response(custom_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return response
