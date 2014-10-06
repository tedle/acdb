var acdbApp = angular.module('acdbApp', [
    'ngRoute'
]);

acdbApp.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    $routeProvider.
    when('/', { controller: 'checklistController', templateUrl: 'static/partials/index.html'}).
    otherwise({ redirectTo: '/'});

    // Removes /#/ from URL
    $locationProvider.html5Mode(true);
}]);

acdbApp.factory('acdbApi', ['$http', function($http) {
    var service = {};
    service.bug = function(){
        return $http.get('/api/bug/all');
    }
    service.fish = function(){
        return $http.get('/api/fish/all');
    }
    return service;
}]);

acdbApp.controller('checklistController', ['$scope', 'acdbApi',
function($scope, acdbApi) {
    $scope.test = {};
    $scope.test.words = "hio hey :)";
    setTimeout(function() {
    acdbApi.fish().success(function (data){
        $scope.test.words = data;
    });
    }, 1000);
}]);
