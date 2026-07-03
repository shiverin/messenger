import "./styles.css";
import "./demo.css";

const STORAGE_KEY = "messenger-static-demo-state-v1";
const STORAGE_VERSION = 1;

const app = document.getElementById("app");

const ui = {
  panel: "chats",
  filter: "all",
  activeChatId: null,
  query: "",
  extraMenuOpen: false,
  contextMenu: null,
  rightProfileOpen: false,
  editingField: null,
  pendingMessage: "",
  focusSearch: false,
  toast: "",
};

const nowMinusMinutes = (minutes) => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutes);
  return date.toISOString();
};

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const avatar = (seed, background = "21C063", foreground = "ffffff") => {
  const initials = seed
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
      <rect width="96" height="96" rx="48" fill="#${background}"/>
      <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="700" fill="#${foreground}">
        ${escapeHtml(initials)}
      </text>
    </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const seedState = () => ({
  version: STORAGE_VERSION,
  profile: {
    name: "Shizhen Demo",
    about: "Building polished web demos for real projects.",
    phone: "+65 8123 4567",
    avatar: avatar("Shizhen Demo", "1DAA61"),
  },
  chats: [
    {
      id: 1,
      phone: "+6590011001",
      name: "Maya Chen",
      about: "Frontend engineer. Usually debugging layout.",
      avatar: avatar("Maya Chen", "7C65E8"),
      favourite: true,
      archived: false,
      unread: 2,
      online: "online",
      messages: [
        { id: 1, sender: "them", text: "The static demo idea is strong.", timestamp: nowMinusMinutes(96), read: true },
        { id: 2, sender: "them", text: "Can viewers try the chat without logging in?", timestamp: nowMinusMinutes(84), read: false },
        { id: 3, sender: "self", text: "Yes. It opens as a guest and stores everything locally.", timestamp: nowMinusMinutes(76), read: true },
        { id: 4, sender: "them", text: "Perfect. That is much better for LinkedIn.", timestamp: nowMinusMinutes(42), read: false },
      ],
    },
    {
      id: 2,
      phone: "+6590011002",
      name: "CS50W Project Group",
      about: "Course project polish and deployment notes.",
      avatar: avatar("CS50W Project Group", "0B84A5"),
      favourite: false,
      archived: false,
      unread: 0,
      online: "3 participants",
      isGroup: true,
      messages: [
        { id: 1, sender: "them", text: "Remember to mention Django Channels in the README.", timestamp: nowMinusMinutes(420), read: true },
        { id: 2, sender: "self", text: "Added WebSockets, read receipts, search, and mobile behavior.", timestamp: nowMinusMinutes(390), read: true },
        { id: 3, sender: "them", text: "Nice. The demo should show those without needing Render to wake up.", timestamp: nowMinusMinutes(140), read: true },
      ],
    },
    {
      id: 3,
      phone: "+6590011003",
      name: "Aisha Product",
      about: "Ships small, useful things.",
      avatar: avatar("Aisha Product", "E05D5D"),
      favourite: true,
      archived: false,
      unread: 1,
      online: "last seen today at 13:48",
      messages: [
        { id: 1, sender: "them", text: "For a recruiter, the first five seconds matter.", timestamp: nowMinusMinutes(260), read: true },
        { id: 2, sender: "self", text: "Agreed. The app should start inside the product, not at auth.", timestamp: nowMinusMinutes(250), read: true },
        { id: 3, sender: "them", text: "Exactly. Show the full feature surface immediately.", timestamp: nowMinusMinutes(32), read: false },
      ],
    },
    {
      id: 4,
      phone: "+6590011004",
      name: "Kenny Go",
      about: "Backend APIs, tests, and deployment.",
      avatar: avatar("Kenny Go", "F6B04D"),
      favourite: false,
      archived: true,
      unread: 0,
      online: "last seen yesterday",
      messages: [
        { id: 1, sender: "them", text: "Fake API calls are still useful if they preserve the real interface.", timestamp: nowMinusMinutes(1440), read: true },
        { id: 2, sender: "self", text: "Exactly. UI behavior stays real, persistence is local.", timestamp: nowMinusMinutes(1432), read: true },
      ],
    },
    {
      id: 5,
      phone: "+6590011005",
      name: "Vercel Launch",
      about: "Deployment checklist and share links.",
      avatar: avatar("Vercel Launch", "111B21"),
      favourite: false,
      archived: false,
      unread: 0,
      online: "online",
      messages: [
        { id: 1, sender: "self", text: "Build command: npm ci && npm run build.", timestamp: nowMinusMinutes(1500), read: true },
        { id: 2, sender: "them", text: "Root directory for this one is demo.", timestamp: nowMinusMinutes(1498), read: true },
      ],
    },
  ],
});

const loadState = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return resetState();

  try {
    const parsed = JSON.parse(raw);
    if (parsed.version !== STORAGE_VERSION) throw new Error("stale state");
    return parsed;
  } catch {
    return resetState();
  }
};

