from django.conf.urls import patterns, url
from checklist import views

urlpatterns = patterns(
    '',
    url(r'^(?P<completion_data>[a-zA-Z0-9]*)$',
        views.checklist, name='checklist'),
)
