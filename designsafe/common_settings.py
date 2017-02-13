"""
Django settings for designsafe project.

Generated by 'django-admin startproject' using Django 1.8.3.

For more information on this file, see
https://docs.djangoproject.com/en/1.8/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.8/ref/settings/
"""
# -*- coding: utf-8 -*-

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
import os
import json
gettext = lambda s: s
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.8/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', '__CHANGE_ME_!__')

# SESSIONS
SESSION_COOKIE_DOMAIN = os.environ.get('SESSION_COOKIE_DOMAIN')
# SESSION_ENGINE = 'redis_sessions.session'
# SESSION_REDIS_HOST = 'redis'
SESSION_EXPIRE_AT_BROWSER_CLOSE = True

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DJANGO_DEBUG', 'False') == 'True'

ALLOWED_HOSTS = ['*']
# Application definition

INSTALLED_APPS = (
    'djangocms_admin_style',
    'djangocms_text_ckeditor',
    'cmsplugin_cascade',
    'cmsplugin_cascade.extra_fields',

    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.sites',
    'django.contrib.sitemaps',
    'django.contrib.staticfiles',

    'djng',
    'cms',
    'treebeard',
    'menus',
    'sekizai',
    'djangocms_style',
    'djangocms_file',
    'djangocms_flash',
    'djangocms_googlemap',
    'djangocms_picture',
    'djangocms_video',
    'djangocms_forms',

    'pipeline',
    'filer',
    'reversion',
    'bootstrap3',
    'termsandconditions',
    'impersonate',
    'captcha',

    #websockets
    'ws4redis',

    # custom
    'designsafe.apps.auth',
    'designsafe.apps.api',
    'designsafe.apps.api.notifications',
    'designsafe.apps.accounts',
    'designsafe.apps.cms_plugins',
    'designsafe.apps.box_integration',
    'designsafe.apps.dropbox_integration',
    'designsafe.apps.licenses',

    # signals
    'designsafe.apps.signals',

    # Designsafe apps
    'designsafe.apps.applications',
    'designsafe.apps.data',
    'designsafe.apps.djangoRT',
    'designsafe.apps.notifications',
    'designsafe.apps.workspace',
    'designsafe.apps.user_activity',
    'designsafe.apps.token_access',
    'designsafe.apps.search',
    'designsafe.apps.geo'
)

AUTHENTICATION_BACKENDS = (
    'designsafe.apps.auth.backends.AgaveOAuthBackend',
    'designsafe.apps.auth.backends.TASBackend',
    'django.contrib.auth.backends.ModelBackend',
)

LOGIN_REDIRECT_URL = '/account/'

CACHES = {
  'default': {
      'BACKEND': 'django.core.cache.backends.memcached.MemcachedCache',
      'LOCATION': 'memcached:11211',
  },
}

MIDDLEWARE_CLASSES = (
    'djng.middleware.AngularUrlMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.auth.middleware.SessionAuthenticationMiddleware',
    'designsafe.apps.token_access.middleware.TokenAuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'designsafe.apps.auth.middleware.AgaveTokenRefreshMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django.middleware.locale.LocaleMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'cms.middleware.user.CurrentUserMiddleware',
    'cms.middleware.page.CurrentPageMiddleware',
    'cms.middleware.toolbar.ToolbarMiddleware',
    'cms.middleware.language.LanguageCookieMiddleware',
    'impersonate.middleware.ImpersonateMiddleware',
    'designsafe.middleware.DesignSafeTermsMiddleware',
)

ROOT_URLCONF = 'designsafe.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            os.path.join(BASE_DIR, 'designsafe', 'templates'),
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.contrib.auth.context_processors.auth',
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.template.context_processors.i18n',
                'django.template.context_processors.media',
                'django.template.context_processors.static',
                'django.template.context_processors.tz',
                'sekizai.context_processors.sekizai',
                'cms.context_processors.cms_settings',
                'ws4redis.context_processors.default',
                'designsafe.context_processors.analytics',
                'designsafe.context_processors.debug',
                'designsafe.context_processors.messages',
                'designsafe.apps.auth.context_processors.auth',
                'designsafe.apps.cms_plugins.context_processors.cms_section',
            ],
        },
    },
]

WSGI_APPLICATION = 'designsafe.wsgi.application'


# Database
# https://docs.djangoproject.com/en/1.8/ref/settings/#databases

if os.environ.get('DATABASE_HOST'):
    # mysql connection
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': os.environ.get('DATABASE_NAME'),
            'HOST': os.environ.get('DATABASE_HOST'),
            'PORT': os.environ.get('DATABASE_PORT'),
            'USER': os.environ.get('DATABASE_USER'),
            'PASSWORD': os.environ.get('DATABASE_PASSWORD'),
        },
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
        }
    }

from nees_settings import NEES_USER_DATABASE
if NEES_USER_DATABASE['NAME']:
    DATABASES['nees_users'] = NEES_USER_DATABASE


# Internationalization
# https://docs.djangoproject.com/en/1.8/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True

LANGUAGES = [
    ('en-us', 'English'),
]


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.8/howto/static-files/

