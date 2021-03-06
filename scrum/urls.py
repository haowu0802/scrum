"""scrum URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.11/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.conf.urls import url, include
    2. Add a URL to urlpatterns:  url(r'^blog/', include('blog.urls'))
"""
from django.conf.urls import url, include  # for including the url routing from django-rest-framework
from django.contrib import admin
from rest_framework.authtoken.views import obtain_auth_token

from board.urls import router  # django-rest routing

from django.views.generic import TemplateView  # generic page view

urlpatterns = [
    url(r'^api/token/', obtain_auth_token, name='api-token'),  # an API token getter
    url(r'^api/', include(router.urls)),  # django rest routing, API end points view sets
    url(r'^$', TemplateView.as_view(template_name='board/index.html')),  # for the single page template
    url(r'^admin/', admin.site.urls),  # just for debugging
]
