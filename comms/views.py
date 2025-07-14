from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse
from .models import User, Chat, Message, ArchivedChat
from django.contrib.auth.decorators import login_required
from django.db.models import Count, Exists, OuterRef, Q, Max
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods, require_GET
import json
import os
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .serializers import ChatSerializer, MessageSerializer
import phonenumbers
from django.utils.timezone import localtime
from django.utils.dateformat import format as django_date_format

def get_avatar_url(user):
    if user.profile_picture:
        media_path = os.path.join(settings.MEDIA_ROOT, user.profile_picture.name)
        if os.path.exists(media_path):
            return user.profile_picture.url

    return 'https://media.tenor.com/t3dLLNaI50oAAAAM/cat-cats.gif'

def build_chat_data(chat, user, unread_count=None, has_unread=None):
    last_msg = chat.messages.order_by('-timestamp').first()
    if not last_msg:
        return None

    others = chat.participants.exclude(id=user.id)
    if others.exists():
        other = others.first()
        raw_phone = other.phone
        formatted_phone = raw_phone[:3] + ' ' + raw_phone[3:] if raw_phone.startswith('+') and len(raw_phone) > 3 else raw_phone
        name = other.name or formatted_phone
        avatar = get_avatar_url(other)
        phone = other.phone
    else:
        # Self chat
        name = "You"
        avatar = get_avatar_url(user)
        phone = user.phone

    return {
        'id': chat.id,
        'name': name,
        'avatar': avatar,
        'message': last_msg.text,
        'time': localtime(last_msg.timestamp).strftime('%H:%M'),
        'phone': phone,
        'has_unread': has_unread if has_unread is not None else False,
        'unread_count': unread_count if unread_count is not None else 0,
    }


def index(request):
    if not request.user.is_authenticated:
        return redirect('login')

    if not request.user.name:
        return redirect('setup')

    user = request.user

    # Annotate all chats with last_message_time and total unread messages (including own)
    chats = Chat.objects.filter(participants=user).annotate(
        last_message_time=Max('messages__timestamp'),
        unread_total=Count('messages', filter=Q(messages__read=False)),  # all unread
    ).order_by('-last_message_time')

    # Archived and Favourite chat IDs
    archived_chat_ids = set(
        ArchivedChat.objects.filter(user=user).values_list('chat_id', flat=True)
    )
    favourite_chat_ids = set(user.favourite_chats.values_list('id', flat=True))

    active_chats = []
    archived_chats = []

    for chat in chats:
        # Check if self chat (only one participant)
        is_self_chat = (chat.participants.count() == 1 and chat.participants.filter(id=user.id).exists())

        if is_self_chat:
            # For self chat, unread_count = all unread messages (unread_total)
            unread_count = chat.unread_total
        else:
            # For normal chats, exclude unread messages sent by user
            unread_count = chat.messages.filter(read=False).exclude(sender=user).count()

        has_unread = unread_count > 0

        chat_data = build_chat_data(chat, user, unread_count=unread_count, has_unread=has_unread)
        if not chat_data:
            continue

        if chat.id in archived_chat_ids:
            archived_chats.append(chat_data)
        else:
            active_chats.append(chat_data)

    unread_chat_list = [c for c in active_chats if c['unread_count'] > 0]
    favourite_chat_list = [c for c in active_chats if c['id'] in favourite_chat_ids]

    context = {
        "profile_pic": get_avatar_url(user),
        "name": user.name,
        "about": user.about,
        "chats": active_chats,
        "unreadchats": unread_chat_list,
        "archived_chats": archived_chats,
        "favouritechats": favourite_chat_list,
    }

    return render(request, "comms/index.html", context)

