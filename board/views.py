from django.shortcuts import render

from rest_framework import viewsets  # ViewSets lib for creating resource lists

from .models import Sprint  # the Sprint model
from .serializers import SprintSerializer  # the serializer


class SprintViewSet(viewsets.ModelViewSet):
    """API endpoint for listing and creating sprints."""
    queryset = Sprint.objects.order_by('end')  # sort by end date desc
    serializer_class = SprintSerializer  # appoint it's own serializer