const saveState = (state) => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

const resetState = () => {
  const state = seedState();
  saveState(state);
  return state;
};

let state = loadState();

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const lastMessage = (chat) => chat.messages.at(-1);

const showToast = (message) => {
  ui.toast = message;
  render();
  window.setTimeout(() => {
    ui.toast = "";
    render();
  }, 1600);
};

const visibleChats = () => {
  const archived = ui.panel === "archive";
  const base = state.chats.filter((chat) => chat.archived === archived);
  const filtered =
    ui.filter === "unread"
      ? base.filter((chat) => chat.unread > 0)
      : ui.filter === "favourites"
      ? base.filter((chat) => chat.favourite)
      : ui.filter === "groups"
      ? base.filter((chat) => chat.isGroup)
      : base;

  return filtered.sort((a, b) => new Date(lastMessage(b)?.timestamp || 0) - new Date(lastMessage(a)?.timestamp || 0));
};

const searchResults = () => {
  const query = ui.query.trim().toLowerCase();
  if (!query) return null;

  const chats = state.chats.filter(
    (chat) => chat.name.toLowerCase().includes(query) || chat.phone.includes(query)
  );
  const messages = state.chats.flatMap((chat) =>
    chat.messages
      .filter((message) => message.text.toLowerCase().includes(query))
      .map((message) => ({ chat, message }))
  );

  return { chats, people: chats.filter((chat) => !chat.archived), messages };
};

const renderChatItem = (chat, extraClass = "") => {
  const last = lastMessage(chat);
  return `
    <div class="chat-item ${ui.activeChatId === chat.id ? "active" : ""} ${extraClass}" data-chat-id="${chat.id}">
      <img src="${chat.avatar}" alt="${escapeHtml(chat.name)}" class="chat-avatar">
      <div class="chat-info">
        <div class="chat-header">
          <span class="chat-name">${escapeHtml(chat.name)}</span>
          <span class="chat-time">${last ? formatTime(last.timestamp) : ""}</span>
        </div>
        <div class="chat-preview">${last ? escapeHtml(last.text) : ""}</div>
      </div>
      ${chat.unread > 0 ? `<div class="unread-badge">${chat.unread}</div>` : ""}
    </div>`;
};

const renderSearchSection = (label, items) => `
  <div class="chat-roll-section">
    <div class="chat-roll-label">${label}</div>
    <div class="chat-roll">
      ${items.length ? items.join("") : `<div class="demo-empty">No results</div>`}
    </div>
  </div>`;

const renderSearchResults = () => {
  const results = searchResults();
  if (!results) return "";

  const chatItems = results.chats.map((chat) => renderChatItem(chat, "message-item"));
  const peopleItems = results.people.map((chat) => renderChatItem(chat, "message-item"));
  const messageItems = results.messages.map(({ chat, message }) => `
    <div class="chat-item message-item" data-chat-id="${chat.id}">
      <img src="${chat.avatar}" alt="${escapeHtml(chat.name)}" class="chat-avatar">
      <div class="chat-info">
        <div class="chat-header">
          <span class="chat-name">${escapeHtml(chat.name)}</span>
          <span class="chat-time">${formatTime(message.timestamp)}</span>
        </div>
        <div class="chat-preview">${escapeHtml(message.text)}</div>
      </div>
    </div>`);

  return `
    <div id="chat-search-results" style="display:block;">
      ${renderSearchSection("Chats", chatItems)}
      ${renderSearchSection("People", peopleItems)}
      ${renderSearchSection("Messages", messageItems)}
    </div>`;
};

