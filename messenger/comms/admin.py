from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Chat, Message

# Custom UserAdmin to show extra fields in admin for your User model
class UserAdmin(BaseUserAdmin):
    model = User
    list_display = ('username', 'phone', 'name', 'email', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_active')
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('phone', 'name', 'email', 'profile_picture', 'about')}),
        ('Permissions', {'fields': ('is_staff', 'is_active', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'phone', 'password1', 'password2', 'is_staff', 'is_active')}
        ),
    )
    search_fields = ('username', 'phone')
    ordering = ('username',)

admin.site.register(User, UserAdmin)

# Register Chat and Message models normally
@admin.register(Chat)
class ChatAdmin(admin.ModelAdmin):
    list_display = ('id', 'is_group', 'created_at')
    filter_horizontal = ('participants',)  # better multi-select widget
    ordering = ('-created_at',)

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'chat', 'timestamp', 'text_excerpt')
    search_fields = ('sender__username', 'text')
    ordering = ('timestamp',)

    def text_excerpt(self, obj):
        return obj.text[:50]
    text_excerpt.short_description = 'Message Text'
