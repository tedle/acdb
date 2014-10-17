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
