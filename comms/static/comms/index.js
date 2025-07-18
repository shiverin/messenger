let mobile;

window.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.iconstuff');

    // 1. Add click listeners to toggle active state
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove 'active' from all buttons
            buttons.forEach(b => b.classList.remove('active'));
            // Add 'active' to the clicked one
            button.classList.add('active');
        });
    });

    // 2. Trigger initial click on chats button
    const defaultButton = document.querySelector('button[data-state="chats"]');
    if (defaultButton) {
        document.querySelectorAll('button[data-state]').forEach(btn => {
            btn.classList.remove('active');
        });
        defaultButton.classList.add('active');

    }
    mobile = isMobile();
    document.getElementById('btnAll').click();


});


function isMobile() {
    return window.innerWidth <= 768; // or 600 or 480 depending on your layout
}

const bottomDiv = document.querySelector('.right-bottom-upper');
const readMessageIds = new Set();

function createObserverForPhone(phone) {
    return new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const messageId = entry.target.dataset.messageId;
                if (messageId && !readMessageIds.has(messageId)) {
                    console.log('Marking message as read:', messageId);
                    readMessageIds.add(messageId);
                    markMessageRead(messageId, phone); // ✅ Now has phone
                }
            }
        });
    }, {
        root: bottomDiv,
        threshold: 0.5
    });
}


document.querySelector('.theform').addEventListener('submit', e => {
    e.preventDefault();
});


let chatViewActivated = false; // one-time switch tracker

let chatSocket = null; // global or top of your JS file

const stateButtons = document.querySelectorAll('.iconstuff');
const body2Views = document.querySelectorAll('.body2 .app-view');
const body3Views = document.querySelectorAll('.body3 .app-view');
const startScreen = document.getElementById('start-screen');

stateButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const state = btn.dataset.state; // "chats", "settings", "profile"

        // === BODY 2: show view-STATE ===
        body2Views.forEach(view => {
            if (view.id === `view-${state}`) {
                // If switching to chats view, use flex instead of block
                view.style.display = 'flex';
            } else {
                view.style.display = 'none';
            }
        });
        // === BODY 3: show content-STATE or start screen ===
        const body3State = state === 'chats' ? 'main' : state;

        body3Views.forEach(view => {
            const isMain = view.id === 'content-main';
            const shouldShow = view.id === `content-${body3State}`;

            if (isMain && !chatViewActivated) {
                // No chat opened yet → show start screen instead
                view.style.display = 'none';
                startScreen.style.display = 'block';
            } else {
                view.style.display = shouldShow ? 'flex' : 'none';
            }
        });

        // Hide start screen if we're not in 'chats' or if a chat is opened
        if (state !== 'chats' || chatViewActivated) {
            startScreen.style.display = 'none';
        }

        // === TEMPSTATE CLASS TOGGLE ===
        const body3Div = document.querySelector('.body3');
        if (state === 'settings' || state === 'profile') {
            body3Div.classList.add('tempstate');
        } else {
            body3Div.classList.remove('tempstate');
        }

        // === FOCUS SEARCH ===
        if (state === 'settings') {
            setTimeout(() => {
                const searchInput = document.getElementById("set-search");
                if (searchInput) searchInput.focus();
            }, 50);
        }
    });
});

const fileInput = document.getElementById('profile-pic2');
const preview = document.getElementById('profile-preview');
const preview2 = document.getElementById('profile-preview2');
const preview3 = document.getElementById('left-profile-preview');

preview.addEventListener('click', () => {
    fileInput.click();
});

preview2.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        [preview, preview2, preview3].forEach(previewEl => {
            if (previewEl) previewEl.src = e.target.result;
        });
    };
    reader.readAsDataURL(file);

    // Prepare FormData
    const formData = new FormData();
    formData.append('profile_picture', file);

    try {
        const res = await fetch("/api/setup/", {
            method: 'POST', // Or 'POST' depending on your Django view
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: formData
        });

        if (!res.ok) {
            alert('Failed to update profile picture');
            // Optionally revert preview to old image if you saved it somewhere
        }
    } catch (err) {
        alert('Network error while uploading profile picture');
    }
});


function toggleEdit(field) {
    const display = document.getElementById(`${field}-display`);
    const input = document.getElementById(`${field}-input`);
    const icon = document.getElementById(`${field}-icon`);

    if (display && input && icon) {
        const isEditing = input.style.display === 'block';

        if (isEditing) {
            // Switching back to view mode: update display and send fetch request
            display.textContent = input.value;
            input.style.display = 'none';
            display.style.display = 'inline';
            icon.classList.remove('fa-check');
            icon.classList.add('fa-pen');

            // Prepare data to send (only this field)
            const data = {};
            data[field] = input.value;

            fetch("/api/setup/", {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    body: JSON.stringify(data)
                })
                .then(res => {
                    if (!res.ok) alert(`Failed to update ${field}`);
                })
                .catch(() => alert('Network error'));

        } else {
            // Switching to edit mode: show input and focus
            display.style.display = 'none';
            input.style.display = 'block';
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
            icon.classList.remove('fa-pen');
            icon.classList.add('fa-check');
        }
    }
}


