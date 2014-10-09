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

acdbApp.controller('ChecklistController', ['$scope', 'acdbApi', 'date',
function($scope, acdbApi, date) {
    $scope.test = {
        words: "hey hio hey :)",
    };

    $scope.date = date;

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

acdbApp.service('acdbApi', ['$http', 'Species',
function($http, Species) {
    function get(url) {
        var promise = $http.get(url).
        then(function(response) {
            response.data.forEach(function(animal, index) {
                response.data[index] = new Species(animal['slot'], animal['name'],
                                                   animal['location'], animal['schedule'],
                                                   animal['value']);
                // Doesnt seem worth making 2 inherited classes over such a tiny difference...
                if ('shadow' in animal) {
                    response.data[index].shadow = animal['shadow'];
                }
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

acdbApp.service('date', [
function () {
    var date = new Date();
    this.get = function() {
        return date;
    }
    this.incMonth = function(num) {
        date.setMonth(date.getMonth()+num);
    }
    this.incDate = function(num) {
        date.setDate(date.getDate()+num);
    }
    this.incHours = function(num) {
        date.setHours(date.getHours()+num);
    }
}]);

acdbApp.factory('Species', ['$filter', 'date',
function ($filter, date) {
    function Species(slot, name, habitat, schedule, value) {
        this.slot = slot;
        this.name = name;
        this.habitat = habitat;
        this.schedule = schedule;
        this.value = value;
        this.caught = false;
        this.season = prettifySeason(this.schedule);

    }

    Species.prototype.isAvailable = function() {
        var seasonal = false;
        var hourly = false;
        angular.forEach(this.schedule, function(timeslot) {
            // Check month range
            var start = new Date(date.get());
            start.setMonth(timeslot.month.start - 1);
            start.setDate(timeslot.day.start);
            var end = new Date(date.get());
            end.setMonth(timeslot.month.end - 1);
            end.setDate(timeslot.day.end);

            if (date.get() >= start && date.get() <= end) {
                seasonal = true;
            } else if ((date.get() >= start || date.get() <= end) &&
                       (timeslot.month.start > timeslot.month.end)) {
                seasonal = true;
            }
            // Check hour range
            var start = new Date(date.get());
            start.setHours(timeslot.hour.start);
            var end = new Date(date.get());
            end.setHours(timeslot.hour.end);

            if (date.get() >= start && date.get() < end) {
                hourly = true;
            } else if ((date.get() >= start || date.get() < end) &&
                       (timeslot.hour.start > timeslot.hour.end)) {
                hourly = true;
            }
            // Reset for next iteration
            if (seasonal != hourly) {
                seasonal = hourly = false;
            }
        }, this);
        return seasonal && hourly;
    }

    function prettifySeason(schedule) {
        var pretty = "";
        angular.forEach(schedule, function(timeslot, index) {
            if (index > 0) {
                pretty += ", "
            }
            season = new Date();
            // All Year
            if (timeslot.month.start == 1 && timeslot.month.end == 12) {
                pretty += "All Year ";
            // July
            } else if (timeslot.month.start == timeslot.month.end) {
                season.setMonth(timeslot.month.start-1);
                // July 15-31
                if (timeslot.day.start != 1 || timeslot.day.end != 31) {
                    season.setDate(timeslot.day.start);
                    pretty += $filter('date')(season,"MMM d-");
                    season.setDate(timeslot.day.end);
                    pretty += $filter('date')(season,"d ");
                // July
                } else {
                    pretty += $filter('date')(season,"MMM ");
                }
            // July-Sept
            } else {
                season.setMonth(timeslot.month.start-1);
                // July 15-Sept
                if (timeslot.day.start != 1) {
                    season.setDate(timeslot.day.start);
                    pretty += $filter('date')(season,"MMM d-");
                // July-Sept
                } else {
                    pretty += $filter('date')(season,"MMM-");
                }
                season.setMonth(timeslot.month.end-1);
                // July-Sept 15
                if (timeslot.day.end != 31) {
                    season.setDate(timeslot.day.end);
                    pretty += $filter('date')(season,"MMM d ");
                // July-Sept
                } else {
                    pretty += $filter('date')(season,"MMM ");
                }
            }
            // All day
            if (timeslot.hour.start == 0 && timeslot.hour.end == 24) {
                pretty += "(All day)";
            // 4pm-9pm
            } else {
                season.setHours(timeslot.hour.start);
                pretty += angular.lowercase($filter('date')(season,"(ha-"));
                season.setHours(timeslot.hour.end);
                pretty += angular.lowercase($filter('date')(season,"ha)"));
            }
        });
        return pretty;
    }

    return Species;
}]);
