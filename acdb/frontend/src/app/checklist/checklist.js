// --- checklist.js ------------------------------------------------------------
// Controller providing a to-do list of fish & bugs caught

acdbApp.controller('ChecklistController', ['$scope', 'date', 'encyclopedia', 'saveData', 
function($scope, date, encyclopedia, saveData) {
    // Error states incase API calls fail, can be shown in the view
    $scope.error = {
        api: false
    };

    $scope.date = date;

    // Sort functions for re-ordering table data
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

    // Insert species into scope
    $scope.species = {
        fish: encyclopedia.fish(),
        bugs: encyclopedia.bugs()
    };

    // Load save data after API requests complete
    encyclopedia.loaded().then(function() {
        saveData.load();
    }, function(error) {
        $scope.error.api = true;
    });

    // Watch checkboxes & date for auto-save feature
    $scope.$watch('species', function() {
        saveData.save();
    }, true);
    $scope.$watch('date.offsetAsHours()', function() {
        saveData.save();
    }, true);

    // Need saveData.url() to provide export link
    $scope.saveData = saveData;
}]);
