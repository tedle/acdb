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

acdbApp.controller('checklistController', function($scope) {
    $scope.test = {};
    $scope.test.words = "hello erryone";
});
