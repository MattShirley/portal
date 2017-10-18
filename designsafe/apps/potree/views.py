import uuid
import os
import json
import StringIO
from datetime import datetime
from PIL import Image
from django.core.urlresolvers import reverse
from django.http import JsonResponse, HttpResponseRedirect, HttpResponseNotFound, HttpResponseBadRequest
from django.shortcuts import render
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth import get_user_model, models

import logging

logger = logging.getLogger(__name__)
metrics_logger = logging.getLogger('metrics')




def index(request):
    return render(request, 'designsafe/apps/potree/index.html')
