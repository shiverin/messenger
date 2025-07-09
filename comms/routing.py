# comms/routing.py
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<chat_id>\d+)/$', consumers.ChatConsumer.as_asgi()),
]

# CHANGE THIS LINE:
# print("comms.routing.websocket_urlpatterns:", comms.routing.websocket_urlpatterns)
# TO THIS:
print("comms.routing.websocket_urlpatterns:", websocket_urlpatterns) # <-- Access directly
