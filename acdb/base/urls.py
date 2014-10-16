from django.conf.urls import patterns, url
from base import views

urlpatterns = patterns(
    '',
    url(r'^$', views.base, name='checklist'),
    url(r'^import/[a-zA-Z0-9\.\-\_]+/$', views.base, name='import'),
)
