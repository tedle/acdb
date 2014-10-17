acdbApp.controller('ImportController', ['$scope', '$location', '$routeParams', 'cookie', 'saveData', 
function($scope, $location, $routeParams, cookie, saveData) {
    var saveStr = $routeParams.savedata;
    try {
        saveData.decodeSaveStr(saveStr);
        $scope.saveStr = saveStr;
    } catch (err) {
        $scope.corrupt = true;
    }

    $scope.accept = function() {
        cookie.set('checklist', saveStr, 365);
        $scope.index();
    };
    $scope.index = function() {
        $location.path('/');
    };
}]);
