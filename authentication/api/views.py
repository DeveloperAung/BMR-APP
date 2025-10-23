# authentication/views.py
from django.contrib.auth.models import Group
from django.contrib.messages import success
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from drf_spectacular.utils import extend_schema, OpenApiParameter, extend_schema_view, OpenApiResponse
from drf_spectacular.types import OpenApiTypes
from google.auth.transport import requests
from google.oauth2 import id_token
from django.conf import settings
from django.db.models import Q
from django.core.paginator import Paginator
from django.contrib.auth import get_user_model
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
import requests as http_requests

from authentication.api.serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    GoogleAuthSerializer,
    UserSerializer, GroupSerializer, RolePermissionSerializer, UserGroupAssignSerializer
)
from authentication.models import RolePermission
from core.utils.handle_google_user import handle_google_user
from core.utils.pagination import StandardResultsSetPagination
from core.utils.responses import ok, fail

User = get_user_model()


@extend_schema(
    tags=["Auth"],
    request=UserRegistrationSerializer,
    responses={201: UserSerializer},
    summary="User Registration",
    description="Register a new user account"
)
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        user_serializer = UserSerializer(user)
        return ok(
            message="User registered successfully",
            data=user_serializer.data
        )
    return fail(error=serializer.errors,
        message="Registration failed"
    )


@extend_schema(
    tags=["Auth"],
    request=UserLoginSerializer,
    responses={200: dict},
    summary="User Login",
    description="Login with email and password"
)
@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        user_serializer = UserSerializer(user)

        return ok(
            data={
                'user': user_serializer.data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            },
            message="Login successful"
        )
    return fail(
        error=serializer.errors,
        message="Login failed"
    )


@extend_schema(
    tags=["Auth"],
    request=GoogleAuthSerializer,
    responses={200: dict},
    summary="Google OAuth Login (ID Token)",
    description="Login with Google OAuth ID token"
)
@api_view(['POST'])
@permission_classes([AllowAny])
def google_auth(request):
    serializer = GoogleAuthSerializer(data=request.data)
    if serializer.is_valid():
        token = serializer.validated_data['token']

        try:
            # Verify the ID token
            idinfo = id_token.verify_oauth2_token(
                token, requests.Request(), settings.GOOGLE_CLIENT_ID
            )

            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Wrong issuer.')

            # Handle user creation/login
            user = handle_google_user(idinfo)
            refresh = RefreshToken.for_user(user)
            user_serializer = UserSerializer(user)

            return ok(
                data={
                    'user': user_serializer.data,
                    'tokens': {
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                    }
                },
                message="Google authentication successful",
            )

        except ValueError as e:
            return fail(
                error=str(e),
                message="Invalid Google token"
            )

    return fail(
        error=serializer.errors,
        message="Invalid data"
    )


# NEW: Google OAuth Code Exchange endpoint
@extend_schema(
    tags=["Auth"],
    request={
        'type': 'object',
        'properties': {
            'code': {'type': 'string'},
            'redirect_uri': {'type': 'string'}
        }
    },
    responses={200: dict},
    summary="Google OAuth Code Exchange",
    description="Exchange Google OAuth authorization code for tokens"
)
@api_view(['POST'])
@permission_classes([AllowAny])
def google_oauth_exchange(request):
    code = request.data.get('code')
    redirect_uri = request.data.get('redirect_uri')

    if not code:
        return fail(
            message="Authorization code is required",
        )

    try:
        # Exchange authorization code for access token
        token_url = 'https://oauth2.googleapis.com/token'
        token_data = {
            'client_id': settings.GOOGLE_CLIENT_ID,
            'client_secret': settings.GOOGLE_CLIENT_SECRET,
            'code': code,
            'grant_type': 'authorization_code',
            'redirect_uri': redirect_uri
        }

        token_response = http_requests.post(token_url, data=token_data)
        token_response.raise_for_status()
        token_info = token_response.json()

        # Get user info using access token
        user_info_url = 'https://www.googleapis.com/oauth2/v2/userinfo'
        headers = {'Authorization': f"Bearer {token_info['access_token']}"}
        user_response = http_requests.get(user_info_url, headers=headers)
        user_response.raise_for_status()
        user_info = user_response.json()

        # Handle user creation/login
        user = handle_google_user(user_info)
        refresh = RefreshToken.for_user(user)
        user_serializer = UserSerializer(user)

        return ok(
            data={
                'user': user_serializer.data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            },
            message="Google OAuth authentication successful",

        )

    except http_requests.exceptions.RequestException as e:
        return fail(
            error=str(e),
            message="Failed to exchange authorization code"
        )
    except Exception as e:
        return fail(
            error=str(e),
            message="Google OAuth authentication failed"
        )


@extend_schema(
    tags=["Auth"],
    responses={200: UserSerializer},
    summary="Get User Profile",
    description="Get current user profile information"
)
@api_view(['GET'])
def profile(request):
    serializer = UserSerializer(request.user)
    return ok(
        data=serializer.data,
        message="Profile retrieved successfully",
    )