const renderChatsPanel = () => {
  const chats = visibleChats();
  return `
    <div id="view-chats" class="app-view" style="display:${ui.panel === "chats" ? "flex" : "none"}; flex-direction:column;">
      <div class="padding-helper">
        <div class="midhead">
          <div style="font-size:22px;font-weight:500;color:#1DAA61;">WhatsApp</div>
          <div class="midtopright">
            <button class="noticonstuff" aria-label="New chat"><i class="fas fa-comment-medical"></i></button>
            <button id="chat-extra-options-button" class="noticonstuff" aria-label="More options">
              <i class="fas fa-ellipsis-v"></i>
            </button>
            <div id="chat-extra-options-menu" class="chat-extra-options-menu ${ui.extraMenuOpen ? "show" : "hidden"}" style="top:54px;right:12px;">
              <ul class="chat-extra-options-list">
                <li><i class="fas fa-users hehe"></i> New group</li>
                <li><i class="fas fa-star hehe"></i> Starred messages</li>
                <li><i class="fas fa-check-square hehe"></i> Select chats</li>
                <li data-state="settings"><i class="fas fa-cog hehe"></i> Settings</li>
                <hr class="pc-only">
                <li class="demo-reset-item" data-reset-demo><i class="fas fa-rotate-right hehe"></i> Reset demo</li>
              </ul>
            </div>
          </div>
        </div>
        <div class="chat-search-container">
          <i class="fas fa-search search-icon"></i>
          <input type="text" id="chat-search" value="${escapeHtml(ui.query)}" placeholder="Search or start a new chat" autocomplete="off">
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;padding-top:14px;padding-bottom:5px;">
          ${["all", "unread", "favourites", "groups"]
            .map((filter) => `<button class="bubble-btn ${ui.filter === filter ? "active" : ""}" data-filter="${filter}">${filter[0].toUpperCase()}${filter.slice(1)}</button>`)
            .join("")}
        </div>
      </div>
      <div class="general-chat">
        ${ui.query ? renderSearchResults() : `
          <div class="mid-chat-lower">
            <div class="archive-div" id="archive-btn"><i class="fas fa-box-archive"></i><span>Archived</span></div>
            <div class="chat-roll" id="chatRoll">
              ${chats.length ? chats.map((chat) => renderChatItem(chat)).join("") : `<div class="demo-empty">No chats in this view</div>`}
            </div>
          </div>`}
      </div>
    </div>`;
};

const renderArchivePanel = () => {
  const archived = visibleChats();
  return `
    <div id="view-archive" class="app-view" style="display:${ui.panel === "archive" ? "flex" : "none"}; flex-direction:column;">
      <div class="midhead" style="display:flex;">
        <div class="midtopright">
          <button id="back-to-chats" class="noticonstuff"><i class="fas fa-arrow-left"></i></button>
          <div style="font-size:15px;font-weight:350;color:black;padding-left:6px;">Archived</div>
        </div>
      </div>
      <div class="padding-helper" style="flex:1;overflow-y:auto;">
        <div class="paragraphstuff">
          <p style="font-size:14px;color:grey;padding-top:12px;">These chats stay archived when new messages are received. To change this experience, go to <b>Settings &gt; Chats</b> on your phone.</p>
          <hr>
        </div>
        <div class="chat-roll">
          ${archived.length ? archived.map((chat) => renderChatItem(chat)).join("") : `<div class="demo-empty">No archived chats</div>`}
        </div>
      </div>
    </div>`;
};