function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let c of cookies) {
            c = c.trim();
            if (c.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(c.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

const extraOptionsBtn = document.getElementById('chat-extra-options-button');
const extraOptionsMenu = document.getElementById('chat-extra-options-menu');

extraOptionsBtn.addEventListener('click', (e) => {
    e.stopPropagation();

    const rect = extraOptionsBtn.getBoundingClientRect();
    extraOptionsMenu.style.top = `${rect.bottom + window.scrollY}px`;

    if (window.innerWidth <= 768) {
        extraOptionsMenu.style.right = '0px';
        extraOptionsMenu.style.left = 'auto';
    } else {
        extraOptionsMenu.style.left = `${rect.left + window.scrollX - 10}px`;
        extraOptionsMenu.style.right = 'auto';
    }

    extraOptionsMenu.classList.toggle('show');
    extraOptionsMenu.classList.toggle('hidden');
});

// Hide when clicking outside
document.addEventListener('click', () => {
    if (extraOptionsMenu.classList.contains('show')) {
        extraOptionsMenu.classList.remove('show');
        extraOptionsMenu.classList.add('hidden');
    }
});



function focusSearchBar() {
    const searchInput = document.getElementById("set-search");
    if (searchInput) {
        searchInput.focus();
    }
}

const chatItems = document.querySelectorAll('.chat-item');

chatItems.forEach(item => {
    item.addEventListener('click', () => {
        if (!item.classList.contains('active')) {
            chatItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        }
    });
});

const chatSearchInput = document.getElementById('chat-search');
const chatSearchResults = document.getElementById('chat-search-results');

chatSearchInput.addEventListener('input', async () => {
    const query = chatSearchInput.value.trim();
    if (query.length < 1) {
        chatSearchResults.style.display = 'none';
        chatSearchResults.innerHTML = '';
        document.querySelector('.mid-chat-lower').style.display = 'flex';
        return;
    }
    document.querySelector('.mid-chat-lower').style.display = 'none';

    try {
        const res = await fetch(`/api/search-users?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();

        chatSearchResults.innerHTML = ''; // clear previous

        const buildChatItem = ({
            phone,
            avatar,
            name,
            time,
            message,
            unread_count
        }) => {
            return `
    <div class="chat-item" data-phone="${phone}">
      <img src="${avatar || 'default-avatar.png'}" alt="${name || ''}" class="chat-avatar">
      <div class="chat-info">
        <div class="chat-header">
          <span class="chat-name">${name || phone}</span>
          <span class="chat-time">${time || ''}</span>
        </div>
        <div class="chat-preview">${message || ''}</div>
      </div>
      ${unread_count > 0 ? `<div class="unread-badge">${unread_count}</div>` : ''}
    </div>
  `;
        };

        const buildPeopleItem = ({
            profile_picture,
            name,
            phone,
            about
        }) => {
            return `
        <div class="chat-item" data-phone="${phone}">
          <img src="${profile_picture || 'default-avatar.png'}" alt="${name || ''}" class="chat-avatar">
          <div class="chat-info">
            <div class="chat-header">
              <span class="chat-name">${name || phone}</span>
            </div>
            <div class="chat-preview">${about || ''}</div>
          </div>
        </div>
      `;
        };

        const buildMessageItem = ({
            chatName,
            snippet,
            chatId,
            messageId,
            otherUser,
            time,
            selfUser = {
                phone: 'You',
                profile_picture: 'https://media.tenor.com/t3dLLNaI50oAAAAM/cat-cats.gif'
            }
        }) => {
            const isSelfChat = !otherUser.phone && !otherUser.name;

            const displayName = isSelfChat ?
                selfUser.name || selfUser.phone || 'You' :
                otherUser.name || otherUser.phone || 'Unknown';

            const avatar = isSelfChat ?
                selfUser.profile_picture || 'https://media.tenor.com/t3dLLNaI50oAAAAM/cat-cats.gif' :
                otherUser.profile_picture || 'https://media.tenor.com/t3dLLNaI50oAAAAM/cat-cats.gif';

            const phoneAttr = isSelfChat ?
                selfUser.fullphone || '' :
                otherUser.fullphone || '';

            return `
        <div class="chat-item message-item" data-chat-id="${chatId}" data-message-id="${messageId}" data-phone="${phoneAttr}">
          <img src="${avatar}" alt="${displayName}" class="chat-avatar">
          <div class="chat-info">
            <div class="chat-header">
              <span class="chat-name">${displayName}</span>
              <span class="chat-time">${time || ''}</span>
            </div>
            <div class="chat-preview">${snippet}</div>
          </div>
        </div>
    `;
        };


        const buildChatRoll = (label, itemsHtml) => {
            return `
        <div class="chat-roll-section">
          <div class="chat-roll-label">${label}</div>
          <div class="chat-roll">
            ${itemsHtml || `<div style="padding: 8px; color: #888;">No results</div>`}
          </div>
        </div>
      `;
        };

        const chatsHtml = data.chats.map(user =>
            buildChatItem({
                phone: user.fullphone || '',
                avatar: user.profile_picture || 'https://media.tenor.com/t3dLLNaI50oAAAAM/cat-cats.gif',
                name: user.name || user.phone,
                time: user.last_message_time || '',
                message: user.last_message_preview || '',
                unread_count: user.unread_count || 0
            })
        ).join('');

        const peopleHtml = data.people.map(user =>
            buildPeopleItem({
                profile_picture: user.profile_picture || 'https://media.tenor.com/t3dLLNaI50oAAAAM/cat-cats.gif',
                name: user.name || user.phone,
                phone: user.fullphone || '',
                about: user.about || ''
            })
        ).join('');

        const messagesHtml = data.messages.map(msg =>
            buildMessageItem({
                chatId: msg.chatId,
                messageId: msg.messageId,
                snippet: msg.snippet,
                chatName: msg.chatName,
                otherUser: msg.otherUser || {
                    profile_picture: 'https://media.tenor.com/t3dLLNaI50oAAAAM/cat-cats.gif',
                    name: 'Unknown',
                    phone: ''
                },
                time: msg.time
            })
        ).join('');

        chatSearchResults.innerHTML =
            buildChatRoll('Chats', chatsHtml) +
            buildChatRoll('People', peopleHtml) +
            buildChatRoll('Messages', messagesHtml);

        chatSearchResults.style.display = 'block';

    } catch (e) {
        chatSearchResults.innerHTML = `<div style="padding:8px; color:red;">Error loading results</div>`;
        chatSearchResults.style.display = 'block';
    }
});


chatSearchResults.addEventListener('click', e => {
    const item = e.target.closest('.chat-item');
    if (!item) {
        console.log('No chat-item found on click');
        return;
    }

    const phone = item.getAttribute('data-phone');
    console.log('Clicked item phone:', phone);
    if (!phone) {
        console.log('No phone data attribute on clicked item');
        return;
    }

    // Your existing code
    showMainContent();
    startChatWithUser(phone);
    if (isMobile()) {
        swapViewForMobile();
    }
});



function updateUnreadBadge(phone, unreadCount) {
    console.log(`[updateUnreadBadge] Called with phone: "${phone}", unreadCount: ${unreadCount}`);

    // Find the chat item element by data-phone attribute
    const chatItem = document.querySelector(`.chat-item[data-phone="${phone}"]`);

    if (!chatItem) {
        console.warn(`[updateUnreadBadge] No chat-item found for phone: "${phone}"`);
        return;
    } else {
        console.log(`[updateUnreadBadge] Found chat-item for phone: "${phone}"`);
    }

    let badge = chatItem.querySelector('.unread-badge');

    if (unreadCount > 0) {
        if (!badge) {
            console.log(`[updateUnreadBadge] No existing badge found, creating one`);
            badge = document.createElement('div');
            badge.className = 'unread-badge';
            chatItem.appendChild(badge);
        } else {
            console.log(`[updateUnreadBadge] Existing badge found, updating text`);
        }
        badge.textContent = unreadCount;
        badge.style.display = 'block';
        console.log(`[updateUnreadBadge] Badge updated/displayed with count: ${unreadCount}`);
    } else if (badge) {
        console.log(`[updateUnreadBadge] unreadCount is 0, hiding badge`);
        badge.style.display = 'none';
    } else {
        console.log(`[updateUnreadBadge] unreadCount is 0 and no badge exists, nothing to do`);
    }
}

async function refreshUnreadBadge(phone) {
    try {
        const res = await fetch(`/api/chat-status/?phone=${encodeURIComponent(phone)}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });
        if (!res.ok) throw new Error('Failed to fetch unread status');

        const data = await res.json();

        const unreadCount = data.unread_count ?? (data.has_unread ? 1 : 0);
        updateUnreadBadge(phone, unreadCount);

    } catch (error) {
        console.error('Error fetching unread status:', error);
    }
}


async function startChatWithUser(phone) {
    console.log('startChatWithUser called with phone:', phone);
    try {
        console.log('Sending fetch POST /api/get_or_create_chat/ ...');
        const res = await fetch('/api/get_or_create_chat/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
            },
            body: JSON.stringify({
                phone
            }),
        });

        console.log('Fetch response received:', res);
        const data = await res.json();
        console.log('Parsed JSON data:', data);

        if (!res.ok) {
            console.error('Fetch failed:', data.error || 'Unknown error');
            alert(data.error || 'Failed to start chat');
            return;
        }

        // Update right-top with user profile info
        console.log('Updating right-top with user info');
        const topDiv = document.querySelector('.right-top');
        const user = data.other_user;
        const profilePicId = `profile-picture-${user.phone}`;
        const profileNameId = `profile-username-${user.phone}`;
        topDiv.innerHTML = `
  <div class="chat-top-bar" style="display: flex; justify-content: space-between; align-items: center; height: 100%; padding:16px;">
    <div class="chat-top-bar-left" style="display: flex; align-items: center; gap: 15px;">
      ${mobile ? `
<button id="back-button">
  <i class="fas fa-arrow-left"></i>
</button>
      ` : ''}
      <img src="${user.profile_pic}" id="${profilePicId}" style="cursor: pointer; width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
      <div id="${profileNameId}" style="cursor: pointer; font-weight: 400; font-size:16px;">${user.username}</div>
    </div>
    <div style="display: flex; align-items: center; gap: 10px; padding: 0px;">
      <button class="right-top-icons-two" style="cursor: pointer; font-size: 1.1rem;">
        <i class="fas fa-video"></i>
        <i class="fas fa-chevron-down" style="font-size: 1.1rem;"></i>
      </button>
      <button class="right-top-icons" style="cursor: pointer; font-size: 1.1rem;">
        <i class="fas fa-search"></i>
      </button>
      <button class="right-top-icons" style="cursor: pointer; font-size: 1.1rem;">
        <i class="fas fa-ellipsis-v"></i>
      </button>
    </div>
  </div>
`;
const profilePanel = document.querySelector('.right-right');
profilePanel.innerHTML = `
  <div class="view-chat-profile">
    <div class="right-profile-header" style="display: flex; justify-content: space-between; align-items: center; padding: 12px;">
    <div style="display: flex; gap: 12px; align-items: center;">
      <button
        style="border: none; cursor: pointer; font-size: 1.2rem;" id="right-close-button">
        <i class="fas fa-times" ></i> <!-- Close icon -->
      </button>
      <div style="font-size:15px;">Contact Info</div>
      </div>
      <button style="border: none; background: none; cursor: pointer; font-size: 1.2rem;">
        <i class="fas fa-pen"></i> <!-- Edit icon -->
      </button>
    </div>

    <div class="right-profile-mid" style="text-align: center; padding: 16px; margin-top: 5px;">
      <img src="${user.profile_pic}"
           style="width: 130px; height: 130px; border-radius: 50%; object-fit: cover;">
      <div style="margin-top: 10px; font-size: 1.4rem; font-weight: 500;">
        ${user.username}
      </div>
      <div style=" font-size: 16px; color: gray; margin-top: 8px;">
        ${user.parsed_phone}
      </div>
    </div>

    <div style="font-size: 15px; padding: 16px; margin-left: 4px; margin-top: 8px;">
      <div style="color: grey;">
        About
      </div>
      <div style="margin-top: 5px;">${user.about || 'No status message'}</div>
    </div>
    <hr>
  </div>
`;
const toggleTarget = document.querySelector('.right-right');

const contentMain = document.getElementById('content-main');

document.getElementById(profilePicId)?.addEventListener('click', () => {
  if (mobile) {
    if (contentMain) contentMain.style.display = 'none';
    if (profilePanel) profilePanel.style.display = 'block';
    profilePanel.classList.add('slide-in');
  } else {
    profilePanel.classList.add('slide-in'); // desktop slide-in
  }
});

document.getElementById(profileNameId)?.addEventListener('click', () => {
  if (mobile) {
    if (contentMain) contentMain.style.display = 'none';
     profilePanel.classList.add('slide-in');
  } else {
    profilePanel.classList.add('slide-in');
  }
});

document.getElementById('right-close-button')?.addEventListener('click', () => {
  if (mobile) {
    if (contentMain) contentMain.style.display = 'block';
    profilePanel.classList.remove('slide-in');
  } else {
    profilePanel.classList.remove('slide-in');
  }
});

        if (mobile) {
            document.getElementById('back-button').addEventListener('click', () => {
                const body2 = document.querySelector('.body2');
                const body3 = document.querySelector('.body3');

                // Show body2 immediately
                if (body2) body2.style.display = 'block';

                if (body3) {
                    // Trigger slide-out animation
                    body3.classList.remove('slide-in');
                    body3.classList.add('slide-out');

                    // Wait for animation to finish, then hide body3 and reset classes
                    body3.addEventListener('animationend', function handler() {
                        body3.style.display = 'none';
                        body3.classList.remove('slide-out');
                        body3.removeEventListener('animationend', handler);
                    });
                }
            });
        }
        const bottomDiv = document.querySelector('.right-bottom-upper');
        bottomDiv.innerHTML = ''; // Clear previous chat

        data.messages.forEach((msg, index) => {
            const isSent = msg.sender_username === window.currentUser;
            const prevMsg = data.messages[index - 1];
            const isFirstInGroup = !prevMsg || prevMsg.sender_username !== msg.sender_username;
            const bubble = document.createElement('div');
            bubble.classList.add('chat-bubble', isSent ? 'sent' : 'received');
            if (isFirstInGroup) bubble.classList.add('first');

            // Add tick icons for sent messages
            let ticks = '';
            if (isSent) {
                if (msg.read) {
                    ticks = '<i class="fas fa-check-double" style="color: #53bdeb;"></i>'; // blue double tick
                } else if (msg.delivered) {
                    ticks = '<i class="fas fa-check-double" style="color: gray;"></i>'; // grey double tick
                } else {
                    ticks = '<i class="fas fa-check" style="color: gray;"></i>'; // single grey tick
                }
            }

            bubble.innerHTML = `
    <div class="chat-text">${msg.text}</div>
    <div class="chat-times">
      ${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      ${ticks}
    </div>
  `;
            bubble.dataset.messageId = msg.id;
            bottomDiv.appendChild(bubble);
            // Only observe messages NOT sent by the current user (received messages)
if (!isSent) {
    const observer = createObserverForPhone(phone); // ✅ Create one for this phone
    observer.observe(bubble);
}
        });

        bottomDiv.scrollTop = bottomDiv.scrollHeight;
        // Setup WebSocket connection for this chat
        console.log('Setting up WebSocket connection');
        if (window.chatSocket) {
            console.log('Closing old WebSocket connection');
            window.chatSocket.close(); // Close old socket if any
        }
        const chatId = data.chat_id;
        const wsProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
        const wsUrl = wsProtocol + window.location.host + '/ws/chat/' + chatId + '/';
        console.log('Connecting to WebSocket URL:', wsUrl);

        window.chatSocket = new WebSocket(wsUrl);

        window.chatSocket.onopen = () => {
            console.log('WebSocket connected for chat', chatId);
        };
        window.chatSocket.onmessage = (e) => {
            console.log('WebSocket message received:', e.data);
            const messageData = JSON.parse(e.data);

            const isSent = messageData.sender === window.currentUser;
            const lastMsg = bottomDiv.lastElementChild;
            const isFirstInGroup = !lastMsg || !lastMsg.classList.contains(isSent ? 'sent' : 'received');

            const bubble = document.createElement('div');
            bubble.classList.add('chat-bubble', isSent ? 'sent' : 'received');
            if (isFirstInGroup) bubble.classList.add('first');

            let ticks = '';
            if (isSent) {
                if (messageData.read) {
                    ticks = '<i class="fas fa-check-double" style="color: #53bdeb;"></i>'; // blue ticks
                } else if (messageData.delivered) {
                    ticks = '<i class="fas fa-check-double" style="color: gray;"></i>'; // double grey ticks
                } else {
                    ticks = '<i class="fas fa-check" style="color: gray;"></i>'; // single grey tick
                }
            }

            bubble.innerHTML = `
    <div class="chat-text">${messageData.message}</div>
    <div class="chat-times">
      ${new Date(messageData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      ${ticks}
    </div>
  `;
            bubble.dataset.messageId = messageData.id || '';
            bottomDiv.appendChild(bubble);
            bottomDiv.scrollTop = bottomDiv.scrollHeight;
        };

        window.chatSocket.onclose = () => {
            console.log('WebSocket closed');
        };

        window.chatSocket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
        await refreshUnreadBadge(phone);

    } catch (err) {
        console.error('Exception caught in startChatWithUser:', err);
        alert('Network error starting chat');
    }
}

const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-toggle-btn');
const sendIcon = document.getElementById('send-icon');

function updateSendUI() {
    const hasText = chatInput.value.trim().length > 0;

    if (hasText) {
        sendIcon.className = 'fas fa-paper-plane';
        sendBtn.classList.add('send-active');
        sendBtn.disabled = false;

        // Attach click handler if not already set
        sendBtn.onclick = handleSend;
    } else {
        sendIcon.className = 'fas fa-microphone';
        sendBtn.classList.remove('send-active');
        sendBtn.disabled = true;
        sendBtn.onclick = null;
    }
}

function handleSend() {
    const message = chatInput.value.trim();
    if (message) {
        sendMessage(message);
        chatInput.value = '';
        updateSendUI(); // Update icon/button after clearing input
    }
}

chatInput.addEventListener('input', updateSendUI);

chatInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSend();
    }
});


