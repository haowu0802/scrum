from rest_framework import serializers  # serializers lib from django-rest

from .models import Sprint  # the Sprint model


class SprintSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sprint
        fields = ('id', 'name', 'description', 'end', )