const renderSettingsPanel = () => `
  <div id="view-settings" class="app-view" style="display:${ui.panel === "settings" ? "flex" : "none"};">
    <div class="midset">
      <div style="padding-top:5px;display:flex;align-items:center;gap:10px;">
        <i class="fas fa-arrow-left mobile-only" data-state="chats" style="cursor:pointer;"></i>
        <div style="font-size:20px;font-weight:500;">Settings</div>
      </div>
      <div class="set-search-container">
        <i class="fas fa-search search-icon"></i>
        <input type="text" id="set-search" placeholder="Search settings">
      </div>
      <div class="small-mid">
        <div class="midprofilepic" data-state="profile">
          <img id="profile-preview" src="${state.profile.avatar}" alt="Profile Preview" style="width:65px;height:65px;border-radius:50%;object-fit:cover;">
          <div class="midprodes">
            <div>${escapeHtml(state.profile.name)}</div>
            <div>${escapeHtml(state.profile.about)}</div>
          </div>
        </div>
        <hr>
        <div class="midbottom">
          <ul>
            <li class="setting-item"><i class="fas fa-user"></i> Account</li>
            <li class="setting-item"><i class="fas fa-shield-alt"></i> Privacy</li>
            <li class="setting-item"><i class="fas fa-comments"></i> Chats</li>
            <li class="setting-item"><i class="fas fa-bell"></i> Notifications</li>
            <li class="setting-item"><i class="fas fa-keyboard"></i> Keyboard Shortcuts</li>
            <li class="setting-item"><i class="fas fa-question-circle"></i> Help</li>
            <li class="setting-item demo-reset-item" data-reset-demo><i class="fas fa-rotate-right"></i> Reset demo</li>
          </ul>
        </div>
      </div>
    </div>
  </div>`;

const editableValue = (field, label, note = "") => {
  const editing = ui.editingField === field;
  const value = state.profile[field];
  return `
    <label for="${field}-input" style="color:#65676B;margin-top:${field === "about" ? "60px" : "0"};">${label}</label>
    <div class="edit${field}" style="margin-top:10px;display:flex;align-items:center;">
      <div class="input-group demo-inline-edit">
        ${editing ? `<input class="demo-form-input" id="${field}-input" value="${escapeHtml(value)}">` : `<span id="${field}-display">${escapeHtml(value)}</span>`}
      </div>
      <i id="${field}-icon" data-edit-field="${field}" class="fas ${editing ? "fa-check" : "fa-pen"} edit-icon" style="margin-left:10px;cursor:pointer;"></i>
    </div>
    ${note ? `<div class="demo-profile-note">${note}</div>` : ""}`;
};

const renderProfilePanel = () => `
  <div id="view-profile" class="app-view" style="display:${ui.panel === "profile" ? "flex" : "none"};">
    <div class="midpro" style="width:100%;">
      <div style="padding-top:5px;display:flex;align-items:center;gap:10px;">
        <i class="fas fa-arrow-left mobile-only" data-state="chats" style="cursor:pointer;"></i>
        <div style="font-size:20px;font-weight:500;">Profile</div>
      </div>
      <div class="midprochange">
        <div class="form-group" id="topform">
          <input type="file" id="profile-pic2" accept="image/*" style="display:none;">
          <img id="profile-preview2" src="${state.profile.avatar}" alt="Profile Preview" style="width:130px;height:130px;border-radius:50%;object-fit:cover;cursor:pointer;">
        </div>
        <div class="form-group" id="bottomform" style="font-size:15px;">
          ${editableValue("name", "Your name", "This is the guest profile used for the static demo.")}
          ${editableValue("about", "About")}
        </div>
      </div>
    </div>
  </div>`;

