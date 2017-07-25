from django.shortcuts import render

from rest_framework import authentication, permissions, viewsets  # viewSets related libs for creating resource lists

from django.contrib.auth import get_user_model  # for a uniformed user model
from .models import Sprint, Task  # the Sprint model
from .serializers import SprintSerializer, TaskSerializer, UserSerializer  # the serializer

User = get_user_model()  # the uniformed user model


class DefaultsMixin(object):
    """Default settings for view authentication, permissions, filtering and pagination."""
    authentication_classes = (
        authentication.BasicAuthentication,
        authentication.TokenAuthentication,
    )
    permission_classes = (
        permissions.IsAuthenticated,
    )
    paginate_by = 25
    paginate_by_param = 'page_size'
    max_paginate_by = 100


class SprintViewSet(viewsets.ModelViewSet):
    """API endpoint for listing and creating sprints."""
    queryset = Sprint.objects.order_by('end')  # sort by end date desc
    serializer_class = SprintSerializer  # appoint it's own serializer


class TaskViewSet(DefaultsMixin, viewsets.ModelViewSet):
    """API endpoint for listing and creating tasks."""
    queryset = Task.objects.all()
    serializer_class = TaskSerializer


class UserViewSet(DefaultsMixin, viewsets.ReadOnlyModelViewSet):  # disallow modification to user in the API endpoints
    """API endpoint for listing users."""
    lookup_field = User.USERNAME_FIELD  # search user by username instead of key id
    lookup_url_kwarg = User.USERNAME_FIELD  # for consistency
    queryset = User.objects.order_by(User.USERNAME_FIELD)
    serializer_class = UserSerializer
