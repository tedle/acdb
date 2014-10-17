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