STATIC_URL = '/static/'

STATIC_ROOT = '/var/www/designsafe-ci.org/static/'
STATIC_URL = '/static/'

STATICFILES_DIRS = (
    os.path.join(BASE_DIR, 'designsafe', 'static'),
)

STATICFILES_STORAGE = 'pipeline.storage.PipelineCachedStorage'

STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
    'pipeline.finders.PipelineFinder',
)

MEDIA_ROOT = '/var/www/designsafe-ci.org/media/'
MEDIA_URL = '/media/'

CMS_PERMISSION = True

CMS_TEMPLATES = (
    ('cms_homepage.html', 'Homepage Navigation'),
    ('ef_cms_page.html', 'EF Site Page'),
    ('cms_page.html', 'Main Site Page'),
)

CMSPLUGIN_CASCADE_PLUGINS = (
    'cmsplugin_cascade.bootstrap3',
    'cmsplugin_cascade.link',
)

CMSPLUGIN_CASCADE_ALIEN_PLUGINS = (
    'TextPlugin',
    'StylePlugin',
    'FilerImagePlugin',
    'FormPlugin',
    'MeetingFormPlugin',
    'ResponsiveEmbedPlugin',
)

MIGRATION_MODULES = {
    'djangocms_flash': 'djangocms_flash.migrations_django',
    'djangocms_file': 'djangocms_file.migrations_django',
    'djangocms_googlemap': 'djangocms_googlemap.migrations_django',
    'djangocms_inherit': 'djangocms_inherit.migrations_django',
    'djangocms_link': 'djangocms_link.migrations_django',
    'djangocms_picture': 'djangocms_picture.migrations_django',
    'djangocms_teaser': 'djangocms_teaser.migrations_django',
    'djangocms_video': 'djangocms_video.migrations_django',
    'djangocms_style': 'djangocms_style.migrations_django',
}

LOGIN_URL = '/login/'

DJANGOCMS_FORMS_PLUGIN_MODULE = 'Generic'
DJANGOCMS_FORMS_PLUGIN_NAME = 'Form'
DJANGOCMS_FORMS_TEMPLATES = (
    ('djangocms_forms/form_template/default.html', 'Default'),
)
DJANGOCMS_FORMS_USE_HTML5_REQUIRED = False
DJANGOCMS_FORMS_WIDGET_CSS_CLASSES = {
    'text': ('form-control', ),
    'textarea': ('form-control', ),
    'email': ('form-control', ),
    'number': ('form-control', ),
    'phone': ('form-control', ),
    'url': ('form-control', ),
    'select': ('form-control', ),
    'file': ('form-control', ),
    'date': ('form-control', ),
    'time': ('form-control', ),
    'password': ('form-control', ),
}
DJANGOCMS_FORMS_DATETIME_FORMAT = '%d-%b-%Y %H:%M'

#####
#
# Bootstrap3 Settings
#
#####
BOOTSTRAP3 = {
    'required_css_class': 'required',
}


#####
#
# Django Impersonate
#
#####
IMPERSONATE_REQUIRE_SUPERUSER = True


#####
#
# Logger config
#
#####
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'default': {
            'format': '[DJANGO] %(levelname)s %(asctime)s %(module)s '
                      '%(name)s.%(funcName)s:%(lineno)s: %(message)s'
        },
        'agave': {
            'format': '[AGAVE] %(levelname)s %(asctime)s %(module)s '
                      '%(name)s.%(funcName)s:%(lineno)s: %(message)s'
        },
        'metrics': {
            'format': '[METRICS] %(levelname)s %(module)s %(name)s.%(funcName)s:%(lineno)s:'
                      ' %(message)s user=%(user)s sessionId=%(sessionId)s op=%(operation)s'
                      ' info=%(info)s'
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'default',
        },
        'opbeat': {
            'level': 'ERROR',
            'class': 'logging.StreamHandler',
        },
        'metrics': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'metrics',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'opbeat'],
            'level': 'INFO',
            'propagate': True,
        },
        'designsafe': {
            'handlers': ['console', 'opbeat'],
            'level': 'DEBUG',
        },
        'dsapi': {
            'handlers': ['console', 'opbeat'],
            'level': 'DEBUG',
        },
        'celery': {
            'handlers': ['console', 'opbeat'],
            'level': 'DEBUG',
        },
        'opbeat': {
            'handlers': ['console'],
            'level': 'INFO',
        },
        'metrics': {
            'handlers': ['metrics'],
            'level': 'INFO',
        },
    },
}


EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.environ.get('SMTP_HOST', 'localhost')
EMAIL_PORT = os.environ.get('SMTP_PORT', 25)
EMAIL_HOST_USER = os.environ.get('SMTP_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'no-reply@designsafe-ci.org')
MEETING_REQUEST_EMAIL = os.environ.get('MEETING_REQUEST_EMAIL', 'info@designsafe-ci.org')

###
# Terms and Conditions
#
DEFAULT_TERMS_SLUG = 'terms'

###
# Pipeline
#
PIPELINE_COMPILERS = (
    'pipeline.compilers.sass.SASSCompiler',
)
PIPELINE_SASS_ARGUMENTS = '-C'
PIPELINE_CSS_COMPRESSOR = None
PIPELINE_JS_COMPRESSOR = 'pipeline.compressors.slimit.SlimItCompressor'

PIPELINE_CSS = {
    'vendor': {
        'source_filenames': (
            'vendor/bootstrap-ds/css/bootstrap.css',
            'vendor/bootstrap-datepicker/dist/css/bootstrap-datepicker3.css',
            'vendor/font-awesome/css/font-awesome.css',
            'vendor/angular-toastr/dist/angular-toastr.css',
            'vendor/slick-carousel/slick/slick.css',
            'vendor/slick-carousel/slick/slick-theme.css'
        ),
        'output_filename': 'css/vendor.css',
    },
    'main': {
        'source_filenames': (
            'styles/typekit.css',
            'styles/main.css',
            'styles/corner-ribbon.css',
            'styles/base.scss',
            'styles/nested-list-group.scss',
        ),
        'output_filename': 'css/main.css',
    },
}

PIPELINE_JS = {
    'vendor': {
        'source_filenames': (
            'vendor/modernizr/modernizr.js',
            'vendor/jquery/dist/jquery.js',
            'vendor/bootstrap-ds/js/bootstrap.js',
            'vendor/bootstrap-datepicker/dist/js/bootstrap-datepicker.min.js',
        ),
        'output_filename': 'js/vendor.js',
    },
    'main': {
        'source_filenames': (
            'scripts/utils.js',
            'scripts/dateinput.js',
            'scripts/navbar.js',
        ),
        'output_filename': 'js/main.js',
    },
}

###
# Opbeat Integration
#
if os.environ.get('OPBEAT_ORGANIZATION_ID'):
    INSTALLED_APPS += (
        'opbeat.contrib.django',
    )

    OPBEAT = {
        'ORGANIZATION_ID': os.environ.get('OPBEAT_ORGANIZATION_ID', ''),
        'APP_ID': os.environ.get('OPBEAT_APP_ID', ''),
        'SECRET_TOKEN': os.environ.get('OPBEAT_SECRET_TOKEN', ''),
    }

    MIDDLEWARE_CLASSES = (
        'opbeat.contrib.django.middleware.OpbeatAPMMiddleware',
    ) + MIDDLEWARE_CLASSES

    LOGGING['handlers']['opbeat'] = {
        'level': 'ERROR',
        'class': 'opbeat.contrib.django.handlers.OpbeatHandler'
    }

##
# django-websockets-redis
#
WSGI_APPLICATION = 'ws4redis.django_runserver.application'
WEBSOCKET_URL = '/ws/'
WS4REDIS_CONNECTION = {
    'host': 'redis',
}
WS4REDIS_EXPIRE = 0

###
# Celery settings
#
BROKER_URL = 'redis://redis:6379/0'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERYD_LOG_FORMAT ='[DJANGO] $(processName)s %(levelname)s %(asctime)s %(module)s %(name)s.%(funcName)s:%(lineno)s: [%(task_name)s(%(task_id)s)]%(message)s'

###
# Analytics
#
GOOGLE_ANALYTICS_PROPERTY_ID = os.environ.get('GOOGLE_ANALYTICS_PROPERTY_ID', False)

###
# Agave Integration
#
# Agave Tenant Configuration
AGAVE_TENANT_ID = os.environ.get('AGAVE_TENANT_ID')
AGAVE_TENANT_BASEURL = os.environ.get('AGAVE_TENANT_BASEURL')
#
# Agave Client Configuration
AGAVE_CLIENT_KEY = os.environ.get('AGAVE_CLIENT_KEY')
AGAVE_CLIENT_SECRET = os.environ.get('AGAVE_CLIENT_SECRET')
AGAVE_TOKEN_SESSION_ID = os.environ.get('AGAVE_TOKEN_SESSION_ID', 'agave_token')

AGAVE_SUPER_TOKEN = os.environ.get('AGAVE_SUPER_TOKEN')

AGAVE_STORAGE_SYSTEM = os.environ.get('AGAVE_STORAGE_SYSTEM')

PROJECT_STORAGE_SYSTEM_TEMPLATE = {
    'id': 'project-{}',
    'site': 'tacc.utexas.edu',
    'default': False,
    'status': 'UP',
    'description': '{}',
    'name': '{}',
    'globalDefault': False,
    'available': True,
    'public': False,
    'type': 'STORAGE',
    'storage': {
        'mirror': False,
        'port': 22,
        'homeDir': '/',
        'protocol': 'SFTP',
        'host': 'dtn01.prod.agaveapi.co',
        'publicAppsDir': None,
        'proxy': None,
        'rootDir': '/corral-repl/tacc/NHERI/projects/{}',
        'auth': json.loads(os.environ.get('PROJECT_SYSTEM_STORAGE_CREDENTIALS', '{}'))
    }
}

from external_resource_settings import *
from elasticsearch_settings import *
from rt_settings import *
