from django.conf.urls import patterns, url
from api import views

urlpatterns = patterns(
    '',
    url(r'^cf/(fish)/all$', views.api_species, name='api_fish'),
    url(r'^cf/(bug)/all$', views.api_species, name='api_bugs'),
)
