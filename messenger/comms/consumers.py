import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Chat, Message
from django.contrib.auth import get_user_model

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.chat_id = self.scope['url_route']['kwargs']['chat_id']
        self.room_group_name = f'chat_{self.chat_id}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        user = self.scope['user']

        if not user.is_authenticated:
            await self.close()
            return

        msg_type = data.get('type')

        if msg_type == 'message':
            message_text = data.get('message')
            if message_text:
                msg_obj = await self.save_message(user, self.chat_id, message_text)
                # Broadcast new message to group
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': msg_obj.text,
                        'sender': user.username,
                        'timestamp': msg_obj.timestamp.isoformat(),
                        'message_id': msg_obj.id,
                        'delivered': msg_obj.delivered,
                        'read': msg_obj.read,
                    }
                )
        elif msg_type == 'delivered':
            message_id = data.get('message_id')
            if message_id:
                await self.mark_delivered(message_id)
        elif msg_type == 'read':
            message_id = data.get('message_id')
            if message_id:
                await self.mark_read(message_id)

    async def chat_message(self, event):
        # Send message or status update to WebSocket clients
        await self.send(text_data=json.dumps({
            'type': 'message',
            'message': event['message'],
            'sender': event['sender'],
            'timestamp': event['timestamp'],
            'message_id': event['message_id'],
            'delivered': event['delivered'],
            'read': event['read'],
        }))

    @database_sync_to_async
    def save_message(self, user, chat_id, message):
        chat = Chat.objects.get(pk=chat_id)
        return Message.objects.create(chat=chat, sender=user, text=message)

    @database_sync_to_async
    def mark_delivered(self, message_id):
        try:
            msg = Message.objects.get(id=message_id)
            if not msg.delivered:
                msg.delivered = True
                msg.save()
        except Message.DoesNotExist:
            pass

    @database_sync_to_async
    def mark_read(self, message_id):
        try:
            msg = Message.objects.get(id=message_id)
            if not msg.read:
                msg.read = True
                msg.save()
        except Message.DoesNotExist:
            pass