@extend_schema(
    tags=["Auth"],
    request=UserSerializer,
    responses={200: UserSerializer},
    summary="Update User Profile",
    description="Update current user profile information"
)
@api_view(['PUT'])
def update_profile(request):
    serializer = UserSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return ok(
            data=serializer.data,
            message="Profile updated successfully"

        )
    return fail(
        error=serializer.errors,
        message="Profile update failed"
    )


# Google OAuth Callback View (for handling the popup redirect)
@csrf_exempt
def google_callback(request):
    """Handle Google OAuth callback in popup window"""
    code = request.GET.get('code')
    error = request.GET.get('error')

    if error:
        return render(request, 'google_callback.html', {
            'success': False,
            'error': error
        })

    if code:
        return render(request, 'google_callback.html', {
            'success': True,
            'code': code
        })

    return render(request, 'google_callback.html', {
        'success': False,
        'error': 'No authorization code received'
    })


@extend_schema(
    tags=["Auth"],
    request={
        'type': 'object',
        'properties': {
            'refresh': {'type': 'string'}
        }
    },
    responses={200: dict},
    summary="User Logout",
    description="Logout user and blacklist refresh token"
)
@api_view(['POST'])
@permission_classes([AllowAny])
def logout(request):
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()

        return ok(
            message="Logout successful"
        )
    except TokenError:
        return fail(
            message="Invalid token"
        )
    except Exception as e:
        return ok(
            message="Logout completed"  # Still return success even if blacklisting fails
        )


@extend_schema(
    tags=["Users"],
    parameters=[
        OpenApiParameter(
            name='page',
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
            description='Page number',
            default=1
        ),
        OpenApiParameter(
            name='per_page',
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
            description='Items per page (30, 50, 100)',
            default=30
        ),
        OpenApiParameter(
            name='search',
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description='Search by email, username, first_name, or last_name'
        ),
        OpenApiParameter(
            name='is_staff',
            type=OpenApiTypes.BOOL,
            location=OpenApiParameter.QUERY,
            description='Filter by staff status'
        ),
        OpenApiParameter(
            name='is_verified',
            type=OpenApiTypes.BOOL,
            location=OpenApiParameter.QUERY,
            description='Filter by email verification status'
        ),
        OpenApiParameter(
            name='ordering',
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description='Order by field (id, email, username, first_name, last_name, date_joined). Add - for descending order.',
            default='-date_joined'
        )
    ],
    responses={200: dict},
    summary="Get Users List",
    description="Get paginated list of users with filtering and search functionality"
)
@api_view(['GET'])
@permission_classes([IsAdminUser])
def users_list(request):
    """
    Get paginated list of users with filtering and search
    Only staff users can access this endpoint
    """
    if not request.user.is_staff:
        return fail(
            message="Access denied. Staff privileges required.",
            status=status.HTTP_403_FORBIDDEN
        )

    # Get query parameters
    page = request.GET.get('page', 1)
    per_page = request.GET.get('per_page', 30)
    search = request.GET.get('search', '')
    is_staff_filter = request.GET.get('is_staff', '')
    is_verified_filter = request.GET.get('is_verified', '')
    ordering = request.GET.get('ordering', '-date_joined')

    # Validate per_page parameter
    try:
        per_page = int(per_page)
        if per_page not in [30, 50, 100]:
            per_page = 30
    except (ValueError, TypeError):
        per_page = 30

    # Validate page parameter
    try:
        page = int(page)
        if page < 1:
            page = 1
    except (ValueError, TypeError):
        page = 1

    # Start with all users
    users = User.objects.all()

    # Apply search filter
    if search:
        users = users.filter(
            Q(email__icontains=search) |
            Q(username__icontains=search) |
            Q(first_name__icontains=search) |
            Q(last_name__icontains=search)
        )

    # Apply staff filter
    if is_staff_filter.lower() in ['true', '1']:
        users = users.filter(is_staff=True)
    elif is_staff_filter.lower() in ['false', '0']:
        users = users.filter(is_staff=False)

    # Apply email verification filter
    if is_verified_filter.lower() in ['true', '1']:
        users = users.filter(is_email_verified=True)
    elif is_verified_filter.lower() in ['false', '0']:
        users = users.filter(is_email_verified=False)

    # Apply ordering
    allowed_ordering_fields = ['id', 'email', 'username', 'first_name', 'last_name', 'date_joined', 'is_staff',
                               'is_email_verified']
    if ordering.startswith('-'):
        field = ordering[1:]
    else:
        field = ordering

    if field in allowed_ordering_fields:
        users = users.order_by(ordering)
    else:
        users = users.order_by('-date_joined')

    # Pagination
    paginator = Paginator(users, per_page)

    try:
        users_page = paginator.page(page)
    except:
        users_page = paginator.page(1)
        page = 1


    # Prepare pagination info
    paginator = StandardResultsSetPagination()
    paginated_users = paginator.paginate_queryset(users, request)

    # Serialize users
    serializer = UserSerializer(users_page.object_list, many=True)

    return paginator.get_paginated_response(serializer.data)


