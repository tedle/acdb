acdbApp.service('date', ['$interval',
function($interval) {
    var date = new Date();
    var monthOffset = 0;
    var dateOffset = 0;
    var hoursOffset = 0;

    // Update the clock once a minute (only need hourly resolution)
    $interval(this.get, 60 * 1000);

    this.get = function() {
        date = new Date();
        date.setMonth(date.getMonth()+monthOffset);
        date.setDate(date.getDate()+dateOffset);
        date.setHours(date.getHours()+hoursOffset);
        return date;
    };
    this.reset = function() {
        monthOffset = 0;
        dateOffset = 0;
        hoursOffset = 0;
        this.get();
    };
    this.incMonth = function(num) {
        monthOffset += num;
    };
    this.incDate = function(num) {
        dateOffset += num;
    };
    this.incHours = function(num) {
        hoursOffset += num;
    };
    this.offsetAsHours = function() {
        var now = new Date();
        var then = this.get();
        return (then - now) / 1000 / 60 / 60;
    };
}]);
