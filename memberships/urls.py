from django.urls import path, include

from .views import *

public_urls = [
    path('list/', membership_list, name='membership_list'),
    # path('registration/', detect_steps, name='membership_registration'),

    path('registration/step-1/', member_reg_step_1, name='member_reg_step_1'),
    path('registration/step-2/', member_reg_step_2, name='member_reg_step_2'),
    path('registration/step-3/', member_reg_step_3, name='member_reg_step_3'),

    path('event/', member_event, name='member_event'),
    path('donations/', member_donation, name='member_donation'),
]

urlpatterns = [
    path('', include(public_urls)),
]