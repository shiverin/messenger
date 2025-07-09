import os

# 👇 MUST come before any Django imports
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'messenger.settings')

import django
django.setup()  # 👈 This line is crucial for ASGI apps when importing models etc.

from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from channels.auth import AuthMiddlewareStack
import comms.routing

print("comms.routing.websocket_urlpatterns:", comms.routing.websocket_urlpatterns) # <-- ADD THIS

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            comms.routing.websocket_urlpatterns
        )
    ),
})