@extend_schema(
    tags=['Users'],
    responses={200: UserSerializer},
    summary="Get User Details",
    description="Get detailed information about a specific user"
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_detail(request, user_id):
    """
    Get detailed information about a specific user
    Only staff users can access this endpoint
    """
    if not request.user.is_staff:
        return fail(
            message="Access denied. Staff privileges required.",
            status=status.HTTP_403_FORBIDDEN
        )
    try:
        user = User.objects.get(id=user_id)
        serializer = UserSerializer(user)
        return ok(
            data=serializer.data,
            message="User details retrieved successfully"
        )
    except User.DoesNotExist:
        return fail(
            message="User not found",
            status=status.HTTP_404_NOT_FOUND
        )


@extend_schema(
    tags=['Users'],
    request=UserSerializer,
    responses={200: UserSerializer},
    summary="Update User",
    description="Update user information"
)
@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_user(request, user_id):
    """
    Update user information
    Only staff users can access this endpoint
    """
    if not request.user.is_staff:
        return fail(
            message="Access denied. Staff privileges required.",
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        user = User.objects.get(id=user_id)
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return ok(
                data=serializer.data,
                message="User updated successfully"
            )
        return fail(
            error=serializer.errors,
            message="User update failed"
        )
    except User.DoesNotExist:
        return fail(
            message="User not found",
            status=status.HTTP_404_NOT_FOUND
        )


@extend_schema(
    tags=['Users'],
    responses={200: dict},
    summary="Delete User",
    description="Delete a user account"
)
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_user(request, user_id):
    """
    Delete a user account
    Only staff users can access this endpoint
    """
    if not request.user.is_staff:
        return fail(
            message="Access denied. Staff privileges required.",
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        user = User.objects.get(id=user_id)

        # Prevent self-deletion
        if user.id == request.user.id:
            return fail(
                message="Cannot delete your own account"
            )

        user.delete()
        return ok(
            message="User deleted successfully"
        )
    except User.DoesNotExist:
        return fail(
            message="User not found",
            status=status.HTTP_404_NOT_FOUND
        )


@extend_schema_view(
    list=extend_schema(summary="List all groups"),
    create=extend_schema(summary="Create new group"),
    retrieve=extend_schema(summary="Get group by ID"),
    update=extend_schema(summary="Update group"),
    partial_update=extend_schema(summary="Partially update group"),
    destroy=extend_schema(summary="Delete group"),
)
class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer

    @extend_schema(
        tags=['Users'],
        request={
            "application/json": {
                "type": "object",
                "properties": {
                    "permission_code": {
                        "type": "string",
                        "example": "article_publish"
                    }
                },
                "required": ["permission_code"]
            }
        },
        description="Add a custom permission code to a specific group"
    )
    @action(detail=True, methods=['post'])
    def add_permission(self, request, pk=None):
        group = self.get_object()
        permission_code = request.data.get('permission_code')

        if not permission_code:
            return fail(
                error="permission_code is required",
                status=400
            )

        obj, created = RolePermission.objects.get_or_create(group=group, permission_code=permission_code)

        if not created:
            return fail(
                message= 'Permission already exists for this role',
                status=200
            )

        return Response({'message': f'Permission \"{permission_code}\" added to group \"{group.name}\"'}, status=201)


class RolePermissionViewSet(viewsets.ModelViewSet):
    queryset = RolePermission.objects.all()
    serializer_class = RolePermissionSerializer


class AssignUserToGroupView(APIView):
    permission_classes = [IsAdminUser]

    @extend_schema(
        summary="Assign user to a group (role)",
        description="Assigns a Django user to a specific group (i.e., role), granting them all custom permissions associated with that group.",
        request=UserGroupAssignSerializer,
        responses={
            200: OpenApiResponse(description="User assigned to group"),
            400: OpenApiResponse(description="Invalid input or user/group not found")
        },
        tags=["Users"]
    )
    def post(self, request):
        serializer = UserGroupAssignSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return ok(
                data=serializer.data,
                message= "User assigned to group",
                status=status.HTTP_200_OK
            )
        return fail(error=serializer.errors, message="Something went wrong")


class UserPermissionsView(APIView):
    @extend_schema(
        summary="List user’s effective custom permissions",
        description="Returns all custom permission codes the user has access to, based on the groups they belong to.",
        responses={
            200: OpenApiResponse(description="List of permissions"),
            404: OpenApiResponse(description="User not found")
        },
        tags=["Users"]
    )
    def get(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return fail(error= "User not found", status=404)

        perms = RolePermission.objects.filter(group__in=user.groups.all()).values_list('permission_code', flat=True)
        return ok(data=list(perms), message="Permissions list retrieved successfully")