from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Todo, Document, Highlight


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']


class TodoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Todo
        fields = ['id', 'text', 'completed', 'created_at']


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['id', 'title', 'file', 'status', 'created_at', 'processed_content']
        read_only_fields = ['id', 'status', 'processed_content', 'created_at']


class DocumentListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['id', 'title', 'file', 'status', 'created_at', 'progress', 'status_message']
        read_only_fields = ['id', 'status', 'created_at', 'progress', 'status_message']


class HighlightSerializer(serializers.ModelSerializer):
    class Meta:
        model = Highlight
        fields = ['id', 'document', 'block_id', 'start_offset', 'end_offset', 'color', 'text', 'created_at']
        read_only_fields = ['id', 'created_at']
