var acdbApp = angular.module('acdbApp', [
    'ngRoute'
]);

acdbApp.config(['$routeProvider', '$locationProvider',
function($routeProvider, $locationProvider) {
    $routeProvider.
    when('/', { controller: 'ChecklistController', templateUrl: 'static/partials/checklist.html'}).
    when('/import/:savedata/', { controller: 'ImportController', templateUrl: 'static/partials/import.html'}).
    otherwise({ redirectTo: '/'});

    // Removes /#/ from URL
    $locationProvider.html5Mode(true);
}]);

acdbApp.controller('ChecklistController', ['$scope', 'date', 'encyclopedia', 'saveData', 
function($scope, date, encyclopedia, saveData) {
    $scope.error = {
        api: false
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

    // Watch checkboxes for auto-save feature
    $scope.$watch('species', function() {
        saveData.save();
    }, true);
    $scope.$watch('date.offsetAsHours()', function() {
        saveData.save();
    }, true);

    $scope.saveData = saveData;
}]);

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

acdbApp.service('acdbApi', ['$http', '$q', 'Species',
function($http, $q, Species) {
    function get(url) {
        var promise = $http.get(url).
        then(function(response) {
            response.data.forEach(function(animal, index) {
                response.data[index] = new Species(animal.slot, animal.name,
                                                   animal.location, animal.schedule,
                                                   animal.value);
                // Doesnt seem worth making 2 inherited classes over such a tiny difference...
                if ('shadow' in animal) {
                    response.data[index].shadow = animal.shadow;
                }
            });
            return response.data;
        }, function(error) {
            return $q.reject(error);
        });
        return promise;
    }

    this.bugs = function(){
        return get('/api/cf/bug/all');
    };
    this.fish = function(){
        return get('api/cf/fish/all');
    };
}]);

acdbApp.service('cookie', [
function() {
    this.set = function(name, value, days) {
        var expiryDate = new Date();
        expiryDate.setTime(expiryDate.getTime() + (days * 24 * 60 * 60 * 1000));
        var expires = 'expires=' + expiryDate.toUTCString();
        document.cookie = name + '=' + value + '; ' + expires;
    };

    this.get = function(name) {
        name += '=';
        var cookieArray = document.cookie.split(';');
        for (var i = 0; i < cookieArray.length; i++) {
            var c = cookieArray[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) != -1) {
                return c.substring(name.length, c.length);
            }
        }
        return '';
    };
}]);

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

acdbApp.service('encyclopedia', ['$q', 'acdbApi', 'Species',
function($q, acdbApi, Species) {
    // Need local vars with getters and setters because promises cant see 'this'
    var fish = [];
    var bugs = [];

    this.fish = function() {
        return fish;
    };
    this.bugs = function() {
        return bugs;
    };

    this.loaded = function() {
        return apiDeferred;
    };

    // Need to update arrays manually to keep obj reference
    var apiDeferred = $q.all({
        fish: acdbApi.fish(),
        bugs: acdbApi.bugs()
    }).then(function(results) {
        results.fish.forEach(function(f) {
            fish[f.slot-1] = f;
        });
        results.bugs.forEach(function(b) {
            bugs[b.slot-1] = b;
        });
    }, function(error) {
        return $q.reject(error);
    });
}]);

