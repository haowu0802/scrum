from django.conf import settings  # for assign task to user
from django.utils.translation import ugettext_lazy as _  # lazy text getter

from django.db import models
from django.contrib.auth.models import User  # for customizing user model
from django.db.models.signals import post_save  # for Profile link
from django.dispatch import receiver  # for decorating User model functions


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    first_name = models.CharField(max_length=50, blank=True)
    last_name = models.CharField(max_length=50, blank=True)
    address_first = models.CharField(max_length=100, blank=True)
    address_second = models.CharField(max_length=50, blank=True)
    city = models.CharField(max_length=40, blank=True)
    state = models.CharField(max_length=20, blank=True)
    zip = models.CharField(max_length=10, blank=True)
    country = models.CharField(max_length=20, default='United States')


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()


class Sprint(models.Model):
    """Development iteration period."""

    name = models.CharField(max_length=100, blank=True, default='')
    description = models.TextField(blank=True, default='')
    end = models.DateField(unique=True)  # only one spring can be ended at one moment of time

    def __str__(self):
        return self.name or _('Sprint ending %s') % self.end  # to string


class Task(models.Model):
    """Unit of work to be done for the sprint."""

    # status code for task
    STATUS_TODO = 1
    STATUS_IN_PROGRESS = 2
    STATUS_TESTING = 3
    STATUS_DONE = 4

    # status text
    STATUS_CHOICES = (
        (STATUS_TODO, _('Not Started')),
        (STATUS_IN_PROGRESS, _('In Progress')),
        (STATUS_TESTING, _('Testing')),
        (STATUS_DONE, _('Done')),
    )

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, default='')
    sprint = models.ForeignKey(Sprint, blank=True, null=True)  # a Task belongs to a Sprint
    status = models.SmallIntegerField(choices=STATUS_CHOICES, default=STATUS_TODO)  # from status code/text
    order = models.SmallIntegerField(default=0)  # for sorting
    assigned = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True)  # only auth user can be assigned task
    started = models.DateField(blank=True, null=True)
    due = models.DateField(blank=True, null=True)
    completed = models.DateField(blank=True, null=True)  # dates for start, due, completion

    def __str__(self):
        return self.name  # to string

