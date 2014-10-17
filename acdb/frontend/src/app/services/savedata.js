// --- savedata.js -------------------------------------------------------------
// Service for storing and retrieving save data
// Stores bugs caught, fish caught, and date offset

acdbApp.service('saveData', ['$location', 'date', 'cookie', 'encyclopedia',
function($location, date, cookie, encyclopedia) {
    var VERSION = 1;
    // Used to make save data URL safe
    var BASE64_REPLACE_SET = [
        ['/', '_'],
        ['+', '-'],
        ['=', '.']
    ];
    // Useful for validation
    var NUM_FISH = 64;
    var NUM_BUGS = 64;
    // Ensure we can't save before having loaded our data
    var loaded = false;
    // Import URL allowing you to store/transfer save data
    var url = '';

    // Getter function to keep scopes up to date
    this.url = function() {
        return url;
    };

    // Builds URL for view
    this.setUrl = function(saveStr) {
        var str = $location.protocol() + '://' + $location.host();
        if ($location.port() != 80) {
            str += ':' + $location.port();
        }
        str += '/import/' + saveStr + '/';
        url = str;
    };

    this.save = function() {
        // Make sure save() can't be called before load()
        // else this would just write empty save data to cookie
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
        // fallbacks for corrupted data, so we just overwrite bad data instead
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

        // Inject saved data into models
        encyclopedia.fish().forEach(function(fish) {
            fish.caught = data.fish[fish.slot-1];
        });
        encyclopedia.bugs().forEach(function(bug) {
            bug.caught = data.bugs[bug.slot-1];
        });
        date.incHours(data.hours);
    };

    // Takes fish caught, bugs caught, and date offset and turns it into
    // a base64 encoded string
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
        // Turn all of our data into a long bitfield array
        saveBits = fishCaught.concat(bugsCaught, offsetBits);

        // Packing
        var rawSaveStr = '';
        rawSaveStr += String.fromCharCode(VERSION);
        // Loop thru bitfield 8-bits at a time, packing into a single byte
        // stored in a string
        // TODO: see what happens if our save data isnt divisible by 8, lol
        for (var i = 0; i < saveBits.length; i += 8) {
            var byteArray = saveBits.slice(i, i + 8);
            rawSaveStr += String.fromCharCode(packByte(byteArray));
        }

        return encodeSafeBase64(rawSaveStr);
    };

    // Takes a base64 encoded string and turns it into model-ready save data
    this.decodeSaveStr = function(saveStr) {
        var version = 0;
        var fishCaught = new Array(NUM_FISH);
        var bugsCaught = new Array(NUM_BUGS);
        var hoursOffset = 0;
        // Get a bytefield of raw save data from base64 string
        var rawSaveStr = decodeSafeBase64(saveStr);
        var saveBits = [];
        var saveOffset = 0;

        // Turn bytefield into bitfield
        angular.forEach(rawSaveStr, function(b) {
            var byteArray = unpackByte(b);
            saveBits = saveBits.concat(byteArray);
        });

        // Validate save data
        if (saveBits.length != 8 + NUM_FISH + NUM_BUGS + 32) {
            throw "[LoadData]: Corrupted save data";
        }

        // Repackage savedata
        version = packByte(saveBits.slice(saveOffset, saveOffset + 8));
        saveOffset += 8;
        if (version != VERSION) {
            throw "[LoadData]: Outdated save data";
        }

        // Fish caught data
        saveBits.slice(saveOffset, saveOffset + NUM_FISH).forEach(function(f, i) {
            fishCaught[i] = Boolean(f);
        });
        saveOffset += NUM_FISH;

        // Bugs caught data
        saveBits.slice(saveOffset, saveOffset + NUM_BUGS).forEach(function(b, i) {
            bugsCaught[i] = Boolean(b);
        });
        saveOffset += NUM_BUGS;

        // Date offset data
        var packedHours = saveBits.slice(saveOffset);
        hoursOffset = unpackInt(packedHours);

        var unpackedData = {
            fish: fishCaught,
            bugs: bugsCaught,
            hours: hoursOffset
        };
        return unpackedData;
    };

    // URL safe base64 decoder
    function decodeSafeBase64(baseStr) {
        BASE64_REPLACE_SET.forEach(function(r) {
            baseStr = baseStr.split(r[1]).join(r[0]);
        });
        return atob(baseStr);
    }

    // URL safe base64 encoder
    function encodeSafeBase64(byteStr) {
        var baseStr = btoa(byteStr);
        BASE64_REPLACE_SET.forEach(function(r) {
            baseStr = baseStr.split(r[0]).join(r[1]);
        });
        return baseStr;
    }

    // Takes 8-bit array and returns 1 byte
    function packByte(unpackedByte) {
        // | 0 to force int
        var packedByte = 0 | 0;
        for(var i = 0; i < 8; i++) {
            packedByte |= unpackedByte[i] << (7-i);
        }
        return packedByte;
    }

    // Takes 1 byte and returns 8-bit array
    function unpackByte(packedByte) {
        // Force to int
        packedByte = packedByte.charCodeAt(0);

        var unpackedByte = new Array(8);
        for(var i = 0; i < 8; i++) {
            unpackedByte[i] |= Boolean((packedByte >> (7-i)) & 1);
        }
        return unpackedByte;
    }

    // Takes 4-byte int and returns 32-bit array
    function packInt(unpackedInt) {
        // | 0 to force int
        unpackedInt |= 0;
        var packedInt = new Array(32);
        for(var i = 0; i < 32; i++) {
            packedInt[i] = Boolean((unpackedInt >> 31-i) & 1);
        }
        return packedInt;
    }

    // Takes 32-bit array and returns 4-byte int
    function unpackInt(packedInt) {
        // | 0 to force int
        var unpackedInt = 0 | 0;
        for(var i = 0; i < 32; i++) {
            unpackedInt |= packedInt[i] << 31-i;
        }
        return unpackedInt;
    }
}]);
