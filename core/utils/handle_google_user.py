def handle_google_user(user_data):
    """
    Handle Google OAuth user creation/login
    """
    from django.contrib.auth import get_user_model

    User = get_user_model()

    try:
        user = User.objects.get(email=user_data['email'])
        # Update user info if needed
        # user.first_name = user_data.get('given_name', '')
        # user.last_name = user_data.get('family_name', '')
        # user.profile_picture = user_data.get('picture', '')
        # user.is_email_verified = user_data.get('email_verified', False)
        user.save()
    except User.DoesNotExist:
        # Create new user
        user = User.objects.create_user(
            email=user_data['email'],
            username=user_data['email'],
            first_name=user_data.get('given_name', ''),
            last_name=user_data.get('family_name', ''),
            google_id=user_data.get('sub'),
            profile_picture=user_data.get('picture', ''),
            is_email_verified=user_data.get('email_verified', False)
        )

    return user