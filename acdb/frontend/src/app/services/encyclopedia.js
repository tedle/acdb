// --- encyclopedia.js ---------------------------------------------------------
// Service for getting, storing, and providing species data

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

    // Hook for controllers to do something when loading is finished
    this.loaded = function() {
        return apiDeferred;
    };

    // Using $q.all so this.loaded is only triggered when both bugs & fish finish
    var apiDeferred = $q.all({
        fish: acdbApi.fish(),
        bugs: acdbApi.bugs()
    }).then(function(results) {
        // Need to update species arrays manually to keep obj reference
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
