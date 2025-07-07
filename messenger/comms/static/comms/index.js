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
});


function isMobile() {
    return window.innerWidth <= 768; // or 600 or 480 depending on your layout
}

const bottomDiv = document.querySelector('.right-bottom-upper');
const readMessageIds = new Set();

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const messageId = entry.target.dataset.messageId;
            if (messageId && !readMessageIds.has(messageId)) {
                console.log('Marking message as read:', messageId);
                readMessageIds.add(messageId);
                markMessageRead(messageId);
            }
        }
    });
}, {
    root: bottomDiv,
    threshold: 0.5 // consider message read when at least half visible
});


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
                view.style.display = (state === 'chats') ? 'flex' : 'block';
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
                view.style.display = shouldShow ? 'block' : 'none';
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

const btn = document.getElementById('extra-btn');
const menu = document.getElementById('extra-menu');

btn.addEventListener('click', (e) => {
    e.stopPropagation();

    const rect = btn.getBoundingClientRect();
    menu.style.top = `${rect.bottom + window.scrollY}px`;

    if (window.innerWidth <= 768) {
        // On mobile, anchor right side and expand leftwards
        menu.style.right = '0px';
        menu.style.left = 'auto'; // remove left positioning
    } else {
        // On desktop, keep original left positioning
        menu.style.left = `${rect.left + window.scrollX - 10}px`;
        menu.style.right = 'auto'; // remove right positioning
    }

    menu.classList.toggle('show');
    menu.classList.toggle('hidden');
});

document.addEventListener('click', () => {
    if (menu.classList.contains('show')) {
        menu.classList.remove('show');
        menu.classList.add('hidden');
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
        return;
    }

    try {
        const res = await fetch(`/api/search-users?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();

        if (data.results.length === 0) {
            chatSearchResults.innerHTML = '<div style="padding: 8px;">No users found</div>';
            chatSearchResults.style.display = 'block';
            return;
        }

chatSearchResults.innerHTML = data.results.map(user => `
  <div class="chat-search-result-item"
       style="padding: 8px; cursor: pointer; border-bottom: 1px solid #eee;"
       data-user-id="${user.id}"
       data-phone="${user.phone}">
    ${
      user.name
        ? `<strong>${user.name}</strong><small>${user.phone}</small>`
        : `<strong>${user.phone}</strong>`
    }
  </div>
`).join('');
        chatSearchResults.style.display = 'block';

    } catch (e) {
        chatSearchResults.innerHTML = `<div style="padding:8px; color:red;">Error loading results</div>`;
        chatSearchResults.style.display = 'block';
    }
});

chatSearchResults.addEventListener('click', e => {
    const item = e.target.closest('.chat-search-result-item');
    if (!item) return;

    const phone = item.getAttribute('data-phone');
    showMainContent();
    startChatWithUser(phone);
    if (isMobile()) {
        swapViewForMobile();
    }
    chatSearchResults.style.display = 'none';
    chatSearchResults.innerHTML = '';
    chatSearchInput.value = '';
});

document.addEventListener('click', (e) => {
    if (!chatSearchResults.contains(e.target) && e.target !== chatSearchInput) {
        chatSearchResults.style.display = 'none';
    }
});


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
        topDiv.innerHTML = `
  <div class="chat-top-bar" style="display: flex; justify-content: space-between; align-items: center; height: 100%; padding:16px;">
    <div class="chat-top-bar-left" style="display: flex; align-items: center; gap: 15px;">
      ${mobile ? `
<button id="back-button">
  <i class="fas fa-arrow-left"></i>
</button>
      ` : ''}
      <img src="${user.profile_pic}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
      <div style="font-weight: 400; font-size:16px;">${user.username}</div>
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



function markMessageRead(messageId) {
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
            // Optionally update UI here if needed
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

