from rest_framework import serializers
from .models import Chat, User,Message

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'phone', 'first_name', 'last_name']

class ChatSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True)

    class Meta:
        model = Chat
        fields = ['id', 'participants', 'created_at']

class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username')

    class Meta:
        model = Message
        fields = ['id', 'text', 'timestamp', 'sender_username', 'delivered', 'read']
