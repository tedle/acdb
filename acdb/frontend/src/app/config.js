acdbApp.config(['$routeProvider', '$locationProvider',
function($routeProvider, $locationProvider) {
    $routeProvider.
    when('/', { controller: 'ChecklistController', templateUrl: 'checklist/checklist.html'}).
    when('/import/:savedata/', { controller: 'ImportController', templateUrl: 'import/import.html'}).
    otherwise({ redirectTo: '/'});

    // Removes /#/ from URL
    $locationProvider.html5Mode(true);
}]);
