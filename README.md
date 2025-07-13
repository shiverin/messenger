# Messaging App - CS50W Final Project

## Overview

This project is a full-stack, real-time messaging web application developed as the final project for Harvard’s CS50W: Web Programming. The application is designed to replicate and improve upon the core features found in modern messaging platforms such as WhatsApp and Telegram, while demonstrating advanced proficiency in Django, JavaScript, HTML, CSS, and asynchronous communication using Django Channels and WebSockets.

Users can register, log in, view their chat lists, start private conversations, and exchange messages in real time. The front-end is fully responsive, adapting seamlessly to both mobile and desktop devices, and features a clean, custom-designed UI. The back-end leverages Django’s authentication system, sqlite, and asynchronous WebSocket communication for instant message delivery.

## Distinctiveness and Complexity

### Why This Project Is Distinct and Complex

This messaging app is fundamentally different from other projects in the CS50W curriculum. Unlike previous assignments that focus on RESTful APIs and asynchronous API calls, this project implements **real-time, bidirectional communication** using **WebSockets** and **Django Channels**. This architecture is more advanced and requires custom routing, consumer logic, and asynchronous event handling on the server.

The application is **not a social network** (like Project 4) nor an **e-commerce site** (like Project 2). Instead, it is a private, persistent chat platform where only the two users involved in a conversation can access their messages. Each chat is uniquely identified and securely stored using Django’s ORM, ensuring privacy and data integrity. (And later deployed onto a real-world postgres database)

Complexity is further demonstrated through:

- **Custom WebSocket routing and consumer logic** for real-time updates.
- **Dynamic UI rendering** based on device viewport, including mobile-specific behaviors and transitions.
- **Persistent message storage and retrieval** with secure user pairing.
- **Media file upload support** for profile pictures.
- **Custom CSS for message bubbles, keyboard input, read/unread messages indicators, and live search dropdowns.**
- **Graceful fallback mechanisms** for WebSocket failures.

These features go beyond the requirements of previous projects, showcasing advanced asynchronous programming, front-end interactivity, and robust back-end design.

## Feature List

### App Functions

My app is built on the main grounding idea of single page applications (SPA)—no redundant page reloads, only updating what's necessary on the page itself for a seamless and responsive user experience.

#### Login & Registration
- The login page is a single page application containing both signing in and registering capabilities in the same page (`login.html`, `login.js`, `login.css`).
- Users input their phone numbers and country code, which are validated on the frontend using:
  ```js
  import { parsePhoneNumber } from 'https://cdn.skypack.dev/libphonenumber-js';
  export function isValidPhoneNumber(fullPhoneNumber) {
    // Allow optional leading +, followed by digits only
    if (!/^\+?\d+$/.test(fullPhoneNumber)) {
      return false;
    }
    try {
      const phone = parsePhoneNumber(fullPhoneNumber);
      return phone?.isValid() ?? false;
    } catch (e) {
      return false;
    }
  }
  ```
- If the phone number is invalid, the user is prompted to correct it.
- After successful form submission, the frontend UI changes to signup or signin page depending on the `check_phone` API response (user exists or not).
- After registering, the account is successfully inputted into the database and available for verification when calling the `login_api`.
- After logging in, the user is directed to the index page.

#### Setup Page
- Before the index page loads, my index view checks whether the user has set a name yet. If not (likely first-time user), they are directed to the setup page (`setup.html`, `setup.css`, `setup.js`).
- The setup page allows the user to optionally upload a profile picture (automatically cropped into a bubble shape) and requires a name field to be inputted. The name will be their display name in the app.

#### Main Index Page
- After setup, the user is directed to the index page—the most important and feature-rich page of my Django app.
- The index page offers many functions, organized into three main states: `chats`, `settings`, and `profile`, mapped to three buttons on the leftmost div, each represented by an icon.
- Pressing these buttons updates the center and right divs dynamically, without reloading the page.

##### State Details

**Chats State (Main & Most Interactive):**
- Users can view all their active chats in the center div under the class name `chat-roll`. This includes all chats with at least one message exchanged.
- There is an archive box for viewing archived chats.
- Above the archive box, users can filter chats by All, Unread, Favourites, and Groups:
  - **All:** Shows all active chats.
  - **Unread:** Shows only chats with unread messages.
  - **Favourites:** Shows only favourite chats.
  - **Groups:** Shows group chats.
- To add a chat to favourites or archive, users can right-click (or long press on mobile) any active chat to open a dropdown menu below the cursor, allowing actions like archive, favourite, mark as unread/read, and delete. Archived chats can be toggled back similarly.
- The rightmost div displays the message history with the selected user and opens a WebSocket connection for live communication. Messages are sent and received instantly via the WebSocket.
- Unread message badges are updated in real-time, and messages are automatically marked as read when they become visible (using IntersectionObserver).
- The send button UI dynamically switches between microphone and send icons based on input, providing instant feedback.
- The search bar in the middle div allows searching for users by phone number, active chats, and matching messages. Results are organized under Chats, People, and Messages.
- On mobile devices, the app adapts its layout and navigation, including animated transitions for a smooth experience.

**Settings State:**
- The middle and right divs switch to settings views.
- Users can access their settings and logout button.
- Pressing the profile box leads to the profile state.
- Logout is a one-click action with instant redirect.

**Profile State:**
- Users can edit their profile picture (with instant preview), name, and bio.
- Upon editing and pressing the tick button (confirm edit), an API call updates the data in the database, and the frontend updates instantly—creating the feeling of instant edits without any DOM reloads.