function sendMessage(message) {
    if (!window.chatSocket || window.chatSocket.readyState !== WebSocket.OPEN) {
        alert('WebSocket not connected. Please select a chat first.');
        return;
    }
    window.chatSocket.send(JSON.stringify({
        type: 'message', // <-- add this
        message: message
    }));
    console.log('Message sent via WebSocket:', message);
}


const chatRoll = document.getElementById('chatRoll');
console.log('chatRoll:', chatRoll);


chatRoll.addEventListener('click', e => {
    console.log('Clicked element:', e.target);
    const item = e.target.closest('.chat-item');
    console.log('Closest chat-item:', item);
    if (!item) {
        console.warn('No .chat-item ancestor found');
        return;
    }

    const phone = item.getAttribute('data-phone');
    if (!phone) return;

    console.log('Clicked chat with phone:', phone); // DEBUG
    if (isMobile()) {
        swapViewForMobile();
    }
    startChatWithUser(phone);

    showMainContent(); // switch to main chat view
});


function showMainContent() {
    if (chatViewActivated) return; // already switched, do nothing

    // Hide start screen
    if (startScreen) startScreen.style.display = 'none';

    // Show main chat view
    const contentMain = document.getElementById('content-main');
    if (contentMain) contentMain.style.display = 'block';

    chatViewActivated = true; // mark as switched
}



