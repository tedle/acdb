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
