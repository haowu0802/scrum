from django.shortcuts import render

from rest_framework import authentication, permissions, viewsets  # viewSets related libs for creating resource lists

from .models import Sprint  # the Sprint model
from .serializers import SprintSerializer  # the serializer


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


