from rest_framework import serializers  # serializers lib from django-rest

from .models import Sprint, Task  # the board models
from django.contrib.auth import get_user_model  # to get a clean user model

User = get_user_model()  # a clean user model for Task foreign key


class SprintSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sprint
        fields = ('id', 'name', 'description', 'end', )


class TaskSerializer(serializers.ModelSerializer):

    # get text for status code, to show text instead of code
    status_display = serializers.SerializerMethodField('get_status_display')

    assigned = serializers.SlugRelatedField(  # replace assigned with user name instead of user key id
        slug_field=User.USERNAME_FIELD,
        required=False,
        read_only=True
    )

    class Meta:
        model = Task
        fields = ('id', 'name', 'description', 'sprint',
                  'status', 'status_display', 'order',
                  'assigned', 'started', 'due', 'completed', )

    def get_status_display(self, obj):
        return obj.get_status_display()


class UserSerializer(serializers.ModelSerializer):

    # function from user model, an interface for user model and custom user inherited auth.models
    full_name = serializers.CharField(source='get_full_name', read_only=True)

    class Meta:
        model = User
        fields = ('id', User.USERNAME_FIELD, 'full_name', 'is_active', )
