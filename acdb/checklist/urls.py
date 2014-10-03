from django.conf.urls import patterns, url
from checklist import views

urlpatterns = patterns(
    '',
    url(r'^$', views.checklist, name='checklist'),
    url(r'^import/(?P<completion_data>[a-zA-Z0-9]*)$',
        views.import_data, name='import_data'),
)
