var acdbApp = angular.module('acdbApp', [
    'ngRoute'
]);

acdbApp.config(['$routeProvider', '$locationProvider',
function($routeProvider, $locationProvider) {
    $routeProvider.
    when('/', { controller: 'ChecklistController', templateUrl: 'static/partials/index.html'}).
    otherwise({ redirectTo: '/'});

    // Removes /#/ from URL
    $locationProvider.html5Mode(true);
}]);

acdbApp.service('acdbApi', ['$http', 'species',
function($http, species) {
    function get(url) {
        var promise = $http.get(url).
        then(function(response) {
            response.data.forEach(function(animal) {
                species.clean(animal);
            });
            return response.data;
        }, function(error) {
            return "Failed to grab API data";
        });
        return promise;
    }

    this.bug = function(){
        return get('/api/bug/all');
    }
    this.fish = function(){
        return get('api/fish/all');
    }
}]);

acdbApp.service('species', ['$filter',
function ($filter) {
    this.clean = function(species) {
        species.caught = false;
        species.available = this.isAvailable(species.schedule);
        species.season = this.prettifySeason(species.schedule);
    }

    this.isAvailable = function(schedule) {
        return true;
    }

    this.prettifySeason = function(schedule) {
        var pretty = "";
        angular.forEach(schedule, function(timeslot, index) {
            if (index > 0) {
                pretty += ", "
            }
            date = new Date();
            // July
            if (timeslot.month.start == timeslot.month.end) {
                date.setMonth(timeslot.month.start-1);
                // July 15-31
                if (timeslot.day.start != 1 || timeslot.day.end != 31) {
                    date.setDate(timeslot.day.start);
                    pretty += $filter('date')(date,"MMM d-");
                    date.setDate(timeslot.day.end);
                    pretty += $filter('date')(date,"d ");
                // July
                } else {
                    pretty += $filter('date')(date,"MMM ");
                }
            // July-Sept
            } else {
                date.setMonth(timeslot.month.start-1);
                // July 15-Sept
                if (timeslot.day.start != 1) {
                    date.setDate(timeslot.day.start);
                    pretty += $filter('date')(date,"MMM d-");
                // July-Sept
                } else {
                    pretty += $filter('date')(date,"MMM-");
                }
                date.setMonth(timeslot.month.end-1);
                // July-Sept 15
                if (timeslot.day.end != 31) {
                    date.setDate(timeslot.day.end);
                    pretty += $filter('date')(date,"MMM d ");
                // July-Sept
                } else {
                    pretty += $filter('date')(date,"MMM ");
                }
            }
            // All day
            if (timeslot.hour.start == 0 && timeslot.hour.end == 24) {
                pretty += "(All day)";
            // 4pm-9pm
            } else {
                date.setHours(timeslot.hour.start);
                pretty += angular.lowercase($filter('date')(date,"(ha-"));
                date.setHours(timeslot.hour.end);
                pretty += angular.lowercase($filter('date')(date,"ha)"));
            }
        });
        return pretty;
    }
}]);

acdbApp.controller('ChecklistController', ['$scope', 'acdbApi',
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
            } else {
                $scope.sort.reverse = false;
            }
            $scope.sort.order = order;
        }
    };

    $scope.species = {
        fish: {},
        bug: {}
    };

    acdbApi.fish().then(function (data){
        $scope.species.fish = data;
    });
}]);
