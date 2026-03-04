# Django Backend Migration

The backend has been migrated from Node.js/Express to **Django 5**.

## 🏗️ Structure
*   `backend_django/` - Root Django project.
*   `backend_django/config/` - Project settings (`settings.py`, `urls.py`).
*   `backend_django/core/` - Main application.
    *   `models.py`: `Todo` and `Passkey` models.
    *   `views.py`: API endpoints for Auth and Todos.
    *   `serializers.py`: DRF serializers.
    *   `urls.py`: URL routing.

## 🚀 How to Run

1.  **Install Dependencies**:
    ```bash
    pip install django djangorestframework django-cors-headers djangorestframework-camel-case fido2
    ```

2.  **Start Server**:
    ```bash
    cd backend_django
    python manage.py runserver
    # Running at http://localhost:8000
    ```

3.  **Frontend**:
    The React frontend is already configured to proxy `/auth` and `/todos` to port `8000`.
    ```bash
    cd frontend
    npm run dev
    ```

## 🔑 Authentication
*   **API**: `POST /auth/login`, `POST /auth/signup`.
*   **WebAuthn**: Endpoints are scaffolded in `views.py` but require full logic implementation in `utils.py` using `fido2`.
*   **Session**: Uses Django's `sessionid` cookie (HttpOnly).

## 🗄️ Database
Uses SQLite by default (`db.sqlite3`). To switch to Postgres, update `DATABASES` in `settings.py`.
