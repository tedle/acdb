// --- date.js -----------------------------------------------------------------
// Service for dealing with time in a way thats more relevant to Animal Crossing

acdbApp.service('date', ['$interval',
function($interval) {
    var date = new Date();
    // Terrible naming scheme, but consistent with Date object...
    var offset = {
        month: 0,
        date: 0,
        hours: 0
    };

    // Update the clock once a minute (only need hourly resolution)
    $interval(this.get, 60 * 1000);

    this.get = function() {
        date = new Date();
        date.setMonth(date.getMonth()+offset.month);
        date.setDate(date.getDate()+offset.date);
        date.setHours(date.getHours()+offset.hours);
        return date;
    };
    this.reset = function() {
        offset.month = 0;
        offset.date = 0;
        offset.hours = 0;
        this.get();
    };
    this.incMonth = function(num) {
        offset.month += num;
    };
    this.incDate = function(num) {
        offset.date += num;
    };
    this.incHours = function(num) {
        offset.hours += num;
    };
    // Needed for storing offset in save data
    this.offsetAsHours = function() {
        var now = new Date();
        var then = this.get();
        return (then - now) / 1000 / 60 / 60;
    };
}]);
