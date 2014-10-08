var acdbApp = angular.module('acdbApp', [
    'ngRoute'
]);

acdbApp.config(['$routeProvider', '$locationProvider',
function($routeProvider, $locationProvider) {
    $routeProvider.
    when('/', { controller: 'checklistController', templateUrl: 'static/partials/index.html'}).
    otherwise({ redirectTo: '/'});

    // Removes /#/ from URL
    $locationProvider.html5Mode(true);
}]);

acdbApp.service('acdbApi', ['$http',
function($http) {
    this.bug = function(){
        return $http.get('/api/bug/all');
    }
    this.fish = function(){
        return $http.get('/api/fish/all');
    }
}]);

acdbApp.controller('checklistController', ['$scope', 'acdbApi',
function($scope, acdbApi) {
    $scope.test = {
        words: "hey hio hey :)",
    };

    $scope.sort = {
        order: ['slot'],
        reverse: false,

        set: function(order) {
            // Dirty hack to compare 2 string arrays
            if (this.order.toString() == order.toString()) {
                $scope.sort.reverse = !this.reverse;
            }
            else {
                $scope.sort.reverse = false;
            }
            $scope.sort.order = order;
        }
    };

    $scope.species = {
        fish: {},
        bug: {}
    };

    acdbApi.fish().success(function (data){
        angular.forEach(data, function(fish, key) {
            fish.caught = false;
        });
        $scope.species.fish = data;
    });
}]);
