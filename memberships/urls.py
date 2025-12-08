from django.urls import path, include
from .views import *


internal_urls = [
    path('approval/<str:reference_no>/', membership_approval, name='membership_approval'),
    path('list/', membership_list, name='membership_list'),
]

public_urls = [

    path('registration/step-1/', member_reg_step_1, name='member_reg_step_1'),
    path('registration/step-2/', member_reg_step_2, name='member_reg_step_2'),
    path('registration/step-3/', member_reg_step_3, name='member_reg_step_3'),
    path('details/', membership_details, name='membership_details'),
    path('profile/', profile, name='membership_profile'),

    path('event/', member_event, name='member_event'),
    path('donations/', member_donation, name='member_donation'),
]

urlpatterns = [
    path('', include(public_urls)),
    path('i/', include(internal_urls)),
]
