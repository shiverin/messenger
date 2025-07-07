# Messaging App - CS50W Final Project

## Overview

This project is a full-stack real-time messaging web application built as the final project for Harvard's CS50W: Web Programming with Python and JavaScript. It aims to replicate and improve upon the core features found in modern messaging platforms like WhatsApp or Telegram, while demonstrating proficiency in Python, Django, JavaScript, HTML, CSS, and asynchronous communication with Django Channels and WebSockets.

The application allows users to register and log in, view their chat lists, start conversations with other users, exchange messages in real-time, and switch between multiple device views (responsive design for mobile and desktop). The front-end UI is clean and responsive, designed from scratch with vanilla HTML/CSS and some FontAwesome icons. On the back-end, it utilizes Django's robust authentication system, PostgreSQL for relational data, and asynchronous WebSockets powered by Django Channels to deliver real-time updates and messaging.

## Distinctiveness and Complexity

This project satisfies the distinctiveness and complexity requirements in several important ways:

Unlike the course’s provided projects, which focus on asynchronous API calls and RESTful designs, this app implements **real-time bidirectional communication** using **WebSockets** with **Django Channels**, a more advanced and asynchronous architecture. This involves writing both a `routing.py` file to define websocket paths, and custom consumer logic to handle WebSocket events on the server.

Moreover, the front-end design features **dynamic UI rendering based on device viewport**, including features like sliding transitions, mobile-specific behavior (like back buttons), and responsive chat components. This means significant conditional JavaScript logic had to be developed to create a UX consistent with industry standards.

Additionally, the chat system itself is **private and persistent**, meaning all messages are stored, indexed, and retrieved securely through Django’s ORM. Each chat has a unique slug and user pairing system to ensure only the two users involved can access the conversation.

The integration of static file serving, media file upload support (for profile pictures), and the deployment setup on **Render.com** with **ASGI server compatibility** also add complexity. Lastly, custom CSS styling for message bubbles, online indicators, and search functionality using live dropdowns elevates the app beyond a simple messaging demo and towards a polished prototype.

## File Structure and Contents

* **`manage.py`** - Django’s CLI utility for running commands.
* **`requirements.txt`** - List of required Python packages (including `channels`, `daphne`, `Pillow`, etc.)
* **`project_name/settings.py`** - Contains app configuration, media/static setup, and Channels configuration.
* **`project_name/asgi.py`** - Configures the ASGI application for WebSockets.
* **`project_name/routing.py`** - URL router for WebSocket connections.
* **`messenger/models.py`** - Defines `UserProfile`, `Chat`, `Message`, and other core models.
* **`messenger/views.py`** - Django views to handle user logic, chat creation, and rendering.
* **`messenger/consumers.py`** - WebSocket consumer logic for handling real-time messaging.
* **`messenger/templates/`** - Contains the base layout and chat interfaces in HTML.
* **`messenger/static/`** - CSS stylesheets, profile icons, and JS scripts.
* **`messenger/js/index.js`** - Handles UI interaction, message sending, search dropdown, and device-specific behaviors.
* **`messenger/forms.py`** - Handles user registration and login forms.
* **`messenger/api.py`** - Contains Django REST Framework views for chat search and chat creation.
* **`templates/registration/`** - Login and registration HTML pages.
* **`media/profile_pics/`** - Uploaded user profile pictures.

## How to Run

1. **Clone the repository**

```bash
   git clone https://github.com/yourusername/messaging-app.git
   cd messaging-app
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
   daphne -p 8000 project_name.asgi:application
```

6. **Visit** `http://localhost:8000` in your browser to access the application.

> Note: For full WebSocket support and media/static file serving in production, use NGINX and Daphne behind a reverse proxy (this setup was done for Render.com hosting).

## Additional Notes

* Static and media files must be properly configured in production. The app uses `WhiteNoise` for static serving during dev, but assumes NGINX handles them in production.
* The UI dynamically adjusts based on device width and offers different views for mobile vs desktop. This is handled entirely with media queries and JS conditions.
* There’s graceful fallback when WebSockets fail, though the primary experience relies on Channels.
* Security considerations like CSRF protection and trusted origin setup are handled through proper Django settings.

This messaging app is a culmination of everything learned throughout CS50W — combining asynchronous logic, real-time communication, API design, front-end interactivity, and deployment. It’s intended as a realistic prototype for a chat platform, demonstrating both technical skill and product design thinking.