function markMessageRead(messageId, phone) {
    fetch(`/api/messages/${messageId}/mark-read/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify({
            read: true
        }),
    })
    .then(res => {
        if (!res.ok) throw new Error('Failed to mark read');
        return res.json();
    })
    .then(data => {
        console.log('Message marked as read:', messageId);
        // ✅ Trigger UI update
        refreshUnreadBadge(phone);
    })
    .catch(err => console.error(err));
}

function swapViewForMobile() {
    const body2 = document.querySelector('.body2');
    const body3 = document.querySelector('.body3');

    if (window.innerWidth > 768) {
        // On desktop/tablet, just do the swap without animation
        if (body2) body2.style.display = 'none';
        if (body3) {
            body3.style.display = 'block';
            body3.classList.remove('slide-in');
        }
        return;
    }

    // On mobile, do animated swap
    if (body2) body2.style.display = 'none';

    if (body3) {
        body3.style.display = 'block';
        body3.classList.add('slide-in');
    }
}

document.getElementById('logout-btn').addEventListener('click', () => {
    // Option 1: Redirect to logout URL
    window.location.href = '/logout';
});

// Find the mobile-only menu item
const mobileOnlyItem = document.querySelector('.mobile-only');

if (mobileOnlyItem) {
    mobileOnlyItem.addEventListener('click', () => {
        // Find the button with data-state="settings"
        const settingsBtn = document.querySelector('.iconstuff[data-state="settings"]');
        if (settingsBtn) {
            settingsBtn.click(); // triggers your existing logic
        }
    });
}

const midProfilePic = document.querySelector('.midprofilepic');

if (midProfilePic) {
    midProfilePic.addEventListener('click', () => {
        const profileBtn = document.querySelector('.iconstuff[data-state="profile"]');
        if (profileBtn) {
            profileBtn.click();
        }
    });
}

const backToChats = document.getElementById('back-to-chats');

if (backToChats) {
    backToChats.addEventListener('click', () => {
        const chatsBtn = document.querySelector('.iconstuff[data-state="chats"]');
        if (chatsBtn) {
            chatsBtn.click();
        }
    });
}

const backFromSettings = document.getElementById('back-to-chats-from-settings');

if (backFromSettings) {
    backFromSettings.addEventListener('click', () => {
        const chatsBtn = document.querySelector('.iconstuff[data-state="chats"]');
        if (chatsBtn) {
            chatsBtn.click();
        }
    });
}

const backFromProfile = document.getElementById('back-to-chats-from-profile');

if (backFromProfile) {
    backFromProfile.addEventListener('click', () => {
        const chatsBtn = document.querySelector('.iconstuff[data-state="chats"]');
        if (chatsBtn) {
            chatsBtn.click();
        }
    });
}


const btnAll = document.getElementById('btnAll');
const btnUnread = document.getElementById('btnUnread');
const btnFavourites = document.getElementById('btnFavourites');
const btnGroups = document.getElementById('btnGroups');

const chatRollAll = document.getElementById('chatRoll');
const chatRollUnread = document.getElementById('chatRollUnread');
const chatRollFavourites = document.getElementById('chatRollFavourites');

const buttons = [btnAll, btnUnread, btnFavourites, btnGroups];
const rolls = [chatRollAll, chatRollUnread, chatRollFavourites];

function clearActive() {
    buttons.forEach(btn => btn.classList.remove('active'));
}

function hideAllRolls() {
    rolls.forEach(roll => roll.style.display = 'none');
}

btnAll.addEventListener('click', () => {
    hideAllRolls();
    chatRollAll.style.display = 'flex';

    clearActive();
    btnAll.classList.add('active');
});

btnUnread.addEventListener('click', () => {
    hideAllRolls();
    chatRollUnread.style.display = 'flex';

    clearActive();
    btnUnread.classList.add('active');
});

btnFavourites.addEventListener('click', () => {
    hideAllRolls();
    chatRollFavourites.style.display = 'flex';

    clearActive();
    btnFavourites.classList.add('active');
});

btnGroups.addEventListener('click', () => {
    hideAllRolls();

    clearActive();
    btnGroups.classList.add('active');
});

document.getElementById('archive-btn').addEventListener('click', () => {
    document.getElementById('view-chats').style.display = 'none';
    document.getElementById('view-archive').style.display = 'flex';
});

document.getElementById('back-to-chats').addEventListener('click', () => {
    document.getElementById('view-archive').style.display = 'none';
    document.getElementById('view-chats').style.display = 'flex';
});

const chatContextMenu = document.getElementById('chat-item-context-menu');

// Hide menu on global click
document.addEventListener('click', () => {
    chatContextMenu.classList.add('hidden');
    chatContextMenu.classList.remove('show');
});

// Use event delegation on the parent container that holds chat items
document.querySelectorAll('.chat-roll').forEach(chatRoll => {
    chatRoll.addEventListener('contextmenu', async (event) => {
        const chatItem = event.target.closest('.chat-item');
        if (!chatItem || !chatRoll.contains(chatItem)) return; // click outside chat items, ignore

        event.preventDefault();

        const chatPhone = chatItem.getAttribute('data-phone');
        chatContextMenu.setAttribute('data-phone', chatPhone);

        try {
            const response = await fetch(`/api/chat-status/?phone=${encodeURIComponent(chatPhone)}`);
            if (!response.ok) throw new Error('Network error');
            const status = await response.json();

            // Update menu items (archive, mark-read, favourite)
            const archiveItem = chatContextMenu.querySelector('[data-action="archive"]');
            const markReadItem = chatContextMenu.querySelector('[data-action="mark-read"]');
            const favouriteItem = chatContextMenu.querySelector('[data-action="favourite"]');

            if (status.is_archived) {
                archiveItem.innerHTML = `<i class="fas fa-box-archive"></i> Unarchive chat`;
            } else {
                archiveItem.innerHTML = `<i class="fas fa-box-archive"></i> Archive chat`;
            }

            if (status.has_unread) {
                markReadItem.innerHTML = `<i class="fas fa-envelope-open"></i> Mark as read`;
                markReadItem.style.pointerEvents = 'auto';
                markReadItem.style.opacity = '1';
            } else {
                markReadItem.innerHTML = `<i class="fas fa-envelope"></i> Mark as unread`;
                markReadItem.style.pointerEvents = 'auto';
                markReadItem.style.opacity = '1';
            }

            if (status.is_favourite) {
                favouriteItem.innerHTML = `<i class="fas fa-star"></i> Remove from favourites`;
            } else {
                favouriteItem.innerHTML = `<i class="fas fa-star"></i> Add to favourites`;
            }

        } catch (error) {
            console.error('Error fetching chat status:', error);
        }

        // Position the menu
        const clickX = event.pageX;
        const clickY = event.pageY;
        const menuWidth = chatContextMenu.offsetWidth;
        const menuHeight = chatContextMenu.offsetHeight;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        let posX = clickX;
        let posY = clickY;

        if (clickX + menuWidth > windowWidth) {
            posX = windowWidth - menuWidth - 10;
        }
        if (clickY + menuHeight > windowHeight) {
            posY = windowHeight - menuHeight - 10;
        }

        chatContextMenu.style.top = `${posY}px`;
        chatContextMenu.style.left = `${posX}px`;

        chatContextMenu.classList.remove('hidden');
        chatContextMenu.classList.add('show');
    });
});

// Menu action clicks stay the same
document.querySelectorAll('.chat-context-menu-item').forEach(menuItem => {
    menuItem.addEventListener('click', (event) => {
        const action = menuItem.getAttribute('data-action');
        const phone = chatContextMenu.getAttribute('data-phone');
        console.log(`Perform "${action}" on chat with phone: ${phone}`);

        chatContextMenu.classList.add('hidden');
        chatContextMenu.classList.remove('show');
    });
});


function toggleArchiveUI(phone, isCurrentlyArchived) {
    const chatItem = document.querySelector(`.chat-item[data-phone="${phone}"]`);
    if (!chatItem) return;

    if (isCurrentlyArchived) {
        // Unarchive: show chat item
        chatItem.style.display = '';
    } else {
        // Archive: hide chat item
        chatItem.style.display = 'none';
    }
}

async function toggleChatAction(phone, action, isCurrentlyArchived = false) {
    try {
        if (action === 'archive') {
            // Optimistically update UI immediately for archive
            toggleArchiveUI(phone, isCurrentlyArchived);
        }

        const response = await fetch(`/api/chat-toggle/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
            },
            body: JSON.stringify({
                phone,
                action
            }),
        });

        if (!response.ok) throw new Error('Network error');
        const result = await response.json();

        if (action === 'mark-read') {
        const unreadCount = result.unread_count !== undefined ? result.unread_count : 0;
        updateUnreadBadge(phone, unreadCount);

        } else if (action === 'archive') {
            loadChats();
            loadArchive();

        } else {
            loadFavorites();
        }

        return result;

    } catch (err) {
        console.error(`Error toggling ${action}:`, err);
        alert(`Failed to ${action} chat.`);

        // Revert UI change if archive action failed
        if (action === 'archive') {
            toggleArchiveUI(phone, !isCurrentlyArchived);
        }
    }
}

