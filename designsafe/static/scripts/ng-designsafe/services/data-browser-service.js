(function(window, angular, $, _) {
  "use strict";

  var module = angular.module('ng.designsafe');

  module.factory('DataBrowserService', ['$rootScope', '$http', '$q', '$uibModal', '$state', 'Django', 'FileListing', 'Logging', function($rootScope, $http, $q, $uibModal, $state, Django, FileListing, Logging) {

    var logger = Logging.getLogger('ngDesignSafe.DataBrowserService');

    /**
     * @type {{busy: boolean, listing: FileListing, selected: Array}}
     */
    var currentState = {
      busy: false,
      listing: null,
      selected: []
    };

    /**
     * Enumeration of event `DataBrowserService::Event` types
     *
     * @readonly
     * @enum {string}
     */
    var eventTypes = {
      FILE_ADDED: 'FileAdded',
      FILE_COPIED: 'FileCopied',
      FILE_MOVED: 'FileMoved',
      FILE_REMOVED: 'FileRemoved',
      FILE_SELECTION: 'FileSelection'
    };

    /**
     * Gets the state of the DataBrowserService.
     *
     * @return {{busy: boolean, listing: FileListing, selected: Array}}
     */
    function state() {
      return currentState;
    }


    /**
     *
     * @param {FileListing[]} files FileListing objects to select
     * @param {boolean} [reset] If true, clears current selection before selecting the passed files.
     */
    function select(files, reset) {
      if (reset) {
        deselect(currentState.selected);
      }
      _.each(files, function(f) {
        f._ui = f._ui || {};
        f._ui.selected = true;
      });
      currentState.selected = _.union(currentState.selected, files);
      notify(eventTypes.FILE_SELECTION, currentState.selected);
    }


    /**
     *
     * @param {FileListing[]} files FileListing objects to de-select
     */
    function deselect(files) {
      _.each(files, function(f) {
        f._ui = f._ui || {};
        f._ui.selected = false;
      });
      currentState.selected = _.difference(currentState.selected, files);
      notify(eventTypes.FILE_SELECTION, currentState.selected);
    }


    /**
     * Tests for the DataBrowser actions allowed on the given file(s) from the current listing.
     *
     * @param {FileListing|FileListing[]} files Files to test
     * @return {{canDownload: {boolean}, canPreview: {boolean}, canViewMetadata: {boolean}, canShare: {boolean}, canCopy: {boolean}, canMove: {boolean}, canRename: {boolean}, canTrash: {boolean}, canDelete: {boolean}}}
     */
    function allowedActions (files) {
      if (! Array.isArray(files)) {
        files = [files];
      }

      var tests = {};
      tests.canDownload = files.length >= 1 && hasPermission('READ', files);
      tests.canPreview = files.length === 1 && hasPermission('READ', files);
      tests.canViewMetadata = files.length === 1 && hasPermission('READ', files);
      tests.canShare = files.length === 1 && $state.current.name === 'myData';
      tests.canCopy = files.length >= 1 && hasPermission('READ', files);
      tests.canMove = files.length >= 1 && hasPermission('WRITE', [currentState.listing].concat(files));
      tests.canRename = files.length === 1 && hasPermission('WRITE', [currentState.listing].concat(files));

      var trashPath = _trashPath();
      tests.canTrash = $state.current.name === 'myData' && files.length >= 1 && currentState.listing.path !== trashPath && ! _.some(files, function(sel) { return isProtected(sel); });
      tests.canDelete = $state.current.name === 'myData' && files.length >= 1 && currentState.listing.path === trashPath;

      return tests;
    }


    /**
     *
     * @param options
     * @param options.system
     * @param options.path
     */
    function browse (options) {
      currentState.busy = true;
      return FileListing.get(options).then(function (listing) {
        currentState.busy = false;
        currentState.listing = listing;
        return listing;
      }, function (err) {
        currentState.busy = false;
        // TODO Toastr error message
        window.alert(err);
      });
    }


    /**
     *
     * @param {FileListing|FileListing[]} files
     * @return {*}
     */
    function copy (files) {
      if (! Array.isArray(files)) {
        files = [files];
      }

      var modal = $uibModal.open({
        templateUrl: '/static/scripts/ng-designsafe/html/modals/data-browser-service-copy.html',
        controller: ['$scope', '$uibModalInstance', 'FileListing', 'data', function ($scope, $uibModalInstance, FileListing, data) {

          $scope.data = data;

          $scope.state = {
            busy: false
          };

          $scope.options = [
            {label: 'My Data', conf: {system: 'designsafe.storage.default', path: ''}},
            {label: 'Shared with me', conf: {system: 'designsafe.storage.default', path: '$SHARE'}},
            {label: 'Projects', conf: {system: 'designsafe.storage.projects', path: ''}}
          ];

          $scope.currentOption = null;
          $scope.$watch('currentOption', function () {
            $scope.state.busy = true;
            FileListing.get($scope.currentOption.conf)
              .then(function (listing) {
                $scope.listing = listing;
                $scope.state.busy = false;
              });

            if ($scope.currentOption.label === 'My Data') {
              $scope.customRoot = null;
            } else {
              $scope.customRoot = {
                name: $scope.currentOption.label,
                href: '#',
                system: $scope.currentOption.conf.system,
                path: $scope.currentOption.conf.path
              };
            }
          });
          $scope.currentOption = $scope.options[0];

          $scope.onBrowse = function ($event, fileListing) {
            $event.preventDefault();
            $event.stopPropagation();

            var system = fileListing.system || fileListing.systemId;
            var path = fileListing.path;
            if (system === 'designsafe.storage.default' && path === '/') {
              path = path + fileListing.name
            }

            $scope.state.busy = true;
            FileListing.get({system: system, path: path})
              .then(function (listing) {
                $scope.listing = listing;
                $scope.state.busy = false;
              });
          };

          $scope.validDestination = function (fileListing) {
            return fileListing && fileListing.permissions && (fileListing.permissions === 'ALL' || fileListing.permissions.indexOf('WRITE') > -1);
          };

          $scope.chooseDestination = function (fileListing) {
            $uibModalInstance.close(fileListing);
          };

          $scope.cancel = function () {
            $uibModalInstance.dismiss();
          };

        }],
        resolve: {
          data: {
            files: files
          }
        }
      });

      return modal.result.then(
        function (result) {
          currentState.busy = true;
          var copyPromises = _.map(files, function (f) {
            deselect([f]);
            return f.copy({path: result.path});
          });
          return $q.all(copyPromises).then(function (results) {
            currentState.busy = false;
            return results;
          });
        }
      );
    }


    // /**
    //  *
    //  */
    // function details () {
    //   throw new Error('not implemented')
    // }


    /**
     * Download files. Returns a promise that is resolved when all downloads have been
     * _started_. Resolved with the download URL for each file.
     *
     * @param {FileListing|FileListing[]} files
     * @return {Promise}
     */
    function download (files) {
      if (! Array.isArray(files)) {
        files = [files];
      }
      var download_promises = _.map(files, function(file) {
        return file.download().then(function (downloadUrl) {

          var link = document.createElement('a');
          link.style.display = 'none';
          link.setAttribute('href', downloadUrl.href);
          link.setAttribute('download', "null");
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          return downloadUrl;
        });
      });
      return $q.all(download_promises);
    }


    /**
     * TODO
     *
     * @returns {*}
     */
    function getFileManagers () {
      return $http.get('/api/files/file-managers/').then(function (resp) {
        return resp.data;
      });
    }


    /**
     *
     * @param {string} permission
     * @param {FileListing|FileListing[]} files
     */
    function hasPermission (permission, files) {
      if (! Array.isArray(files)) {
        files = [files];
      }
      return _.reduce(files, function(memo, file) {
        var pem = file.permissions === 'ALL' || file.permissions.indexOf(permission) > -1;
        if (memo !== null) {
          pem = memo && pem;
        }
        return pem;
      }, null);
    }


    /**
     * This is not a great implementation, need to be more extensible...
     * @param {FileListing} file
     */
    function isProtected (file) {
      if (file.system === 'designsafe.storage.default') {
        if (file.trail.length === 3 && file.name === '.Trash') {
          return true;
        }
      }
      return false;
    }


    /**
     * Create a directory in the current listing directory.
     *
     * @returns {Promise}
     */
    function mkdir () {
      var modal = $uibModal.open({
        templateUrl: '/static/scripts/ng-designsafe/html/modals/data-browser-service-mkdir.html',
        controller: ['$scope', '$uibModalInstance', function($scope, $uibModalInstance) {
          $scope.form = {
            folderName: 'Untitled_folder'
          };

          $scope.doCreateFolder = function($event) {
            $event.preventDefault();
            $uibModalInstance.close($scope.form.folderName);
          };

          $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
          };
        }]
      });

      return modal.result.then(function(folderName) {
        currentState.busy = true;
        currentState.listing.mkdir({
          name: folderName
        }).then(function(newDir) {
          currentState.busy = false;
          notify(eventTypes.FILE_ADDED, newDir);
        }, function(err) {
          // TODO better error handling
          $scope.$emit('designsafe:notify', {
            level: 'warning',
            message: 'Unable to create directory: ' + err.data.message
          });
          logger.error(err);
          currentState.busy = false;
        });
      });
    }


    /**
     *
     * @param {FileListing|FileListing[]} files
     * @returns {Promise}
     */
    function move (files) {
      if (! Array.isArray(files)) {
        files = [files];
      }

      var modal = $uibModal.open({
        templateUrl: '/static/scripts/ng-designsafe/html/modals/data-browser-service-move.html',
        controller: ['$scope', '$uibModalInstance', 'FileListing', 'data', function ($scope, $uibModalInstance, FileListing, data) {

          $scope.data = data;

          $scope.state = {
            busy: false
          };

          $scope.state.busy = true;
          FileListing.get({}).then(function (listing) {
            $scope.listing = listing;
            $scope.state.busy = false;
          });

          $scope.onBrowse = function ($event, fileListing) {
            $event.preventDefault();
            $event.stopPropagation();

            $scope.state.busy = true;
            FileListing.get({system: fileListing.system, path: fileListing.path}).then(function (listing) {
              $scope.listing = listing;
              $scope.state.busy = false;
            });
          };

          $scope.validDestination = function (fileListing) {
            return fileListing && fileListing.permissions && (fileListing.permissions === 'ALL' || fileListing.permissions.indexOf('WRITE') > -1);
          };

          $scope.chooseDestination = function (fileListing) {
            $uibModalInstance.close(fileListing);
          };

          $scope.cancel = function () {
            $uibModalInstance.dismiss();
          };

        }],
        resolve: {
          data: {
            files: files
          }
        }
      });

      return modal.result.then(
        function (result) {
          currentState.busy = true;
          var movePromises = _.map(files, function (f) {
            deselect([f]);
            return f.move({path: result.path});
          });
          return $q.all(movePromises).then(function (results) {
            currentState.busy = false;
            return results;
          });
        }
      );
    }


    /**
     *
     * @param {FileListing} file
     * @return {Promise}
     */
    function preview (file) {
      var modal = $uibModal.open({
        templateUrl: '/static/scripts/ng-designsafe/html/modals/data-browser-service-preview.html',
        controller: ['$scope', '$uibModalInstance', '$sce', 'file', function ($scope, $uibModalInstance, $sce, file) {

          $scope.file = file;
          $scope.busy = true;

          file.preview().then(
            function (data) {
              $scope.previewHref = $sce.trustAs('resourceUrl', data.href);
              $scope.busy = false;
            },
            function (err) {
              $scope.previewError = err.data;
              $scope.busy = false;
            }
          );

          $scope.tests = allowedActions([file]);

          $scope.download = function() {
            download(file);
          };
          $scope.share = function() {
            share(file);
          };
          $scope.copy = function() {
            copy(file);
          };
          $scope.move = function() {
            move(file);
          };
          $scope.rename = function() {
            rename(file);
          };
          $scope.viewMetadata = function() {
            viewMetadata(file);
          };
          $scope.trash = function() {
            trash(file);
          };
          $scope.rm = function() {
            rm(file);
          };

          $scope.close = function () {
            $uibModalInstance.dismiss();
          };

        }],
        size: 'lg',
        resolve: {
          file: function() { return file; }
        }
      });

      return modal.result;
    }


    /**
     *
     * @param {FileListing} file
     * @return {Promise}
     */
    function rename (file) {
      var modal = $uibModal.open({
        templateUrl: '/static/scripts/ng-designsafe/html/modals/data-browser-service-rename.html',
        controller: ['$scope', '$uibModalInstance', 'file', function ($scope, $uibModalInstance, file) {
          $scope.form = {
            targetName: file.name
          };

          $scope.file = file;

          $scope.doRenameFile = function($event) {
            $event.preventDefault();
            $uibModalInstance.close({file: file, renameTo: $scope.form.targetName});
          };

          $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
          };
        }],
        resolve: {
          file: file
        }
      });

      return modal.result.then(function (result) {
        currentState.busy = true;
        return result.file.rename({name: result.renameTo})
          .then(
            function (result) {
              currentState.busy = false;
            },
            function (err) {
              logger.error(err);
              currentState.busy = false;
            });
      });
    }


    /**
     *
     * @param {FileListing|FileListing[]} files
     * @return {Promise}
     */
    function rm (files) {
      if (! Array.isArray(files)) {
        files = [files];
      }

      var modal = $uibModal.open({
        templateUrl: '/static/scripts/ng-designsafe/html/modals/data-browser-service-rm.html',
        controller: ['$scope', '$uibModalInstance', 'files', function ($scope, $uibModalInstance, files) {
          $scope.files = files;

          $scope.confirm = function() {
            $uibModalInstance.close(files);
          };

          $scope.cancel = function() {
            $uibModalInstance.dismiss();
          };
        }],
        resolve: {
          files: function() { return files; }
        }
      });

      return modal.result.then(
        function (files) {
          currentState.busy = true;
          var deletePromises = _.map(files, function (file) {
            return file.rm();
          });
          return $q.all(deletePromises).then(
            function (result) {
              currentState.busy = false;
              return result;
            },
            function (err) {
              logger.error(err);
              currentState.busy = false;
            }
          )
        }
      );
    }


    /**
     * TODO
     *
     * @param options
     */
    function search (options) {
      throw new Error('not implemented')
    }


    /**
     * Update sharing permissions on a file.
     *
     * @param {FileListing} file
     * @return {*}
     */
    function share (file) {
      var modal = $uibModal.open({
        templateUrl: '/static/scripts/ng-designsafe/html/modals/data-browser-service-share.html',
        controller: ['$scope', '$uibModalInstance', 'Django', 'UserService', 'file', function ($scope, $uibModalInstance, Django, UserService, file) {
          $scope.data = {
            busy: true,
            file: file,
            currentUser: Django.user,
            permissionOptions: [
              {permission: 'READ', label: 'Read Only'},
              {permission: 'READ_WRITE', label: 'Read/Write'},
              {permission: 'ALL', label: 'All'},
              {permission: 'NONE', label: 'None (Revoke Permission)'}
            ]
          };

          $scope.form = {
            currentPermissions: [],
            addPermissions: [{
              username: null,
              permission: $scope.data.permissionOptions[0]
            }]
          };

          file.listPermissions().then(
            function (result) {
              $scope.form.currentPermissions = _.chain(result)
                .reject(function (pem) { return pem.username === 'ds_admin' || pem.username === Django.user; })
                .map(
                  function (pem) {
                    if (pem.permission.read) {
                      if (pem.permission.write) {
                        if (pem.permission.execute) {
                          pem.permission = $scope.data.permissionOptions[2];
                        } else {
                          pem.permission = $scope.data.permissionOptions[1];
                        }
                      } else {
                        pem.permission = $scope.data.permissionOptions[0];
                      }
                    } else {
                      pem.permission = $scope.data.permissionOptions[3];
                    }
                    return pem;
                  }
                ).value();
              $scope.form.initialPermissions = angular.copy($scope.form.currentPermissions);
              $scope.data.busy = false;
            },
            function (errResp) {
              $scope.data.busy = false;
              $scope.data.errorMessage = errResp.data;
            }
          );

          $scope.searchUsers = function(q) {
            return UserService.search({q: q})
              .then(function(resp) {
                return resp.data;
              });
          };

          $scope.formatSelection = function($result) {
            if (this.pem.username) {
              return this.pem.username.first_name +
                ' ' + this.pem.username.last_name +
                ' (' + this.pem.username.username + ')' +
                ' <' + this.pem.username.email + '>';
            }
          };

          $scope.addNewPermission = function() {
            $scope.form.addPermissions.push({username: null, permission: $scope.data.permissionOptions[0]});
          };

          $scope.doShareFiles = function($event) {
            $event.preventDefault();

            var pemsToSave = [];

            // Only save existing permissions if the permission changed
            _.each($scope.form.currentPermissions, function (pem) {
              var prev = _.findWhere($scope.form.initialPermissions, {username: pem.username});
              if (prev.permission.permission !== pem.permission.permission) {
                pemsToSave.push({username: pem.username, permission: pem.permission.permission});
              }
            });

            // Format new permissions
            var addPems = _.filter($scope.form.addPermissions, function (pem) {
              return pem.username;
            });
            Array.prototype.push.apply(pemsToSave, _.map(addPems, function (pem) {
              return {
                username: pem.username.username,
                permission: pem.permission.permission
              };
            }));

            // Resolve modal with pems that need to be saved
            $uibModalInstance.close(pemsToSave);
          };

          $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
          };

        }],
        size: 'lg',
        resolve: {
          file: function () { return file; }
        }
      });

      return modal.result.then(function (pemsToSave) {
        currentState.busy = true;
        var sharePromises = _.map(pemsToSave, function (pem) {
          return file.share(pem);
        });
        return $q.all(sharePromises).then(function (results) {
          currentState.busy = false;
          return results;
        });
      });
    }


    /**
     *
     * @param {FileListing|FileListing[]} files The files to move to Trash
     * @return {Promise} A promise that is resolved with the trashed files when _all_ files have been
     * successfully Trashed.
     */
    function trash (files) {
      if (! Array.isArray(files)) {
        files = [files];
      }

      currentState.busy = true;
      var trashPromises = _.map(files, function(file) {
        return file.trash().then(function(trashed) {
          notify(eventTypes.FILE_MOVED, trashed);
          return trashed;
        });
      });
      return $q.all(trashPromises).then(function(val) {
        currentState.busy = false;
        return val
      }, function(err) {
        logger.error(err);
        currentState.busy = false;
      });
    }


    function _trashPath() {
      if (currentState.listing && currentState.listing.system) {
        switch (currentState.listing.system) {
          case 'designsafe.storage.default':
            return ['', Django.user, '.Trash'].join('/');
          case 'designsafe.storage.projects':
            var projectDir = currentState.listing.path.split('/')[1];
            return ['', projectDir, '.Trash'].join('/');
          default:
            return undefined;
        }
      }
      return undefined;
    }


    /**
     * Upload files or folders to the currently listed destination
     *
     * @param {boolean} directoryUpload
     * @param {FileList} [files] Initial selected file(s) to upload
     */
    function upload(directoryUpload, files) {
      var modal = $uibModal.open({
        templateUrl: '/static/scripts/ng-designsafe/html/modals/data-browser-service-upload.html',
        controller: function ($scope, $q, $uibModalInstance, Modernizr, directoryUpload, destination, files) {

          $scope.data = {
            destination: destination,
            selectedFiles: files || [],
            uploads: []
          };

          $scope.state = {
            uploading: false,
            retry: false,
            directoryUpload: directoryUpload,
            directoryUploadSupported: Modernizr.fileinputdirectory
          };

          $scope.$watch('data.selectedFiles', function(newValue) {
            _.each(newValue, function(val) {
              $scope.data.uploads.push({
                file: val,
                state: 'pending',
                promise: null
              });
            });

            // reset file control since we want to allow multiple selection events
            $('#id-choose-files').val(null);
          });

          $scope.upload = function() {
            $scope.state.uploading = true;
            var tasks = _.map($scope.data.uploads, function(upload) {
              upload.state = 'uploading';

              var formData = new window.FormData();
              formData.append('file', upload.file);
              if (upload.file.webkitRelativePath) {
                formData.append('relative_path', upload.file.webkitRelativePath);
              }
              return currentState.listing.upload(formData).then(
                function (resp) {
                  upload.state = 'success';
                  return {status: 'success', response: resp};
                },
                function (err) {
                  upload.state = 'error';
                  upload.error = err.data;
                  return {status: 'error', response: err.data};
                }
              )
            });

            $q.all(tasks).then(function (results) {
              $scope.state.uploading = false;

              currentState.busy = true;
              currentState.listing.fetch().then(function () {
                currentState.busy = false;
              });

              var errors = _.filter(results, function (result) {
                return result.status === 'error';
              });

              if (errors.length > 0) {
                // oh noes...give the user another chance with any errors
                $scope.state.retry = true;
              } else {
                // it's all good; close the modal
                $uibModalInstance.close();
              }
            });
          };

          $scope.retry = function() {
            $scope.data.uploads = _.where($scope.data.uploads, {state: 'error'});
            $scope.upload();
            $scope.state.retry = false;
          };

          /**
           * Remove an upload from the list of staged uploads.
           *
           * @param index
           */
          $scope.removeUpload = function (index) {
            $scope.data.uploads.splice(index, 1);
          };

          /**
           * Clear all staged uploads.
           */
          $scope.reset = function () {
            // reset models
            $scope.data.selectedFiles = [];
            $scope.data.uploads = [];
          };

          /**
           * Cancel and close upload dialog.
           */
          $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
          };
        },
        size: 'lg',
        resolve: {
          directoryUpload: function() { return directoryUpload; },
          destination: function() { return currentState.listing; },
          files: function() { return files; }
        }
      });
    }


    /**
     * TODO
     *
     * @param {FileListing} file The file to view metadata for
     * @return {HttpPromise}
     */
    function viewMetadata (file) {
      var modal = $uibModal.open({
        templateUrl: '/static/scripts/ng-designsafe/html/modals/data-browser-service-view-metadata.html',
        controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
        }]
      });
      return modal.result;
    }



    /**
     * @callback subscribeCallback
     * @param {object} $event
     * @param {object} eventData
     * @param {eventTypes} eventData.type
     * @param {object} eventData.context
     */
    /**
     *
     * @param {object} scope
     * @param {subscribeCallback} callback
     */
    function subscribe(scope, callback) {
      var handler = $rootScope.$on('DataBrowserService::Event', callback);
      scope.$on('$destroy', handler);
    }

    /**
     *
     * @param {eventTypes} eventType The event
     * @param {object} eventContext The object/context of the event. The value of this parameter depends on the `eventType`
     */
    function notify(eventType, eventContext) {
      $rootScope.$emit('DataBrowserService::Event', {
        type: eventType,
        context: eventContext
      });
    }

    return {
      /* properties */
      eventTypes: eventTypes,
      state: state,

      /* functions */
      allowedActions: allowedActions,
      browse: browse,
      copy: copy,
      deselect: deselect,
      // details: details,
      download: download,
      getFileManagers: getFileManagers,
      hasPermission: hasPermission,
      isProtected: isProtected,
      mkdir: mkdir,
      move: move,
      preview: preview,
      rename: rename,
      rm: rm,
      search: search,
      select: select,
      share: share,
      trash: trash,
      upload: upload,
      viewMetadata: viewMetadata,

      /* events */
      subscribe: subscribe,
      notify: notify
    };

  }]);

})(window, angular, jQuery, _);