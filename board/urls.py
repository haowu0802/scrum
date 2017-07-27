"""
the url routing for view sets of django rest framework, extended from django routing
"""
from rest_framework.routers import DefaultRouter

from . import views  # where the view sets are defined

router = DefaultRouter(trailing_slash=False)  # for consistency with backbone's url format
# register each view sets
router.register(r'sprints', views.SprintViewSet)
router.register(r'tasks', views.TaskViewSet)
router.register(r'users', views.UserViewSet)