const renderMessages = (chat) =>
  chat.messages
    .map((message, index) => `
      <div class="chat-bubble ${message.sender === "self" ? "sent" : "received"} ${index === 0 ? "first" : ""}" data-message-id="${message.id}">
        <div class="chat-text">${escapeHtml(message.text)}</div>
        <div class="chat-times">${formatTime(message.timestamp)} ${message.sender === "self" ? `<i class="fas fa-check-double" style="color:${message.read ? "#53bdeb" : "gray"};"></i>` : ""}</div>
      </div>`)
    .join("");

const renderChatContent = () => {
  const chat = state.chats.find((item) => item.id === ui.activeChatId);
  if (!chat) {
    return `
      <div id="start-screen">
        <div class="contain-start">
          <div class="start-middle">
            <img src="/images/start.png" alt="Messenger start screen">
            <div style="font-size:36px;font-weight:300;">Messenger Static Demo</div>
            <div style="font-size:14px;color:#636261;">Browse the full project UI without a backend or login.</div>
            <button class="pill-button" data-reset-demo>Reset demo data</button>
          </div>
          <div class="encrypted"><i class="fas fa-lock" style="margin-right:6px;"></i>Demo messages are stored only in your browser</div>
        </div>
      </div>`;
  }

  return `
    <div id="content-main" class="app-view" style="display:flex;">
      <div class="right-entire">
        <div class="right-top">
          <div class="chat-top-bar" style="display:flex;justify-content:space-between;align-items:center;height:100%;padding:16px;">
            <div class="chat-top-bar-left" style="display:flex;align-items:center;gap:15px;">
              <button id="back-button" class="mobile-only"><i class="fas fa-arrow-left"></i></button>
              <img src="${chat.avatar}" data-show-contact style="cursor:pointer;width:40px;height:40px;border-radius:50%;object-fit:cover;">
              <div data-show-contact style="cursor:pointer;font-weight:400;font-size:16px;">
                ${escapeHtml(chat.name)}
                <div class="demo-status-line">${escapeHtml(chat.online)}</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
              <button class="right-top-icons-two"><i class="fas fa-video"></i> <i class="fas fa-chevron-down"></i></button>
              <button class="right-top-icons"><i class="fas fa-search"></i></button>
              <button class="right-top-icons"><i class="fas fa-ellipsis-v"></i></button>
            </div>
          </div>
        </div>
        <div class="right-bottom">
          <div class="right-bottom-upper">${renderMessages(chat)}</div>
          <div class="right-bottom-lower">
            <div class="chat-input-wrapper">
              <div class="chat-input-bar">
                <div class="left-icons"><button><i class="fas fa-plus"></i></button><button><i class="far fa-smile"></i></button></div>
                <input type="text" id="chat-input" value="${escapeHtml(ui.pendingMessage)}" placeholder="Type a message" autocomplete="off">
                <div class="right-icons">
                  <button id="send-toggle-btn" class="${ui.pendingMessage.trim() ? "send-active" : ""}" ${ui.pendingMessage.trim() ? "" : "disabled"}>
                    <i class="fas ${ui.pendingMessage.trim() ? "fa-paper-plane" : "fa-microphone"}" id="send-icon"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    ${renderRightProfile(chat)}`;
};

const renderRightProfile = (chat) => `
  <div class="right-right ${ui.rightProfileOpen ? "slide-in" : ""}" style="border-left:1px solid #e0dedc;">
    <div class="view-chat-profile">
      <div class="right-profile-header" style="display:flex;justify-content:space-between;align-items:center;padding:12px;">
        <div style="display:flex;gap:12px;align-items:center;">
          <button id="right-close-button"><i class="fas fa-times"></i></button>
          <div style="font-size:16px;">Contact info</div>
        </div>
      </div>
      <div class="right-profile-mid" style="text-align:center;padding:16px;margin-top:5px;">
        <img src="${chat.avatar}" alt="${escapeHtml(chat.name)}" style="width:180px;height:180px;border-radius:50%;object-fit:cover;">
        <div style="font-size:22px;margin-top:18px;">${escapeHtml(chat.name)}</div>
        <div style="color:#667781;margin-top:4px;">${escapeHtml(chat.phone)}</div>
      </div>
      <div class="demo-contact-panel-row">${escapeHtml(chat.about)}</div>
      <div class="demo-contact-panel-row"><i class="fas fa-star" style="color:#f4b400;margin-right:8px;"></i>${chat.favourite ? "Favourite chat" : "Not in favourites"}</div>
      <div class="demo-contact-panel-row"><i class="fas fa-box-archive" style="margin-right:8px;"></i>${chat.archived ? "Archived" : "Active chat"}</div>
    </div>
  </div>`;

const renderContextMenu = () => {
  if (!ui.contextMenu) return "";
  const chat = state.chats.find((item) => item.id === ui.contextMenu.chatId);
  if (!chat) return "";
  return `
    <div id="chat-item-context-menu" class="chat-context-menu-container show" style="top:${ui.contextMenu.y}px;left:${ui.contextMenu.x}px;">
      <ul class="chat-context-menu-list">
        <li class="chat-context-menu-item" data-menu-action="archive"><i class="fas fa-box-archive"></i> ${chat.archived ? "Unarchive" : "Archive"} chat</li>
        <li class="chat-context-menu-item" data-menu-action="mark-read"><i class="fas fa-envelope-open"></i> ${chat.unread ? "Mark as read" : "Mark as unread"}</li>
        <li class="chat-context-menu-item" data-menu-action="favourite"><i class="fas fa-star"></i> ${chat.favourite ? "Remove from favourites" : "Add to favourites"}</li>
        <hr>
        <li class="chat-context-menu-item" data-menu-action="delete"><i class="fas fa-trash-alt"></i> Delete chat</li>
      </ul>
    </div>`;
};

const render = () => {
  app.innerHTML = `
    <div class="biggest-div">
      <div class="body1">
        <div class="lefttop">
          <button class="iconstuff ${["chats", "archive"].includes(ui.panel) ? "active" : ""}" data-state="chats"><i class="fas fa-comments"></i></button>
        </div>
        <div class="leftbottom">
          <button class="iconstuff ${ui.panel === "settings" ? "active" : ""}" data-state="settings"><i class="fas fa-cog"></i></button>
          <button id="left-bottom-pic" class="iconstuff ${ui.panel === "profile" ? "active" : ""}" data-state="profile">
            <img id="left-profile-preview" src="${state.profile.avatar}" alt="Profile Preview" style="width:30px;height:30px;border-radius:50%;object-fit:cover;">
          </button>
        </div>
      </div>
      <div class="body2">
        ${renderChatsPanel()}
        ${renderArchivePanel()}
        ${renderSettingsPanel()}
        ${renderProfilePanel()}
      </div>
      <div class="body3 ${ui.activeChatId ? "mobile-open" : ""}">
        ${ui.panel === "settings" ? `<div id="content-settings" class="app-view" style="display:flex;"><div class="setimg"><div><i class="fas fa-cog"></i></div><div style="font-weight:300;">Settings</div></div></div>` : ""}
        ${ui.panel === "profile" ? `<div id="content-profile" class="app-view" style="display:flex;"><div class="proimg"><div><i class="fas fa-user"></i></div><div style="font-weight:300;">Profile</div></div></div>` : ""}
        ${["chats", "archive"].includes(ui.panel) ? renderChatContent() : ""}
      </div>
      ${renderContextMenu()}
      ${ui.toast ? `<div class="demo-toast">${escapeHtml(ui.toast)}</div>` : ""}
    </div>`;

  attachEvents();
  restoreFocus();
};

const restoreFocus = () => {
  if (ui.focusSearch) {
    const input = document.getElementById("chat-search");
    input?.focus();
    input?.setSelectionRange(ui.query.length, ui.query.length);
    ui.focusSearch = false;
  }

  const chatInput = document.getElementById("chat-input");
  if (document.activeElement?.id === "chat-input") {
    chatInput?.focus();
  }
};

const attachEvents = () => {
  app.querySelectorAll("[data-state]").forEach((node) => {
    node.addEventListener("click", () => {
      ui.panel = node.dataset.state;
      ui.query = "";
      ui.extraMenuOpen = false;
      ui.contextMenu = null;
      render();
    });
  });

  app.querySelectorAll("[data-filter]").forEach((node) => {
    node.addEventListener("click", () => {
      ui.filter = node.dataset.filter;
      render();
    });
  });

  app.querySelector("#archive-btn")?.addEventListener("click", () => {
    ui.panel = "archive";
    render();
  });

  app.querySelector("#back-to-chats")?.addEventListener("click", () => {
    ui.panel = "chats";
    render();
  });

  app.querySelector("#chat-extra-options-button")?.addEventListener("click", (event) => {
    event.stopPropagation();
    ui.extraMenuOpen = !ui.extraMenuOpen;
    render();
  });

  app.querySelector("#chat-search")?.addEventListener("input", (event) => {
    ui.query = event.target.value;
    ui.focusSearch = true;
    render();
  });

  app.querySelectorAll(".chat-item").forEach((node) => {
    node.addEventListener("click", () => openChat(Number(node.dataset.chatId)));
    node.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      ui.contextMenu = {
        chatId: Number(node.dataset.chatId),
        x: Math.min(event.pageX, window.innerWidth - 230),
        y: Math.min(event.pageY, window.innerHeight - 240),
      };
      render();
    });
  });

  app.querySelectorAll("[data-menu-action]").forEach((node) => {
    node.addEventListener("click", () => applyMenuAction(node.dataset.menuAction));
  });

  app.querySelectorAll("[data-reset-demo]").forEach((node) => {
    node.addEventListener("click", () => {
      state = resetState();
      Object.assign(ui, {
        panel: "chats",
        filter: "all",
        activeChatId: null,
        query: "",
        extraMenuOpen: false,
        contextMenu: null,
        rightProfileOpen: false,
        editingField: null,
        pendingMessage: "",
      });
      showToast("Demo data reset");
    });
  });

  app.querySelector("#chat-input")?.addEventListener("input", (event) => {
    ui.pendingMessage = event.target.value;
    render();
    document.getElementById("chat-input")?.focus();
  });

  app.querySelector("#chat-input")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  });

  app.querySelector("#send-toggle-btn")?.addEventListener("click", sendMessage);
  app.querySelector("#back-button")?.addEventListener("click", () => {
    ui.activeChatId = null;
    render();
  });

  app.querySelectorAll("[data-show-contact]").forEach((node) => {
    node.addEventListener("click", () => {
      ui.rightProfileOpen = true;
      render();
    });
  });

  app.querySelector("#right-close-button")?.addEventListener("click", () => {
    ui.rightProfileOpen = false;
    render();
  });

  app.querySelector("#profile-preview2")?.addEventListener("click", () => {
    app.querySelector("#profile-pic2")?.click();
  });

  app.querySelector("#profile-pic2")?.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      state.profile.avatar = reader.result;
      saveState(state);
      showToast("Profile photo updated");
    };
    reader.readAsDataURL(file);
  });

  app.querySelectorAll("[data-edit-field]").forEach((node) => {
    node.addEventListener("click", () => {
      const field = node.dataset.editField;
      if (ui.editingField === field) {
        const input = document.getElementById(`${field}-input`);
        state.profile[field] = input.value.trim() || state.profile[field];
        saveState(state);
        ui.editingField = null;
        showToast("Profile updated");
      } else {
        ui.editingField = field;
        render();
        document.getElementById(`${field}-input`)?.focus();
      }
    });
  });
};

const openChat = (chatId) => {
  const chat = state.chats.find((item) => item.id === chatId);
  if (!chat) return;
  chat.unread = 0;
  chat.messages.forEach((message) => {
    if (message.sender === "them") message.read = true;
  });
  saveState(state);
  ui.activeChatId = chatId;
  ui.panel = ui.panel === "archive" ? "archive" : "chats";
  ui.query = "";
  ui.contextMenu = null;
  render();
};

const applyMenuAction = (action) => {
  const chat = state.chats.find((item) => item.id === ui.contextMenu?.chatId);
  if (!chat) return;

  if (action === "archive") {
    chat.archived = !chat.archived;
    showToast(chat.archived ? "Chat archived" : "Chat unarchived");
  } else if (action === "favourite") {
    chat.favourite = !chat.favourite;
    showToast(chat.favourite ? "Added to favourites" : "Removed from favourites");
  } else if (action === "mark-read") {
    chat.unread = chat.unread ? 0 : 1;
    showToast(chat.unread ? "Marked as unread" : "Marked as read");
  } else if (action === "delete") {
    state.chats = state.chats.filter((item) => item.id !== chat.id);
    if (ui.activeChatId === chat.id) ui.activeChatId = null;
    showToast("Chat deleted");
  }

  ui.contextMenu = null;
  saveState(state);
  render();
};

const sendMessage = () => {
  const text = ui.pendingMessage.trim();
  if (!text || !ui.activeChatId) return;

  const chat = state.chats.find((item) => item.id === ui.activeChatId);
  chat.messages.push({
    id: Date.now(),
    sender: "self",
    text,
    timestamp: new Date().toISOString(),
    read: true,
  });
  ui.pendingMessage = "";
  saveState(state);
  render();

  window.setTimeout(() => {
    const freshChat = state.chats.find((item) => item.id === chat.id);
    if (!freshChat) return;
    freshChat.messages.push({
      id: Date.now() + 1,
      sender: "them",
      text: "Nice. This reply is simulated locally for the static demo.",
      timestamp: new Date().toISOString(),
      read: ui.activeChatId === freshChat.id,
    });
    if (ui.activeChatId !== freshChat.id) freshChat.unread += 1;
    saveState(state);
    render();
  }, 900);
};

document.addEventListener("click", (event) => {
  if (!event.target.closest("#chat-item-context-menu") && !event.target.closest(".chat-item")) {
    if (ui.contextMenu) {
      ui.contextMenu = null;
      render();
    }
  }
});

render();
