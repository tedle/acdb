from django.conf.urls import patterns, url
from checklist import views

urlpatterns = patterns(
    '',
    url(r'^$', views.checklist, name='checklist'),
    url(r'^api/(fish)/all$', views.api_species, name='api_species'),
    url(r'^api/(bug)/all$', views.api_species, name='api_species'),
    # url(r'^import/(?P<completion_data>[a-zA-Z0-9]*)$',
    #     views.import_data, name='import_data'),
)