@login_required
def chat_list_api(request):
    user = request.user

    # Annotate chats with last_message_time and unread_total
    chats = Chat.objects.filter(participants=user).annotate(
        last_message_time=Max('messages__timestamp'),
        unread_total=Count('messages', filter=Q(messages__read=False)),
    ).order_by('-last_message_time')

    archived_chat_ids = set(
        ArchivedChat.objects.filter(user=user).values_list('chat_id', flat=True)
    )
    favourite_chat_ids = set(user.favourite_chats.values_list('id', flat=True))

    active_chats = []
    archived_chats = []

    for chat in chats:
        is_self_chat = (chat.participants.count() == 1 and chat.participants.filter(id=user.id).exists())

        if is_self_chat:
            unread_count = chat.unread_total
        else:
            unread_count = chat.messages.filter(read=False).exclude(sender=user).count()

        has_unread = unread_count > 0

        chat_data = build_chat_data(chat, user, unread_count=unread_count, has_unread=has_unread)
        if not chat_data:
            continue

        if chat.id in archived_chat_ids:
            archived_chats.append(chat_data)
        else:
            active_chats.append(chat_data)

    unread_chat_list = [c for c in active_chats if c['unread_count'] > 0]
    favourite_chat_list = [c for c in active_chats if c['id'] in favourite_chat_ids]

    data = {
        "profile_pic": get_avatar_url(user),
        "name": user.name,
        "about": user.about,
        "chats": active_chats,
        "unreadchats": unread_chat_list,
        "archived_chats": archived_chats,
        "favouritechats": favourite_chat_list,
    }

    return JsonResponse(data)

@login_required
def api_active_chats(request):
    user = request.user

    chats = Chat.objects.filter(participants=user).annotate(
        last_message_time=Max('messages__timestamp'),
        unread_total=Count('messages', filter=Q(messages__read=False)),
    ).order_by('-last_message_time')

    archived_chat_ids = set(
        ArchivedChat.objects.filter(user=user).values_list('chat_id', flat=True)
    )

    active_chats = []

    for chat in chats:
        if chat.id in archived_chat_ids:
            continue  # skip archived in active chats

        is_self_chat = (chat.participants.count() == 1 and chat.participants.filter(id=user.id).exists())
        if is_self_chat:
            unread_count = chat.unread_total
        else:
            unread_count = chat.messages.filter(read=False).exclude(sender=user).count()

        has_unread = unread_count > 0

        chat_data = build_chat_data(chat, user, unread_count=unread_count, has_unread=has_unread)
        if chat_data:
            active_chats.append(chat_data)

    return JsonResponse(active_chats, safe=False)

@login_required
def api_favourite_chats(request):
    user = request.user
    favourite_chat_ids = set(user.favourite_chats.values_list('id', flat=True))

    chats = Chat.objects.filter(id__in=favourite_chat_ids).annotate(
        last_message_time=Max('messages__timestamp'),
        unread_total=Count('messages', filter=Q(messages__read=False)),
    ).order_by('-last_message_time')

    favourite_chats = []

    for chat in chats:
        is_self_chat = (chat.participants.count() == 1 and chat.participants.filter(id=user.id).exists())
        if is_self_chat:
            unread_count = chat.unread_total
        else:
            unread_count = chat.messages.filter(read=False).exclude(sender=user).count()

        has_unread = unread_count > 0

        chat_data = build_chat_data(chat, user, unread_count=unread_count, has_unread=has_unread)
        if chat_data:
            favourite_chats.append(chat_data)

    return JsonResponse(favourite_chats, safe=False)

@login_required
def api_archived_chats(request):
    user = request.user
    archived_chat_ids = set(
        ArchivedChat.objects.filter(user=user).values_list('chat_id', flat=True)
    )

    chats = Chat.objects.filter(id__in=archived_chat_ids).annotate(
        last_message_time=Max('messages__timestamp'),
        unread_total=Count('messages', filter=Q(messages__read=False)),
    ).order_by('-last_message_time')

    archived_chats = []

    for chat in chats:
        is_self_chat = (chat.participants.count() == 1 and chat.participants.filter(id=user.id).exists())
        if is_self_chat:
            unread_count = chat.unread_total
        else:
            unread_count = chat.messages.filter(read=False).exclude(sender=user).count()

        has_unread = unread_count > 0

        chat_data = build_chat_data(chat, user, unread_count=unread_count, has_unread=has_unread)
        if chat_data:
            archived_chats.append(chat_data)

    return JsonResponse(archived_chats, safe=False)


