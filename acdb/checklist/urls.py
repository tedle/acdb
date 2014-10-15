from django.conf.urls import patterns, url
from checklist import views

urlpatterns = patterns(
    '',
    url(r'^$', views.checklist, name='checklist'),
    url(r'^import/[a-zA-Z0-9\.\-\_]+/$', views.checklist, name='import'),
    url(r'^api/cf/(fish)/all$', views.api_species, name='api_species'),
    url(r'^api/cf/(bug)/all$', views.api_species, name='api_species'),
    # url(r'^import/(?P<completion_data>[a-zA-Z0-9]*)$',
    #     views.import_data, name='import_data'),
)
