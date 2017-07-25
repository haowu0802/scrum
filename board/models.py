from django.db import models


class Sprint(models.Model):
    """Development iteration period."""

    name = models.CharField(max_length=100, blank=True, default='')
    description = models.TextField(blank=True, default='')
    end = models.DateField(unique=True)  # only one spring can be ended at one moment of time

    def __str__(self):
        return self.name or _('Sprint ending %s') % self.end  # to string
