from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    phone = models.CharField(max_length=15, unique=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    about = models.CharField(max_length=255, blank=True, default="Hey there! I am using Messenger.")
    name = models.CharField(max_length=100, blank=True, null=True)
    favourite_chats = models.ManyToManyField('Chat', related_name='favourited_by', blank=True)

    def __str__(self):
        return f"{self.username} ({self.phone})"


class Chat(models.Model):
    participants = models.ManyToManyField(User, related_name='chats')
    is_group = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        if self.is_group:
            return f"Group Chat {self.id}"
        else:
            return f"Chat {self.id} between: " + ", ".join([user.username for user in self.participants.all()])


class Message(models.Model):
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    delivered = models.BooleanField(default=False)
    read = models.BooleanField(default=False)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.sender.username}: {self.text[:30]} ({self.timestamp.strftime('%Y-%m-%d %H:%M')})"

class ArchivedChat(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='archived_chats')
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name='archived_by')
    archived_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'chat')

    def __str__(self):
        return f"{self.user.username} archived Chat {self.chat.id}"
