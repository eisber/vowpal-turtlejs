'use strict';
var fs = require('fs');
var readline = require('readline');

/*
 * JS Implementation of MurmurHash3 (r136) (as of May 20, 2011)
 * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
 * @author <a href="mailto:aappleby@gmail.com">Austin Appleby</a>
 */
var murmurhash3_32_gc = function murmurhash3_32_gc(key, seed) {
    var remainder, bytes, h1, h1b, c1, c1b, c2, c2b, k1, i;

    remainder = key.length & 3; // key.length % 4
    bytes = key.length - remainder;
    h1 = seed;
    c1 = 0xcc9e2d51;
    c2 = 0x1b873593;
    i = 0;

    while (i < bytes) {
        k1 =
            ((key.charCodeAt(i) & 0xff)) |
            ((key.charCodeAt(++i) & 0xff) << 8) |
            ((key.charCodeAt(++i) & 0xff) << 16) |
            ((key.charCodeAt(++i) & 0xff) << 24);
        ++i;

        k1 = ((((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16))) & 0xffffffff;
        k1 = (k1 << 15) | (k1 >>> 17);
        k1 = ((((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16))) & 0xffffffff;

        h1 ^= k1;
        h1 = (h1 << 13) | (h1 >>> 19);
        h1b = ((((h1 & 0xffff) * 5) + ((((h1 >>> 16) * 5) & 0xffff) << 16))) & 0xffffffff;
        h1 = (((h1b & 0xffff) + 0x6b64) + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16));
    }

    k1 = 0;

    switch (remainder) {
        case 3:
            k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
        case 2:
            k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
        case 1:
            k1 ^= (key.charCodeAt(i) & 0xff);

            k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
            k1 = (k1 << 15) | (k1 >>> 17);
            k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
            h1 ^= k1;
    }

    h1 ^= key.length;

    h1 ^= h1 >>> 16;
    h1 = (((h1 & 0xffff) * 0x85ebca6b) + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
    h1 ^= h1 >>> 13;
    h1 = ((((h1 & 0xffff) * 0xc2b2ae35) + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16))) & 0xffffffff;
    h1 ^= h1 >>> 16;

    return h1 >>> 0;
}
/**
 * @param {String} file - vw --readable_file output
 * @param {Function} cb - callback once the file is loaded, takes the loaded model as only argument
 */
var readModel = function readModel(file, cb) {
    const instream = fs.createReadStream(file)
    var rl = readline.createInterface(instream)

    let loaded = undefined;
    let inHeader = true;
    let hash = [];
    let oaa = 1;
    let bits = 0;
    rl.on('line', function (line) {

        if (inHeader) {
            if (line.startsWith("bits:")) {
                bits = parseInt(line.split(":")[1])
                hash = new Float32Array(1 << bits);
            }
            if (line.startsWith('options:')) {
                let splitted = line.split(':');
                let options = splitted[1].split(" ");
                for (let i = 0; i < options.length; i += 2) {
                    if (options[i] == '--oaa') {
                        oaa = parseInt(options[i + 1])
                    }
                }
            }
            if (line == ":0") {
                inHeader = false;
            }
        } else {
            var splitted = line.split(":")
            hash[parseInt(splitted[0])] = parseFloat(splitted[1])
        }
    });
    rl.on('close', function (line) {
        let multiClassBits = 0;
        let ml = oaa;
        while (ml > 0) {
            multiClassBits++;
            ml >>= 1;
        }
        cb({
            hash: hash,
            oaa: oaa,
            multiclassBits: multiClassBits,
            mask: (1 << bits) - 1
        })
    });
}

/**
 * makes a prediction from a request and a model
 * the request is { namespaces: [{name: 'some_namespace', features: [{name: 'some_feature', value: 1}]}]}
 * @example
 * var vw = require('turtlejs')
 * vw.readModel('readable_model.txt', (model) => {
 *     var prediction = vw.predict(model, {
 *         namespaces: [{
 *             name: 'something',
 *             features: [{
 *                 name: 'a',
 *                 value: 1
 *             }, {
 *                 name: 'b',
 *                 value: 1
 *             }, {
 *                 name: 'c',
 *                 value: 1
 *             }]
 *         }]
 *     });
 *     console.log(prediction)
 * });
 * 
 * @param {Object} model - mode loaded from @see readModel
 * @param {Object} request - {.namespaces - array of namespaces, each of which has array of features}
 * @returns {Float32Array} prediction, one prediction per class (depending on oaa, by default 1)
 */
var predict = function predict(model, request) {
    var out = new Float32Array(model.oaa);
    for (let ns of request.namespaces) {
        let nsHash = murmurhash3_32_gc(ns.name, 0);
        for (let f of ns.features) {
            let featureHash = murmurhash3_32_gc(f.name, nsHash);
            for (let klass = 0; klass < model.oaa; klass++) {
                let bucket = ((featureHash << model.multiClassBits) | klass) & model.mask;
                out[klass] += f.value * model.hash[bucket];
            }
        }
    }
    return out;
}
module.exports = {
    readModel: readModel,
    predict: predict,
};
