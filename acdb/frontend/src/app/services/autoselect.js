// --- autoselect.js -----------------------------------------------------------
// Directive for text boxes that select all input on click

acdbApp.directive('autoSelect', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            element.on('click', function () {
                this.select();
            });
        }
    };
});
