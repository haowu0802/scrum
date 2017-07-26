from rest_framework import serializers  # serializers lib from django-rest

from rest_framework.reverse import reverse  # for producing links for resource
from datetime import date  # for date validation
from django.utils.translation import ugettext_lazy as _  # make error message translatable

from .models import Sprint, Task, Profile  # the board models
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
            'tasks': reverse('task-list',  # get tasks belongs to this Sprint
                             request=request) + '?sprint={}'.format(obj.pk),
        }

    def validate_end(self, field):
        """make sure end date is not in the past,
        setting an end date in the past for a Sprint make the Sprint unfinishable and invalid """
        end_date = field
        new = not self.instance  # when creating a new one
        changed = self.instance and self.instance.end != end_date  # and changing the end field
        if (new or changed) and (end_date < date.today()):
            msg = _('End date cannot be in the past.')
            raise serializers.ValidationError(msg)  # raise exception when making end date into the past
        return field


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

    def validate_sprint(self, data):
        """make sure that:
         1. a completed task cannot be changed to another sprint
         2. an existing task cannot be changed to a past sprint
         3. a new task cannot be added to a past sprint"""
        sprint = data
        if self.instance and self.instance.pk:
            if sprint != self.instance.sprint:
                if self.instance.status == Task.STATUS_DONE:
                    msg = _('Cannot change the sprint of a completed task.')
                    raise serializers.ValidationError(msg)
                if sprint and sprint.end < date.today():
                    msg = _('Cannot assign tasks to past sprints.')
                    raise serializers.ValidationError(msg)
        else:
            if sprint and sprint.end < date.today():
                msg = _('Cannot add tasks to past sprints.')
                raise serializers.ValidationError(msg)
        return data

    def validate(self, attrs):
        """make sure that:
        1. a task in backlog have Not Started status
        2. Started date cannot be set for not started tasks.
        3. Completed date cannot be set for uncompleted tasks."""
        sprint = attrs.get('sprint')
        status = int(attrs.get('status'))
        started = attrs.get('started')
        completed = attrs.get('completed')
        if not sprint and status != Task.STATUS_TODO:
            msg = _('Backlog tasks must have "Not Started" status.')
            raise serializers.ValidationError(msg)
        if started and status == Task.STATUS_TODO:
            msg = _('Started date cannot be set for not started tasks.')
            raise serializers.ValidationError(msg)
        if completed and status != Task.STATUS_DONE:
            msg = _('Completed date cannot be set for uncompleted tasks.')
            raise serializers.ValidationError(msg)
        return attrs

class UserSerializer(serializers.ModelSerializer):

    # function from user model, an interface for user model and custom user inherited auth.models
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    links = serializers.SerializerMethodField()  # links to related resource

    class Meta:
        model = User
        fields = ('id', User.USERNAME_FIELD, 'full_name',
                  'is_active', 'links',)

    # link Profile data with User
    def create(self, validated_data):
        profile_data = validated_data.pop('profile', None)
        user = super(UserSerializer, self).create(validated_data)
        self.update_or_create_profile(user, profile_data)
        return user

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', None)
        self.update_or_create_profile(instance, profile_data)
        return super(UserSerializer, self).update(instance, validated_data)

    def update_or_create_profile(self, user, profile_data):
        # This always creates a Profile if the User is missing one;
        # change the logic here if that's not right for your app
        Profile.objects.update_or_create(user=user, defaults=profile_data)

    def get_links(self, obj):
        """produce links to related resource"""
        request = self.context['request']
        username = obj.get_username()
        return {
            'self': reverse('user-detail',  # link to detail page of itself
                            kwargs={User.USERNAME_FIELD: username},
                            request=request),  # needed for creating the full url
            'tasks': '{}?assigned={}'.format(  # get tasks assigned to this user
                reverse('task-list', request=request), username)
        }