acdbApp.service('saveData', ['$location', 'date', 'cookie', 'encyclopedia',
function($location, date, cookie, encyclopedia) {
    var VERSION = 1;
    var BASE64_REPLACE_SET = [
        ['/', '_'],
        ['+', '-'],
        ['=', '.']
    ];
    var NUM_FISH = 64;
    var NUM_BUGS = 64;
    // Ensure we can't save before having loaded our data
    var loaded = false;
    var url = '';

    this.url = function() {
        return url;
    };

    this.setUrl = function(saveStr) {
        var str = $location.protocol() + '://' + $location.host();
        if ($location.port() != 80) {
            str += ':' + $location.port();
        }
        str += '/import/' + saveStr + '/';
        url = str;
    };

    this.save = function() {
        if (loaded) {
            var fish = encyclopedia.fish();
            var bugs = encyclopedia.bugs();
            var hoursOffset = date.offsetAsHours();
            var saveStr = this.encodeSaveStr(fish, bugs, hoursOffset);
            cookie.set('checklist', saveStr, 365);
            this.setUrl(saveStr);
        }
    };

    this.load = function() {
        // Unconditionally set this to true, because I dont wanna code
        // fallbacks for corrupted data, so we just overwrite it instead
        loaded = true;

        var saveStr = cookie.get('checklist');
        this.setUrl(saveStr);
        // First visit
        if (saveStr === '') {
            return;
        }

        data = this.decodeSaveStr(saveStr);

        if (encyclopedia.fish().length != data.fish.length ||
            encyclopedia.bugs().length != data.bugs.length) {
            throw "[LoadData]: Unexpected number of species";
        }

        encyclopedia.fish().forEach(function(fish) {
            fish.caught = data.fish[fish.slot-1];
        });
        encyclopedia.bugs().forEach(function(bug) {
            bug.caught = data.bugs[bug.slot-1];
        });
        date.incHours(data.hours);
    };

    this.encodeSaveStr = function(fish, bugs, hoursOffset) {
        var fishCaught = new Array(NUM_FISH);
        var bugsCaught = new Array(NUM_BUGS);

        if (fish.length != fishCaught.length || bugs.length != bugsCaught.length) {
            throw "[SaveData]: Unexpected number of species";
        }

        // Preparing data
        fish.forEach(function(f) {
            fishCaught[f.slot-1] = Boolean(f.caught);
        });
        bugs.forEach(function(b) {
            bugsCaught[b.slot-1] = Boolean(b.caught);
        });
        offsetBits = packInt(hoursOffset);
        saveBits = fishCaught.concat(bugsCaught, offsetBits);

        // Packing
        var rawSaveStr = '';
        rawSaveStr += String.fromCharCode(VERSION);
        for (var i = 0; i < saveBits.length; i += 8) {
            var byteArray = saveBits.slice(i, i + 8);
            rawSaveStr += String.fromCharCode(packByte(byteArray));
        }

        return encodeSafeBase64(rawSaveStr);
    };

    this.decodeSaveStr = function(saveStr) {
        var version = 0;
        var fishCaught = new Array(NUM_FISH);
        var bugsCaught = new Array(NUM_BUGS);
        var hoursOffset = 0;
        var rawSaveStr = decodeSafeBase64(saveStr);
        var saveBits = [];
        var saveOffset = 0;

        angular.forEach(rawSaveStr, function(b) {
            var byteArray = unpackByte(b);
            saveBits = saveBits.concat(byteArray);
        });

        if (saveBits.length != 8 + NUM_FISH + NUM_BUGS + 32) {
            throw "[LoadData]: Corrupted save data";
        }

        // Repackage savedata
        version = packByte(saveBits.slice(saveOffset, saveOffset + 8));
        saveOffset += 8;
        if (version != VERSION) {
            throw "[LoadData]: Outdated save data";
        }

        saveBits.slice(saveOffset, saveOffset + NUM_FISH).forEach(function(f, i) {
            fishCaught[i] = Boolean(f);
        });
        saveOffset += NUM_FISH;

        saveBits.slice(saveOffset, saveOffset + NUM_BUGS).forEach(function(b, i) {
            bugsCaught[i] = Boolean(b);
        });
        saveOffset += NUM_BUGS;

        var packedHours = saveBits.slice(saveOffset);
        hoursOffset = unpackInt(packedHours);

        var unpackedData = {
            fish: fishCaught,
            bugs: bugsCaught,
            hours: hoursOffset
        };
        return unpackedData;
    };

    function decodeSafeBase64(baseStr) {
        BASE64_REPLACE_SET.forEach(function(r) {
            baseStr = baseStr.split(r[1]).join(r[0]);
        });
        return atob(baseStr);
    }

    function encodeSafeBase64(byteStr) {
        var baseStr = btoa(byteStr);
        BASE64_REPLACE_SET.forEach(function(r) {
            baseStr = baseStr.split(r[0]).join(r[1]);
        });
        return baseStr;
    }

    function packByte(unpackedByte) {
        // | 0 to force int
        var packedByte = 0 | 0;
        for(var i = 0; i < 8; i++) {
            packedByte |= unpackedByte[i] << (7-i);
        }
        return packedByte;
    }

    function unpackByte(packedByte) {
        // Force to int
        packedByte = packedByte.charCodeAt(0);

        var unpackedByte = new Array(8);
        for(var i = 0; i < 8; i++) {
            unpackedByte[i] |= Boolean((packedByte >> (7-i)) & 1);
        }
        return unpackedByte;
    }

    function packInt(unpackedInt) {
        // | 0 to force int
        unpackedInt |= 0;
        var packedInt = new Array(32);
        for(var i = 0; i < 32; i++) {
            packedInt[i] = Boolean((unpackedInt >> 31-i) & 1);
        }
        return packedInt;
    }

    function unpackInt(packedInt) {
        // | 0 to force int
        var unpackedInt = 0 | 0;
        for(var i = 0; i < 32; i++) {
            unpackedInt |= packedInt[i] << 31-i;
        }
        return unpackedInt;
    }
}]);

acdbApp.factory('Species', ['$filter', 'date',
function($filter, date) {
    function Species(slot, name, habitat, schedule, value) {
        this.slot = slot;
        this.name = name;
        this.habitat = habitat;
        this.schedule = schedule;
        this.value = value;
        this.caught = false;
        this.season = prettifySeason(this.schedule);

        this.seasonalCache = {
            date: date.get(),
            data: null
        };
    }

    Species.prototype.seasonalData = function() {
        // Check if cached data is up to date
        var now = date.get();
        if (this.seasonalCache.date.getHours() == now.getHours() &&
            this.seasonalCache.date.getDate() == now.getDate() &&
            this.seasonalCache.date.getMonth() == now.getMonth() &&
            this.seasonalCache.data !== null) {
            return this.seasonalCache.data;
        }

        var seasonal = false;
        var tempSeasonal = false;
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
            // Short availability string
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
        if (tempSeasonal && hourly) {
            availability.code = 2;
            availability.next.month = 0;
            availability.next.hour = 0;
            availability.str = "Now";
        } else if (seasonal) {
            availability.code = 1;
            availability.next.month = 0;
            var tempHour = new Date(date.get());
            tempHour.setHours(tempHour.getHours() + availability.next.hour);
            availability.str = angular.lowercase($filter('date')(tempHour, 'ha'));
        } else {
            availability.code = 0;
            var tempMonth = new Date(date.get());
            tempMonth.setMonth(tempMonth.getMonth() + availability.next.month);
            availability.str = $filter('date')(tempMonth, 'MMM');
        }
        this.seasonalCache.date = date.get();
        this.seasonalCache.data = availability;
        return availability;
    };

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
