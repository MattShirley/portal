from django.shortcuts import render, render_to_response
from django.contrib.auth.decorators import login_required
from .mixins import SecureMixin, AgaveMixin, JSONResponseMixin
from django.views.generic.base import View, TemplateView
from django.http import HttpResponse
from requests.exceptions import ConnectionError, HTTPError
from django.conf import settings
import logging

from designsafe.apps.notifications.views import get_number_unread_notifications

logger = logging.getLogger(__name__)

# Create your views here.
class BaseView(SecureMixin, JSONResponseMixin, AgaveMixin, View):
    def __init__(self, **kwargs):
        self.filesystem = None
        self.file_path = None
        self.force_homedir = True
        super(BaseView, self).__init__(**kwargs)

    def dispatch(self, request, *args, **kwargs):
        try:
            return super(BaseView, self).dispatch(request, *args, **kwargs)
        except (ConnectionError, HTTPError) as e:
            logger.error('{}'.format(e.message),
                exc_info = True,
                extra = {
                    'filesystem': self.filesystem,
                    'file_path': self.file_path,
                    'username': request.user.username
                }
                )
            return HttpResponse(e.message, status = 400)

    def set_context_props(self, request, **kwargs):
        #TODO: Getting the filesystem should check in which system is the user in or requesting
        filesystem = kwargs.get('filesystem')
        settings_fs = getattr(settings, 'AGAVE_STORAGE_SYSTEM')
        if self.file_path is None:
            self.file_path = '/'
        if filesystem == 'default':
            self.filesystem = getattr(settings, 'AGAVE_STORAGE_SYSTEM')
            self.force_homedir = True
        else:
            self.filesystem = filesystem
            self.force_homedir = False
        self.file_path = kwargs.get('file_path', None)

        logger.debug('file_path before : {}'.format(self.file_path))
        if self.file_path == '/' and filesystem == 'default':
            self.file_path = request.user.username
        else:
            if len(self.file_path) > 1 and '/' == self.file_path[0]:
                self.file_path = self.file_path[1:]
            if self.force_homedir and filesystem == 'default':
                self.file_path = request.user.username + '/' + self.file_path
                if '/' == self.file_path[-1]:
                    self.file_path = self.file_path[:-1]
        logger.debug('file_path: {}'.format(self.file_path))
        super(BaseView, self).set_context_props(request, **kwargs)

class  BaseTemplate(SecureMixin, TemplateView):
    def get_context_data(self, **kwargs):
        context = super(BaseTemplate, self).get_context_data(**kwargs)
        context['unreadNotifications'] = get_number_unread_notifications(self.request)
        return context
