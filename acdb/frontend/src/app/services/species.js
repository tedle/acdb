// --- species.js --------------------------------------------------------------
// Factory for Species class, to store and manipulate fish or bug data

acdbApp.factory('Species', ['$filter', 'date',
function($filter, date) {
    function Species(slot, name, habitat, schedule, value) {
        // Unique ID, relating to spot at in-game encyclopedia
        this.slot = slot;
        this.name = name;
        this.habitat = habitat;
        // Object data of times available
        this.schedule = schedule;
        this.value = value;
        this.caught = false;
        // Long string describing times available
        this.season = prettifySeason(this.schedule);

        this.seasonalCache = {
            date: date.get(),
            data: null
        };
    }

    // Parses data on when species is available
    // Returns object with summarised info
    // Attempts to cache result as this is called often and is expensive
    Species.prototype.seasonalData = function() {
        // Check if cached data is up to date
        var now = date.get();
        if (this.seasonalCache.date.getHours() == now.getHours() &&
            this.seasonalCache.date.getDate() == now.getDate() &&
            this.seasonalCache.date.getMonth() == now.getMonth() &&
            this.seasonalCache.data !== null) {
            return this.seasonalCache.data;
        }

        // 2 seasonal checks, 1 is stored to know if species is available this month
        var seasonal = false;
        // Other is stored to know if hours & seasons match
        var tempSeasonal = false;
        // If species is available in this time range
        var hourly = false;
        // Return data
        var availability = {
            // 2=available, 1=right month wrong time, 0=wrong month
            code: 0,
            // Time until in season
            next: {
                month: 12,
                hour: 24
            },
            // Short availability string for mobile (dirty place to put this really...)
            str: ''
        };
        angular.forEach(this.schedule, function(timeslot) {
            // Check month range
            var start = new Date(date.get());
            start.setMonth(timeslot.month.start - 1);
            start.setDate(timeslot.day.start);
            var end = new Date(date.get());
            end.setMonth(timeslot.month.end - 1);
            end.setDate(timeslot.day.end);

            if (date.get() >= start && date.get() <= end) {
                seasonal = tempSeasonal = true;
            } else if ((date.get() >= start || date.get() <= end) &&
                       (timeslot.month.start > timeslot.month.end)) {
                seasonal = tempSeasonal = true;
            } else {
                var nextMonth = timeslot.month.start - (date.get().getMonth() + 1);
                // If next season is next year (ie now=dec, next=feb)
                if (nextMonth < 0) {
                    nextMonth += 12;
                }
                if (nextMonth < availability.next.month) {
                    availability.next.month = nextMonth;
                }
            }
            // Check hour range
            start = new Date(date.get());
            start.setHours(timeslot.hour.start);
            end = new Date(date.get());
            end.setHours(timeslot.hour.end);

            if (date.get() >= start && date.get() < end) {
                hourly = true;
            } else if ((date.get() >= start || date.get() < end) &&
                       (timeslot.hour.start > timeslot.hour.end)) {
                hourly = true;
            } else if (tempSeasonal) {
                var nextHour = timeslot.hour.start - date.get().getHours();
                // If next hour range is tomorrow (ie now=11pm, next=4am)
                if (nextHour < 0) {
                    nextHour += 24;
                }
                if (nextHour < availability.next.hour) {
                    availability.next.hour = nextHour;
                }
            }
            // Reset for next iteration
            if (tempSeasonal != hourly) {
                tempSeasonal = hourly = false;
            }
        }, this);
        // Species is available right now
        if (tempSeasonal && hourly) {
            availability.code = 2;
            availability.next.month = 0;
            availability.next.hour = 0;
            availability.str = "Now";
        // Species is available sometime today
        } else if (seasonal) {
            availability.code = 1;
            availability.next.month = 0;
            var tempHour = new Date(date.get());
            tempHour.setHours(tempHour.getHours() + availability.next.hour);
            // Show soonest available time
            availability.str = angular.lowercase($filter('date')(tempHour, 'ha'));
        // Species is unavailable
        } else {
            availability.code = 0;
            var tempMonth = new Date(date.get());
            tempMonth.setMonth(tempMonth.getMonth() + availability.next.month);
            // Show soonest available month
            availability.str = $filter('date')(tempMonth, 'MMM');
        }
        this.seasonalCache.date = date.get();
        this.seasonalCache.data = availability;
        return availability;
    };

    // Takes schedule data and provides human-readable string of availability
    function prettifySeason(schedule) {
        var pretty = "";
        angular.forEach(schedule, function(timeslot, index) {
            if (index > 0) {
                pretty += ", ";
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
                    pretty += $filter('date')(season,'MMM d-');
                    season.setDate(timeslot.day.end);
                    pretty += $filter('date')(season,'d ');
                // July
                } else {
                    pretty += $filter('date')(season,'MMM ');
                }
            // July-Sept
            } else {
                season.setMonth(timeslot.month.start-1);
                // July 15-Sept
                if (timeslot.day.start != 1) {
                    season.setDate(timeslot.day.start);
                    pretty += $filter('date')(season,'MMM d-');
                // July-Sept
                } else {
                    pretty += $filter('date')(season,'MMM-');
                }
                season.setMonth(timeslot.month.end-1);
                // July-Sept 15
                if (timeslot.day.end != 31) {
                    season.setDate(timeslot.day.end);
                    pretty += $filter('date')(season,'MMM d ');
                // July-Sept
                } else {
                    pretty += $filter('date')(season,'MMM ');
                }
            }
            // All day
            if (timeslot.hour.start === 0 && timeslot.hour.end === 24) {
                pretty += "(All day)";
            // 4pm-9pm
            } else {
                season.setHours(timeslot.hour.start);
                pretty += angular.lowercase($filter('date')(season,'(ha-'));
                season.setHours(timeslot.hour.end);
                pretty += angular.lowercase($filter('date')(season,'ha)'));
            }
        });
        return pretty;
    }

    return Species;
}]);
