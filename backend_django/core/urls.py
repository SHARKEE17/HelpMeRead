from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TodoViewSet, SignupView, LoginView, LogoutView, MeView,
    WebAuthnRegisterOptionsView, WebAuthnRegisterVerifyView,
    WebAuthnLoginOptionsView, WebAuthnLoginVerifyView,
    DocumentViewSet, HighlightViewSet, ExplainView
)

router = DefaultRouter()
router.register(r'todos', TodoViewSet, basename='todo')
router.register(r'documents', DocumentViewSet, basename='document')
router.register(r'highlights', HighlightViewSet, basename='highlight')

urlpatterns = [
    # Auth
    path('auth/signup', SignupView.as_view()),
    path('auth/login', LoginView.as_view()),
    path('auth/logout', LogoutView.as_view()),
    path('auth/me', MeView.as_view()),
    
    # WebAuthn
    path('auth/webauthn/register/options', WebAuthnRegisterOptionsView.as_view()),
    path('auth/webauthn/register/verify', WebAuthnRegisterVerifyView.as_view()),
    path('auth/webauthn/login/options', WebAuthnLoginOptionsView.as_view()),
    path('auth/webauthn/login/verify', WebAuthnLoginVerifyView.as_view()),

    # API
    path('explain/', ExplainView.as_view(), name='explain'),
    path('', include(router.urls)),
]