##### Exhaustive Features

- **Profile Picture Preview:** Instantly preview new profile picture before uploading (all preview elements update).
- **Optimistic UI Updates:** For actions like archiving chats, the UI updates immediately before waiting for the server response.
- **Context Menu Dynamic Text:** The context menu updates its text/icons based on the chat’s current status (archived, unread, favourite).
- **Error Handling:** All API calls and uploads have error handling and user feedback (alerts, fallback UI).
- **Mobile-specific Interactions:** Long press on mobile triggers context menus, and animated transitions are used for mobile view swaps.
- **Dynamic Send Button:** The send button switches between microphone and send icons depending on input, providing instant feedback.
- **IntersectionObserver for Read Status:** Messages are marked as read automatically when they become visible in the chat window.
- **Live Badge Updates:** Unread message badges update in real-time, including after marking as read/unread.
- **Instant Profile Editing:** Profile edits (name, bio, picture) update both frontend and backend instantly, with no page reload.
- **Search Results Categorization:** Search results are grouped into Chats, People, and Messages for clarity.
- **Logout Redirect:** Logout is handled with a direct redirect, ensuring instant sign-out.
- **Fallbacks for Empty States:** If there are no chats, favourites, or archives, the UI shows a friendly message.
- **Stateful Navigation:** Navigation between chats, settings, and profile is handled with stateful UI logic, ensuring smooth transitions and no reloads.
- **Unread Badge API Integration:** Unread badge status is fetched and updated via API for accuracy.
- **WebSocket Error Handling:** WebSocket connections for chat have error and close handlers for reliability.
- **Modular Chat Loading:** Chats, favourites, and archives are loaded via modular functions for maintainability.
- **Accessibility:** All major actions (edit, archive, favourite, etc.) are accessible via both mouse and touch (mobile-friendly).

All updates and actions (profile edits, chat actions, messaging, etc.) are performed without reloading the page, providing a seamless and responsive user experience.

## File Structure and Contents

### Top-Level Directory: `messenger/`
- `manage.py`: Django’s CLI utility for running commands.
- `requirements.txt`: Lists required Python packages.
- `db.sqlite3`: SQLite database file (development only).
- `media/`: Uploaded media files (profile pictures, etc.).
- `staticfiles/`: Collected static files for production.
- `cleanenv/`: (If present) Python virtual environment directory.
- `messenger/`: Django project configuration (see below).
- `comms/`: Main app containing all messaging logic (see below).

### Project Configuration: `messenger/messenger/`
- `asgi.py`: ASGI application setup for WebSockets.
- `wsgi.py`: WSGI application setup for traditional HTTP.
- `settings.py`: App configuration, media/static setup, Channels configuration.
- `urls.py`: Project-level URL routing.
- `__init__.py`: Package marker.

### Messaging App: `messenger/comms/`
- `admin.py`: Django admin configuration for models.
- `apps.py`: App configuration.
- `consumers.py`: WebSocket consumer logic for real-time messaging.
- `forms.py`: User registration and login forms.
- `models.py`: Defines `User`, `Chat`, `Message`, `ArchivedChat`.
- `routing.py`: WebSocket URL router for Channels.
- `serializers.py`: DRF serializers for API endpoints.
- `urls.py`: App-level URL routing.
- `views.py`: Handles user authentication (login, logout, registration), profile setup, chat list and chat status APIs, chat creation and toggling (archive, favourite, mark-read), message read status, user search, and all main page rendering logic. Implements both HTML views and JSON APIs for SPA interactivity, including real-time chat management and profile editing endpoints.
- `migrations/`: Database migration files.
- `static/`: App-specific static files (CSS, JS, images).
  - `comms/.css files`: CSS stylesheets, profile icons, and JS scripts.
  - `comms/.js files`: UI interaction, message sending, search dropdown, etc.
- `templates/`: App-specific HTML templates.

---

This organization separates project configuration, app logic, static/media files, and documentation for clarity and maintainability.

## How to Run

1. **Clone the repository**
   ```bash
   git clone https://github.com/shiverin/messenger.git
   cd messenger
   ```

2. **Create and activate a virtual environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Apply migrations and create a superuser**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   python manage.py createsuperuser
   ```

5. **Run the development server with Daphne**
   ```bash
   daphne -p 8000 messenger.asgi:application
   ```

6. **Access the application**
   Visit `http://localhost:8000` in your browser.

> For production, use NGINX and Daphne behind a reverse proxy for full WebSocket and static/media file support.

## Additional Information

- **Static and media files**: Properly configured for both development and production. Uses WhiteNoise for static serving in development; NGINX is recommended for production.
- **Mobile responsiveness**: Achieved through media queries and JavaScript logic for device-specific UI.
- **Security**: CSRF protection and trusted origin setup are handled via Django settings.
- **Requirements**: All necessary Python packages are listed in `requirements.txt`.

## Going Beyond the Project Requirements

To further demonstrate technical proficiency and go beyond the course requirements, I successfully deployed the application on **Render.com** using ASGI server compatibility. Additionally, I connected the Django backend to a managed **PostgreSQL database hosted on Supabase**, ensuring robust, scalable, and secure data storage. This deployment setup required configuring environment variables, secure database connections, and adapting static/media file serving for production. The combination of cloud deployment and external database integration showcases real-world skills in web application hosting and scalability.

This project is a culmination of skills learned throughout CS50W, combining asynchronous logic, real-time communication, API design, front-end interactivity, and deployment. It stands as a complex and polished prototype for a modern messaging platform.