def login_view(request):
    return render(request, "comms/login.html")


def login_api(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            phone = data.get('fullPhone')
            password = data.get('password')
            username = f"user_{phone}"
            user = authenticate(request, username=username, password=password)
            if user is not None:
                login(request, user)
                return JsonResponse({'message': 'Login successful'})
            else:
                return JsonResponse({'error': 'Invalid phone or password'}, status=401)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Invalid method'}, status=405)


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            phone = data.get('phone')
            password = data.get('password')

            if not phone or not password:
                return JsonResponse({'error': 'Missing phone or password'}, status=400)

            if User.objects.filter(phone=phone).exists():
                return JsonResponse({'error': 'User with this phone already exists'}, status=400)

            username = f"user_{phone}"

            user = User.objects.create_user(username=username, password=password, phone=phone)
            user.save()

            return JsonResponse({'message': 'User registered successfully'}, status=201)

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid HTTP method'}, status=405)


def check_phone(request):
    if request.method == "POST":
        data = json.loads(request.body)
        phone = data.get('phone')
        exists = User.objects.filter(phone=phone).exists()
        return JsonResponse({'exists': exists})
    return JsonResponse({'error': 'Invalid request'}, status=400)


@login_required
def setup(request):
    if request.method == 'POST':
        user = request.user
        name = request.POST.get('name')
        profile_picture = request.FILES.get('profile_picture')
        if name:
            user.name = name
        if profile_picture:
            user.profile_picture = profile_picture
        user.save()
        print("done")
        return redirect('index')
    return render(request, 'comms/setup.html')


@login_required
def setup_api(request):
    user = request.user

    if request.content_type == 'application/json':
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

        name = data.get('name')
        about = data.get('about')

        updated = False
        if name is not None:
            user.name = name
            updated = True
        if about is not None:
            user.about = about
            updated = True

        if updated:
            user.save()
            return JsonResponse({'status': 'success'})
        else:
            return JsonResponse({'error': 'No valid fields to update'}, status=400)

    elif request.method == 'POST':
        profile_picture = request.FILES.get('profile_picture')
        if profile_picture:
            if user.profile_picture and user.profile_picture.name != 'profile_pics/default-profile.png':
                old_path = os.path.join(settings.MEDIA_ROOT, user.profile_picture.name)
                if os.path.exists(old_path):
                    os.remove(old_path)
            user.profile_picture = profile_picture
            user.save()
            return JsonResponse({'status': 'success'})

        return JsonResponse({'error': 'No profile picture uploaded'}, status=400)

    else:
        return JsonResponse({'error': 'Unsupported method'}, status=405)

@login_required
def search_users(request):
    query = request.GET.get('q', '').strip()
    user = request.user

    if not query:
        return JsonResponse({'chats': [], 'people': [], 'messages': []})

    # 1. Active chats the user is in, annotated with message count
    active_chats = Chat.objects.filter(participants=user).annotate(
        message_count=Count('messages')
    )

    # 2. Filter out chats with no messages
    chats_with_messages = active_chats.filter(message_count__gt=0)

    # 3. Users in those chats (excluding self)
    users_in_active_chats = User.objects.filter(
        chats__in=chats_with_messages
    ).exclude(id=user.id).distinct()

    # 4. Users matching query by phone or name (excluding self)
    matched_users = User.objects.filter(
        Q(phone__icontains=query) | Q(name__icontains=query)
    ).exclude(id=user.id).distinct()

    # 5. Split matched users into chat users and people
    chats_users = users_in_active_chats.filter(id__in=matched_users.values_list('id', flat=True))
    people_users = matched_users.exclude(id__in=chats_users.values_list('id', flat=True))

    # 6. Matched messages in all user chats (including empty ones)
    matched_messages = Message.objects.filter(
        chat__in=active_chats,
        text__icontains=query
    ).select_related('chat').prefetch_related('chat__participants').order_by('-timestamp')[:50]

    def format_phone(phone):
        return phone[:3] + ' ' + phone[3:] if phone.startswith('+') and len(phone) > 3 else phone

    def format_user(u):
        raw_phone = u.phone
        return {
            'id': u.id,
            'username': u.username,
            'phone': format_phone(raw_phone),
            'name': u.name or format_phone(raw_phone),
            'profile_picture': get_avatar_url(u),
            'fullphone': raw_phone,
            'about': u.about,
        }

    def format_chat_user(u):
        chat = Chat.objects.filter(participants=user, is_group=False).filter(participants=u).order_by('-created_at').first()
        if chat:
            last_msg = chat.messages.order_by('-timestamp').first()
            last_message_text = last_msg.text if last_msg else ''
            last_message_time = localtime(last_msg.timestamp).strftime('%H:%M') if last_msg else ''
            unread_count = chat.messages.filter(read=False).exclude(sender=user).count()
        else:
            last_message_text = ''
            last_message_time = ''
            unread_count = 0

        return {
            'id': u.id,
            'username': u.username,
            'phone': format_phone(u.phone),
            'name': u.name or format_phone(u.phone),
            'profile_picture': get_avatar_url(u),
            'fullphone': u.phone,
            'last_message_preview': last_message_text,
            'last_message_time': last_message_time,
            'unread_count': unread_count,
        }

    def format_message(m):
        snippet = m.text[:97] + '...' if len(m.text) > 100 else m.text
        other_user = m.chat.participants.exclude(id=user.id).first()
        other_user_data = {
            'id': other_user.id if other_user else None,
            'username': other_user.username if other_user else None,
            'phone': format_phone(other_user.phone) if other_user else None,
            'name': other_user.name if other_user else None,
            'profile_picture': get_avatar_url(other_user) if other_user else None,
            'fullphone': other_user.phone if other_user else None,
            'about': other_user.about if other_user else '',
        }

        chat_name = f"Group Chat {m.chat.id}" if m.chat.is_group else other_user_data['name']
        return {
            'messageId': m.id,
            'chatId': m.chat.id,
            'chatName': chat_name,
            'snippet': snippet,
            'otherUser': other_user_data,
            'time': localtime(m.timestamp).strftime('%H:%M'),
        }

    return JsonResponse({
        'chats': [format_chat_user(u) for u in chats_users],
        'people': [format_user(u) for u in people_users],
        'messages': [format_message(m) for m in matched_messages],
        'selfUser': format_user(user),  # 👈 Include the current user info
    })




@api_view(['POST'])
def get_or_create_chat(request):
    other_phone = request.data.get('phone')
    if not other_phone:
        return Response({'error': 'Phone number required'}, status=400)
    try:
        other_user = User.objects.get(phone=other_phone)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)

    current_user = request.user

    if current_user == other_user:
        chats = Chat.objects.annotate(num_participants=Count('participants')) \
                            .filter(participants=current_user, num_participants=1)
    else:
        chats = Chat.objects.filter(participants=current_user).filter(participants=other_user)

    if chats.exists():
        chat = chats.first()
        created = False
    else:
        chat = Chat.objects.create()
        chat.participants.set([current_user, other_user])
        created = True

    messages = Message.objects.filter(chat=chat)
    serialized_messages = MessageSerializer(messages, many=True).data

    try:
        parsed = phonenumbers.parse(other_phone, None)
        country_code = f"+{parsed.country_code}"
        local_number = str(parsed.national_number)
    except phonenumbers.NumberParseException:
        country_code = ''
        local_number = other_phone

    # Determine display name
    if not other_user.name:
        username = f"{country_code} {local_number}"
    else:
        username = other_user.name

    return Response({
        'chat_id': chat.id,
        'other_user': {
            'username': username,
            'phone': other_user.phone,
            'profile_pic': get_avatar_url(other_user),
            'about': other_user.about,
            'parsed_phone': f"{country_code} {local_number}", 
        },
        'messages': serialized_messages,
        'created': created
    })


