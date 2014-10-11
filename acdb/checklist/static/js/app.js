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

acdbApp.controller('ChecklistController', ['$scope', 'date', 'encyclopedia', 'saveData', 
function($scope, date, encyclopedia, saveData) {
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
        fish: encyclopedia.fish(),
        bugs: encyclopedia.bugs()
    };
    $scope.saveData = saveData;
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

    this.bugs = function(){
        return get('/api/bug/all');
    }
    this.fish = function(){
        return get('api/fish/all');
    }
}]);

acdbApp.service('date', [
function () {
    var date = new Date();
    var monthOffset = 0;
    var dateOffset = 0;
    var hoursOffset = 0;
    this.get = function() {
        date = new Date();
        date.setMonth(date.getMonth()+monthOffset);
        date.setDate(date.getDate()+dateOffset);
        date.setHours(date.getHours()+hoursOffset);
        return date;
    }
    this.incMonth = function(num) {
        monthOffset += num;
    }
    this.incDate = function(num) {
        dateOffset += num;
    }
    this.incHours = function(num) {
        hoursOffset += num;
    }
    this.offsetAsHours = function() {
        return 1000;
    }
}]);

acdbApp.service('encyclopedia', ['acdbApi', 'Species',
function(acdbApi, Species) {
    // Need local vars with getters and setters because promises cant see 'this'
    var fish = new Array();
    var bugs = new Array();

    this.fish = function() {
        return fish;
    }
    this.bugs = function() {
        return bugs;
    }

    // Need to update arrays manually to keep obj reference
    acdbApi.fish().then(function (data){
        data.forEach(function(f) {
            fish[f.slot-1] = f;
        });
    });
    acdbApi.bugs().then(function (data){
        data.forEach(function(b) {
            bugs[b.slot-1] = b;
        });
    });
}]);

acdbApp.service('saveData', ['date', 'encyclopedia',
function (date, encyclopedia) {
    var BASE64_REPLACE_SET = [
        ['/', '_'],
        ['+', '-'],
        ['=', '.']
    ];
    var NUM_FISH = 64;
    var NUM_BUGS = 64;

    this.save = function() {
        var fish = encyclopedia.fish();
        var bugs = encyclopedia.bugs();
        var hoursOffset = date.offsetAsHours();
        var saveStr = this.encodeSaveStr(fish, bugs, hoursOffset);
    }

    this.load = function() {
    }

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
        offsetBits = unpackInt(hoursOffset);
        saveBits = fishCaught.concat(bugsCaught, offsetBits);

        // Packing
        var rawSaveStr = "";
        for (var i = 0; i < saveBits.length; i += 8) {
            var byteArray = saveBits.slice(i, i + 8);
            rawSaveStr += String.fromCharCode(packByte(byteArray));
        }

        return encodeSafeBase64(rawSaveStr);
    }

    this.decodeSaveStr = function(saveStr) {
        var fish = encyclopedia.fish();
        var bugs = encyclopedia.bugs();
        var fishCaught = new Array(NUM_FISH);
        var bugsCaught = new Array(NUM_BUGS);
        var hoursOffset = 0;
        var rawSaveStr = decodeSafeBase64(saveStr);
        var saveBits = new Array();

        if (fish.length != fishCaught.length || bugs.length != bugsCaught.length) {
            throw "[LoadData]: Unexpected number of species";
        }

        angular.forEach(rawSaveStr, function(b) {
            var byteArray = unpackByte(b);
            saveBits = saveBits.concat(byteArray);
        });

        if (saveBits.length != fish.length + bugs.length + 32) {
            throw "[LoadData]: Corrupted save data";
        }

        // Repackage savedata
        saveBits.slice(0, fish.length).forEach(function(f, i) {
            fishCaught[i] = Boolean(f);
        });
        saveBits.slice(fish.length, fish.length + bugs.length).forEach(function(b, i) {
            bugsCaught[i] = Boolean(b);
        });
        unpackedHours = saveBits.slice(fish.length + bugs.length);
        hoursOffset = packInt(unpackedHours);

        var unpackedData = {
            fish: fishCaught,
            bugs: bugsCaught,
            hours: hoursOffset
        };
        return unpackedData;
    }

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
        var packedInt = 0 | 0;
        for(var i = 0; i < 32; i++) {
            packedInt |= unpackedInt[i] << 31-i;
        }
        return packedInt;
    }

    function unpackInt(packedInt) {
        // | 0 to force int
        packedInt |= 0;
        var unpackedInt = new Array(32);
        for(var i = 0; i < 32; i++) {
            unpackedInt[i] = Boolean((packedInt >> 31-i) & 1);
        }
        return unpackedInt;
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