// Attach click listeners on menu items
chatContextMenu.querySelectorAll('.chat-context-menu-item').forEach(menuItem => {
    menuItem.addEventListener('click', async (e) => {
        e.stopPropagation();
        const action = menuItem.getAttribute('data-action');
        const phone = chatContextMenu.getAttribute('data-phone');
        if (!phone) return;

        // Call API to toggle state
        const result = await toggleChatAction(phone, action);
        if (!result) return; // if error, stop

        // Update menu texts accordingly (or reload state)
        if (action === 'archive') {
            menuItem.innerHTML = result.is_archived ?
                `<i class="fas fa-box-archive"></i> Unarchive chat` :
                `<i class="fas fa-box-archive"></i> Archive chat`;
        } else if (action === 'mark-read') {
            menuItem.innerHTML = result.has_unread ?
                `<i class="fas fa-envelope-open"></i> Mark as read` :
                `<i class="fas fa-envelope"></i> Mark as unread`;
        } else if (action === 'favourite') {
            menuItem.innerHTML = result.is_favourite ?
                `<i class="fas fa-star"></i> Remove from favourites` :
                `<i class="fas fa-star"></i> Add to favourites`;
        }

        // Optionally close menu after action
        chatContextMenu.classList.add('hidden');
        chatContextMenu.classList.remove('show');
    });
});


