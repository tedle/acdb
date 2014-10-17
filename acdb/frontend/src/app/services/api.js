// --- api.js ------------------------------------------------------------------
// Service for accessing backend API and retrieving species data

acdbApp.service('acdbApi', ['$http', '$q', 'Species',
function($http, $q, Species) {
    function get(url) {
        var promise = $http.get(url).
        then(function(response) {
            // Iterate thru API data and create Species object for each.
            // Should probably be doing this in fish() and bugs(), but
            // keeps things a bit more DRY until database is fleshed out
            response.data.forEach(function(animal, index) {
                response.data[index] = new Species(animal.slot, animal.name,
                                                   animal.location, animal.schedule,
                                                   animal.value);
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
