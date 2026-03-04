from django.db import models
from django.contrib.auth.models import User
import uuid

class Todo(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='todos', null=True, blank=True)
    text = models.CharField(max_length=255)
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.text

class Passkey(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='passkeys')
    credential_id = models.CharField(max_length=255, unique=True)
    credential_public_key = models.TextField() 
    counter = models.IntegerField(default=0)
    transports = models.CharField(max_length=255, blank=True, null=True) 

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Passkey for {self.user.username}"

class Document(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='documents', null=True, blank=True)
    file = models.FileField(upload_to='pdfs/')
    title = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    progress = models.IntegerField(default=0)
    status_message = models.CharField(max_length=255, blank=True, default='')
    processed_content = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.title and self.file:
            self.title = self.file.name
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title or str(self.id)

class Highlight(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='highlights')
    block_id = models.CharField(max_length=255) # References the block index or ID in the JSON
    start_offset = models.IntegerField()
    end_offset = models.IntegerField()
    color = models.CharField(max_length=50, default='#ffff00') # Hex or rgba
    text = models.TextField(blank=True) # Selected text for reference
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.document.title} - {self.block_id} ({self.start_offset}-{self.end_offset})"
