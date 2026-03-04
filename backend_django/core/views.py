import logging
import threading
import traceback

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response

from .models import Todo, Passkey, Document, Highlight
from .serializers import (
    TodoSerializer, UserSerializer, DocumentSerializer,
    DocumentListSerializer, HighlightSerializer,
)
from .services.pdf import PDFProcessor
from .services.llm import LLMService

logger = logging.getLogger(__name__)


# ── Explain (ELI5) Endpoint ──────────────────────────────────────
@method_decorator(csrf_exempt, name='dispatch')
class ExplainView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        selected_text = request.data.get('selected_text')
        if not selected_text:
            return Response({'error': 'No text selected'}, status=400)

        result = LLMService.explain_text(selected_text)
        return Response({'text': result})


# ── Document Processing (background thread) ──────────────────────
def process_document_task(document_id):
    """Background task: run PDF processing pipeline and update Document status."""
    try:
        doc = Document.objects.get(id=document_id)
        doc.status = 'PROCESSING'
        doc.save()

        def progress_callback(status_message, percent):
            doc.status_message = status_message
            doc.progress = percent
            doc.save()

        processor = PDFProcessor()
        result = processor.process_pdf(doc.file.path, progress_callback)

        doc.processed_content = result
        doc.status = 'COMPLETED'
        doc.progress = 100
        doc.status_message = "Completed"
        doc.save()
    except Exception as e:
        logger.error(f"Document processing failed: {e}\n{traceback.format_exc()}")
        try:
            doc = Document.objects.get(id=document_id)
            doc.status = 'FAILED'
            doc.save()
        except Document.DoesNotExist:
            pass


# ── Document CRUD ─────────────────────────────────────────────────
class DocumentViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def get_serializer_class(self):
        if self.action == 'list':
            return DocumentListSerializer
        return DocumentSerializer

    def get_queryset(self):
        return Document.objects.all().order_by('-created_at')

    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        doc = self.get_object()
        serializer = DocumentListSerializer(doc)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user if request.user.is_authenticated else None
        doc = serializer.save(user=user)

        thread = threading.Thread(target=process_document_task, args=(doc.id,))
        thread.start()

        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ── Highlights ────────────────────────────────────────────────────
class HighlightViewSet(viewsets.ModelViewSet):
    serializer_class = HighlightSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Highlight.objects.all().order_by('created_at')
        document_id = self.request.query_params.get('document', None)
        if document_id is not None:
            queryset = queryset.filter(document_id=document_id)
        return queryset


# ── Todos ─────────────────────────────────────────────────────────
class TodoViewSet(viewsets.ModelViewSet):
    serializer_class = TodoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Todo.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ── Auth ──────────────────────────────────────────────────────────
@method_decorator(ensure_csrf_cookie, name='dispatch')
class SignupView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        if not email or not password:
            return Response({'error': 'Email and password required'}, status=400)

        if User.objects.filter(username=email).exists():
            return Response({'error': 'User already exists'}, status=400)

        user = User.objects.create_user(username=email, email=email, password=password)
        login(request, user)
        return Response({'user': UserSerializer(user).data})


@method_decorator(ensure_csrf_cookie, name='dispatch')
class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        user = authenticate(username=email, password=password)

        if user:
            login(request, user)
            return Response({'user': UserSerializer(user).data})
        return Response({'error': 'Invalid credentials'}, status=401)


class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response({'message': 'Logged out'})


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({'user': UserSerializer(request.user).data})


# ── WebAuthn Placeholders ─────────────────────────────────────────
class WebAuthnRegisterOptionsView(APIView):
    def post(self, request):
        return Response({})


class WebAuthnRegisterVerifyView(APIView):
    def post(self, request):
        return Response({})


class WebAuthnLoginOptionsView(APIView):
    def post(self, request):
        return Response({})


class WebAuthnLoginVerifyView(APIView):
    def post(self, request):
        return Response({})
