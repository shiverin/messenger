
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("register/", views.register_view, name="register"),
    path('check-phone/', views.check_phone, name='check_phone'),
    path("api/login/", views.login_api, name="login_api"),
    path("setup/", views.setup, name="setup"),
    path('api/setup/', views.setup_api, name='api_setup'),
    path('api/search-users', views.search_users, name='search_users'),
    path('api/get_or_create_chat/', views.get_or_create_chat, name='get_or_create_chat'),
    path('api/messages/<int:message_id>/mark-read/', views.mark_message_read, name='mark_message_read'),
]