@login_required
def mark_message_read(request, message_id):
    if request.method == "POST":
        try:
            msg = Message.objects.get(pk=message_id, chat__participants=request.user)
            msg.read = True
            msg.save()
            return JsonResponse({'status': 'ok'})
        except Message.DoesNotExist:
            return JsonResponse({'error': 'Message not found'}, status=404)
    return JsonResponse({'error': 'Invalid method'}, status=405)


@login_required
@require_GET
def chat_status_api(request):
    phone = request.GET.get('phone')
    user = request.user

    if not phone:
        return JsonResponse({'error': 'Missing phone parameter'}, status=400)

    try:
        if phone == user.phone:
            # Self chat: find chat with exactly one participant = user
            chat = Chat.objects.annotate(num_participants=Count('participants')) \
                               .filter(num_participants=1, participants=user) \
                               .first()
            # For self-chat, do NOT exclude sender when counting unread
            unread_messages_count = chat.messages.filter(read=False).count() if chat else 0
        else:
            # Normal chat between user and the phone
            chat = Chat.objects.filter(participants__phone=user.phone) \
                               .filter(participants__phone=phone) \
                               .distinct() \
                               .first()
            # For normal chat, exclude messages sent by user
            unread_messages_count = chat.messages.filter(read=False).exclude(sender=user).count() if chat else 0

        if not chat:
            return JsonResponse({'error': 'Chat not found'}, status=404)

        is_archived = ArchivedChat.objects.filter(user=user, chat=chat).exists()
        has_unread = unread_messages_count > 0
        is_favourite = user.favourite_chats.filter(pk=chat.pk).exists()

        return JsonResponse({
            'is_archived': is_archived,
            'has_unread': has_unread,
            'unread_count': unread_messages_count,
            'is_favourite': is_favourite,
        })

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@login_required
def chat_toggle_api(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid method'}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    phone = data.get('phone')
    action = data.get('action')
    user = request.user

    if not phone or not action:
        return JsonResponse({'error': 'Missing parameters'}, status=400)

    # Special case: if user phone == target phone, find chats with exactly 1 participant = user (self-chat)
    if phone == user.phone:
        chat = Chat.objects.annotate(num_participants=Count('participants')) \
                           .filter(num_participants=1, participants=user) \
                           .first()
    else:
        # Normal case: chat with both user and target phone as participants
        chat = Chat.objects.filter(participants__phone=user.phone) \
                           .filter(participants__phone=phone).distinct().first()

    if not chat:
        return JsonResponse({'error': 'Chat not found'}, status=404)

    try:
        if action == 'archive':
            archived = user.archived_chats.filter(chat=chat).exists()
            if archived:
                user.archived_chats.filter(chat=chat).delete()
            else:
                user.archived_chats.create(chat=chat)

        elif action == 'mark-read':
            # For self-chat, don't exclude sender (because sender == user)
            if phone == user.phone:
                unread_msgs = chat.messages.filter(read=False)
            else:
                unread_msgs = chat.messages.filter(read=False).exclude(sender=user)

            has_unread = unread_msgs.exists()

            if has_unread:
                unread_msgs.update(read=True)
            else:
                chat.messages.filter(read=True).update(read=False)

        elif action == 'favourite':
            if chat in user.favourite_chats.all():
                user.favourite_chats.remove(chat)
            else:
                user.favourite_chats.add(chat)

        else:
            return JsonResponse({'error': 'Invalid action'}, status=400)

        # Also adjust unread count for response accordingly
        if phone == user.phone:
            unread_messages_count = chat.messages.filter(read=False).count()
        else:
            unread_messages_count = chat.messages.filter(read=False).exclude(sender=user).count()

        is_archived = user.archived_chats.filter(chat=chat).exists()
        has_unread = unread_messages_count > 0
        is_favourite = chat in user.favourite_chats.all()

        return JsonResponse({
            'is_archived': is_archived,
            'has_unread': has_unread,
            'unread_count': unread_messages_count,
            'is_favourite': is_favourite,
        })

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

