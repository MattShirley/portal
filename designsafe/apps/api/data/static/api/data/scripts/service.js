(function(){
    'use strict';
    function filesystem($http, $scope){
        // this should not exists.
        var token = '5db2aa453335dbbd7d5ded8737cc94';
        // Alright, alright, alright from now on.
        var service = {
            getList: getList,
        };
        return service;

        function getList(path){
            return $http({
                method: 'GET',
                url: '/api/v1/data/list-path?token=' + token + '&path=' + path,
            });
            /*.then(function successCallback(response){
                return response.data;
            }, function errorCallback(response){
                return [];
            });*/
        }
    }
    angular.module('ds.api.data')
    .factory('dataAPIService', 
        ['$http', filesystem]);

})();