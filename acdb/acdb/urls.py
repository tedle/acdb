from django.conf.urls import patterns, include, url

urlpatterns = patterns(
    '',
    # Examples:
    # url(r'^$', 'acdb.views.checklist', name='home'),
    # url(r'^blog/', include('blog.urls')),

    #url(r'^admin/', include(admin.site.urls)),
    url(r'^', include('checklist.urls'))
)
