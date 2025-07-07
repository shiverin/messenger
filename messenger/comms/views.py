from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse
from .models import User,Chat,Message
from django.contrib.auth.decorators import login_required
from django.db.models import Count, Exists, OuterRef,Max
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
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
from django.views.decorators.csrf import csrf_exempt

def index(request):
    if not request.user.is_authenticated:
        return redirect('login')

    if not request.user.name:
        return redirect('setup')

    user = request.user

    chats = Chat.objects.filter(participants=user).annotate(
        last_message_time=Max('messages__timestamp')
    ).order_by('-last_message_time')

    chat_list = []

    for chat in chats:
        last_msg = chat.messages.order_by('-timestamp').first()
        if not last_msg:
            continue  # Skip chats with no messages
        others = chat.participants.exclude(id=user.id)

        if others.exists():
            other = others.first()
            raw_phone = other.phone
            if raw_phone.startswith('+') and len(raw_phone) > 3:
                formatted_phone = raw_phone[:3] + ' ' + raw_phone[3:]
            else:
                formatted_phone = raw_phone
            name = other.name or formatted_phone
            avatar = other.profile_picture.url if other.profile_picture else '/static/comms/images/default-profile.png'
            phone = other.phone  # <-- use other.phone here
        else:
            # self-chat case
            name = "You"
            avatar=user.profile_picture.url if user.profile_picture else '/static/comms/images/default-profile.png'
            phone = user.phone  # <-- use user.phone here!

        msg_preview = last_msg.text if last_msg else "(no messages yet)"
        msg_time = localtime(last_msg.timestamp).strftime('%H:%M') if last_msg else ""

        chat_list.append({
            'name': name,
            'avatar': avatar,
            'message': msg_preview,
            'time': msg_time,
            'phone': phone
        })

    context = {
        "profile_pic": user.profile_picture.url if user.profile_picture else None,
        "name": user.name,
        "about": user.about,
        "chats": chat_list,
    }

    return render(request, 'comms/index.html', context)


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
    if not query:
        return JsonResponse({'results': []})

    # Include yourself in results
    users = User.objects.filter(phone__icontains=query)[:10]

    results = [{
        'id': user.id,
        'username': user.username,
        'phone': user.phone,
        'name': user.name or user.username,
        'profile_picture': user.profile_picture.url if user.profile_picture else None,
    } for user in users]

    return JsonResponse({'results': results})


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
        local_number = other_phone  # fallback

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
            'profile_pic': other_user.profile_picture.url if other_user.profile_picture else '/static/comms/images/default-profile.png'
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
