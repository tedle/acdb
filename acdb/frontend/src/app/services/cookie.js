// --- cookie.js ---------------------------------------------------------------
// Service for setting and getting cookies by key

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
