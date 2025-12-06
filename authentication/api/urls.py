from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from authentication.api import views
from authentication.api.views import GroupViewSet, RolePermissionViewSet, AssignUserToGroupView, UserPermissionsView

router = DefaultRouter()
router.register('groups', GroupViewSet)
router.register('permissions', RolePermissionViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('logout/', views.logout, name='logout'),
    path('password/forgot/', views.forgot_password, name='forgot_password'),
    path('password/reset/', views.reset_password, name='reset_password'),
    path('password/change/', views.change_password, name='change_password'),
    path('google/', views.google_auth, name='google_auth'),
    path('google-oauth/', views.google_oauth_exchange, name='google_oauth_exchange'),
    path('profile/', views.profile, name='profile'),
    path('profile/update/', views.update_profile, name='update_profile'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # User management endpoints (staff only)
    path('users/', views.users_list, name='users_list'),
    path('users/create/', views.create_user, name='create_user'),
    path('users/<int:user_id>/', views.user_detail, name='user_detail'),
    path('users/<int:user_id>/update/', views.update_user, name='update_user'),
    path('users/<int:user_id>/delete/', views.delete_user, name='delete_user'),

    path('api/users/assign-group/', AssignUserToGroupView.as_view(), name='assign-user-group'),
    path('api/users/<int:user_id>/permissions/', UserPermissionsView.as_view()),
]
