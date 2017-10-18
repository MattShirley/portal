from django.conf.urls import include, url
from django.core.urlresolvers import reverse
from designsafe.apps.potree import views

urlpatterns = [
    url(r'^.*$', views.index, name='index'),

]
