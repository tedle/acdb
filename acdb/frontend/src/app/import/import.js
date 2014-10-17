// --- import.js ---------------------------------------------------------------
// Controller for resolving save-data link and import into cookie

acdbApp.controller('ImportController', ['$scope', '$location', '$routeParams', 'cookie', 'saveData', 
function($scope, $location, $routeParams, cookie, saveData) {
    // Get the save token
    var saveStr = $routeParams.savedata;
    // Validate token
    try {
        saveData.decodeSaveStr(saveStr);
        $scope.saveStr = saveStr;
    } catch (err) {
        $scope.corrupt = true;
    }

    // Button for importing token
    $scope.accept = function() {
        cookie.set('checklist', saveStr, 365);
        $scope.index();
    };
    // Button for rejecting token
    $scope.index = function() {
        $location.path('/');
    };
}]);