async function loadChats() {
    const chatRoll = document.getElementById("chatRoll");
    chatRoll.innerHTML = "";

    try {
        const response = await fetch("/api/chats/active/");
        if (!response.ok) throw new Error("Failed to fetch");
        const chats = await response.json();

        if (chats.length === 0) {
            chatRoll.textContent = "no chats yet";
            return;
        }

        chats.forEach(chat => {
            const chatItem = document.createElement("div");
            chatItem.className = "chat-item";
            chatItem.dataset.phone = chat.phone;

            chatItem.innerHTML = `
        <img src="${chat.avatar}" alt="${chat.name}" class="chat-avatar">
        <div class="chat-info">
          <div class="chat-header">
            <span class="chat-name">${chat.name}</span>
            <span class="chat-time">${chat.time}</span>
          </div>
          <div class="chat-preview">${chat.message}</div>
        </div>
        ${chat.unread_count > 0 ? `<div class="unread-badge">${chat.unread_count}</div>` : ""}
      `;

            chatRoll.appendChild(chatItem);
        });

    } catch (err) {
        chatRoll.textContent = "Failed to load chats 😢";
        console.error(err);
    }
}


async function loadFavorites() {
    const favContainer = document.getElementById("chatRollFavourites");
    favContainer.innerHTML = "";

    try {
        const res = await fetch("/api/chats/favourites/");
        if (!res.ok) throw new Error("Failed to fetch");

        const favorites = await res.json();

        if (favorites.length === 0) {
            favContainer.innerHTML = `<div style="padding: 8px; color: #888;">No favourite chats</div>`;
            return;
        }

        favorites.forEach(chat => {
            const chatItem = document.createElement("div");
            chatItem.className = "chat-item";
            chatItem.dataset.phone = chat.phone;

            chatItem.innerHTML = `
        <img src="${chat.avatar}" alt="${chat.name}" class="chat-avatar">
        <div class="chat-info">
          <div class="chat-header">
            <span class="chat-name">${chat.name}</span>
            <span class="chat-time">${chat.time}</span>
          </div>
          <div class="chat-preview">${chat.message}</div>
        </div>
        ${chat.unread_count > 0 ? `<div class="unread-badge">${chat.unread_count}</div>` : ""}
      `;

            favContainer.appendChild(chatItem);
        });

    } catch (err) {
        favContainer.innerHTML = `<div style="padding: 8px; color: red;">Error loading favourites</div>`;
        console.error(err);
    }
}

