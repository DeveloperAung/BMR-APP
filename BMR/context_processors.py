from django.conf import settings

def google_settings(request):
    # print("GOOGLE_CLIENT_ID in context processor:", settings.GOOGLE_CLIENT_ID)
    return { "GOOGLE_CLIENT_ID": settings.GOOGLE_CLIENT_ID }