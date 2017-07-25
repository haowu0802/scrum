from rest_framework import serializers  # serializers lib from django-rest
from rest_framework.reverse import reverse  # for producing links for resource

from .models import Sprint, Task  # the board models
from django.contrib.auth import get_user_model  # to get a clean user model

User = get_user_model()  # a clean user model for Task foreign key


class SprintSerializer(serializers.ModelSerializer):

    links = serializers.SerializerMethodField()  # links to related resource

    class Meta:
        model = Sprint
        fields = ('id', 'name', 'description', 'end', 'links', )

    def get_links(self, obj):
        """produce links to related resource"""
        request = self.context['request']
        return {
            'self': reverse('sprint-detail',  # link to detail page of itself
                            kwargs={'pk': obj.pk},
                            request=request),  # needed for creating the full url
        }


class TaskSerializer(serializers.ModelSerializer):

    # get text for status code, to show text instead of code
    status_display = serializers.SerializerMethodField()
    assigned = serializers.SlugRelatedField(  # replace assigned with user name instead of user key id
        slug_field=User.USERNAME_FIELD,
        required=False,
        read_only=True
    )
    links = serializers.SerializerMethodField()  # links to related resource

    class Meta:
        model = Task
        fields = ('id', 'name', 'description', 'sprint',
                  'status', 'status_display', 'order',
                  'assigned', 'started', 'due', 'completed', 'links', )

    def get_status_display(self, obj):
        return obj.get_status_display()

    def get_links(self, obj):
        """produce links to related resource"""
        request = self.context['request']
        links = {
            'self': reverse('task-detail',  # link to detail page of itself
                            kwargs={'pk': obj.pk},
                            request=request),  # needed for creating the full url
            'sprint': None,  # parent sprint
            'assigned': None  # user assigned
        }
        if obj.sprint_id:
            links['sprint'] = reverse('sprint-detail',  # link to parent sprint
                                      kwargs={'pk': obj.sprint_id},
                                      request=request)
        if obj.assigned:
            links['assigned'] = reverse('user-detail',  # and assigned user
                                        kwargs={User.USERNAME_FIELD: obj.assigned},
                                        request=request)
        return links


class UserSerializer(serializers.ModelSerializer):

    # function from user model, an interface for user model and custom user inherited auth.models
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    links = serializers.SerializerMethodField()  # links to related resource

    class Meta:
        model = User
        fields = ('id', User.USERNAME_FIELD, 'full_name',
                  'is_active', 'links', )

    def get_links(self, obj):
        """produce links to related resource"""
        request = self.context['request']
        username = obj.get_username()
        return {
            'self': reverse('user-detail',  # link to detail page of itself
                            kwargs={User.USERNAME_FIELD: username},
                            request=request),  # needed for creating the full url
        }