async function loadArchive() {
    const archiveContainer = document.querySelector('#view-archive .chat-roll');
    archiveContainer.innerHTML = ''; // Clear existing content

    try {
        const response = await fetch('/api/chats/archived/');
        if (!response.ok) throw new Error('Failed to fetch archived chats');

        const archivedChats = await response.json();

        if (archivedChats.length === 0) {
            archiveContainer.innerHTML = `<div style="text-align: center; padding: 20px;">No archived chats</div>`;
            return;
        }

        archivedChats.forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-item';
            chatItem.dataset.phone = chat.phone;

chatItem.innerHTML = `
  <img src="${chat.avatar}" alt="${chat.name}" class="chat-avatar" />
  <div class="chat-info">
    <div class="chat-header">
      <span class="chat-name">${chat.name}</span>
      <span class="chat-time">${chat.time}</span>
    </div>
    <div class="chat-preview">${chat.message}</div>
  </div>
  ${chat.unread_count > 0 ? `<div class="unread-badge">${chat.unread_count}</div>` : ''}
`;

            archiveContainer.appendChild(chatItem);
        });
    } catch (err) {
        archiveContainer.innerHTML = `<div style="color: red; padding: 20px; text-align: center;">Error loading archived chats.</div>`;
        console.error(err);
    }
}

const archiveContainer = document.querySelector('#view-archive .chat-roll');

if (archiveContainer) {
  archiveContainer.addEventListener('click', e => {
    console.log('Clicked element:', e.target);
    const item = e.target.closest('.chat-item');
    console.log('Closest chat-item:', item);
    if (!item) {
      console.warn('No .chat-item ancestor found');
      return;
    }

    const phone = item.dataset.phone;
    if (!phone) return;

    console.log('Clicked chat with phone:', phone);
    if (isMobile()) {
      swapViewForMobile();
    }
    startChatWithUser(phone);
    showMainContent();
  });
} else {
  console.warn('Archive container .chat-roll not found');
}
