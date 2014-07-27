var q = require('q')
    , dropbox = require("dropbox")
    , extend = require('node.extend');

var Client = function () {
    this._dropboxClientPromise = null
};

Client.prototype.accountInfo = function (options) {
    options = options || {};
    return this._getClient()
        .then(function (client) {
            var deferred = q.defer();
            client.getAccountInfo(options, function (err, stat) {
                err = errorHandler(err);
                if (err) return deferred.reject(err);
                return deferred.resolve(stat);
            });
            return deferred.promise;
        })
};

Client.prototype.checkQuota = function (options) {
    options = options || {};
    return this._getClient()
        .then(function (client) {
            var deferred = q.defer();
            client.getAccountInfo(options, function (err, stat) {
                err = errorHandler(err);
                if (err) return deferred.reject(err);
                return deferred.resolve(stat);
            });
            return deferred.promise;
        })
};

Client.prototype.createFile = function (fileName, parentIdentifier, content_buffer, options) {
    options = options || {};
    var path = createPath(fileName, parentIdentifier);
    return this._getClient()
        .then(function (client) {
            var deferred = q.defer();
            client.writeFile(path, content_buffer, options, function (err, stat) {
                err = errorHandler(err);
                if (err) return deferred.reject(err);
                return deferred.resolve(stat);
            });
            return deferred.promise;
        })
};

Client.prototype.deleteFile = function (identifier) {
    return this._getClient()
        .then(function (client) {
            var deferred = q.defer();
            client.remove(identifier, function (err, stat) {
                err = errorHandler(err);
                if (err) return deferred.reject(err);
                return deferred.resolve(stat);
            });
            return deferred.promise;
        })
};

Client.prototype.downloadFile = function (identifier,options) {
    options = extend({buffer: true}, options || {});
    return this._getClient().then(function (client) {
        var deferred = q.defer();
        client.readFile(identifier, options, function (err, buffer,stat) {
            err = errorHandler(err);
            if (err) return deferred.reject(err);
            return deferred.resolve({data:buffer,stat:stat});
        });
        return deferred.promise;
    })
};

Client.prototype.getFileInformation = function (identifier,options) {
    options = options || {};
    return this._getClient()
        .then(function (client) {
            var deferred = q.defer();
            client.stat(identifier, options, function (err, stat) {
                err = errorHandler(err);
                if (err) return deferred.reject(err);
                return deferred.resolve(stat);
            });
            return deferred.promise;
        })
};

Client.prototype.createFolder = function (folderName, parentIdentifier, options) {
    var path = createPath(folderName, parentIdentifier);
    return this._getClient()
        .then(function (client) {
            var deferred = q.defer();
            client.mkdir(path, function (err, stat) {
                err = errorHandler(err);
                if (err) return deferred.reject(err);
                return deferred.resolve(stat);
            });
            return deferred.promise;
        })
};

Client.prototype.deleteFolder = Client.prototype.deleteFile;

Client.prototype.getFolderInformation = function (identifier, options){
    options = options || {}
    identifier = identifier || '';
    return this._getClient()
        .then(function (client) {
            var deferred = q.defer();
            client.stat(identifier, options, function (err, stat) {
                err = errorHandler(err);
                if (err) return deferred.reject(err);
                return deferred.resolve(stat);
            });
            return deferred.promise;
        })
}

Client.prototype.retrieveFolderItems = function (identifier) {
    identifier = identifier || '';
    var path = createPath(identifier)
    return this._getClient()
        .then(function (client) {
            var deferred = q.defer();
            client.readdir(path, function (err, content_array, folder_stat, content_stat_array) {
                err = errorHandler(err);
                if (err) return deferred.reject(err);
                return deferred.resolve({content_array: content_array, folder_stat: folder_stat, content_stat_array: content_stat_array});
            });
            return deferred.promise;
        })
};

///////////////////////////////////////////////////////////////////////////////
// Event Methods
///////////////////////////////////////////////////////////////////////////////



//TODO: the options should support path_prefix when https://github.com/dropbox/dropbox-js/issues/164
Client.prototype.events = function (cursor,options) {
    return this._getClient()
        .then(function (client) {
            var deferred = q.defer();
            client.delta(cursor, function (err, delta_array) {
                err = errorHandler(err);
                if (err) return deferred.reject(err);
                return deferred.resolve(delta_array);
            });
            return deferred.promise;
        })
};


///////////////////////////////////////////////////////////////////////////////
// Private Methods
///////////////////////////////////////////////////////////////////////////////

Client.prototype._getClient = function() {
    if (this._dropboxClientPromise) return this._dropboxClientPromise;
    var deferred = q.defer();
    var client = new dropbox.Client({
        key: this.config.client_key,
        secret: this.config.client_secret,
        token: this.credentials.access_token
    });
    client.authenticate(function (err, client) {
        if (err) return deferred.reject(err);
        return deferred.resolve(client);
    });
    this._dropboxClientPromise = deferred.promise;
    return this._dropboxClientPromise;
};

function createPath(fileName, parentIdentifier) {
    return (parentIdentifier || '') + fileName
}

function errorHandler(error) {
    if (error) {
        return error;
//        switch (error.status) {
//            case Dropbox.ApiError.INVALID_TOKEN:
//                //var FFTokenRejected = errorTypes.FFTokenRejected;
//                return new Error('User token has expired');
//
//            case Dropbox.ApiError.NOT_FOUND:
//                // The file or folder you tried to access is not in the user's Dropbox.
//                // Handling this error is specific to your application.
//                //var FFItemDoesNotExist = errorTypes.FFItemDoesNotExist;
//                return new Error();
//
//            case Dropbox.ApiError.OVER_QUOTA:
//                // The user is over their Dropbox quota.
//                // Tell them their Dropbox is full. Refreshing the page won't help.
//                //var FFOverQuota = errorTypes.FFOverQuota
//                return new Error();
//
//            case Dropbox.ApiError.RATE_LIMITED:
//                // Too many API requests. Tell the user to try again later.
//                // Long-term, optimize your code to use fewer API calls.
//                var FFRateLimit = errorTypes.FFRateLimit;
//                return new FFRateLimit();
//
//            case Dropbox.ApiError.NETWORK_ERROR:
//                // An error occurred at the XMLHttpRequest layer.
//                // Most likely, the user's network connection is down.
//                // API calls will not succeed until the user gets back online.
//                return error;
//
//            case Dropbox.ApiError.INVALID_PARAM:
//                var FFParameterRejected = errorTypes.FFParameterRejected
//                return new FFParameterRejected();
//            case Dropbox.ApiError.OAUTH_ERROR:
//                var FFTokenRejected = errorTypes.FFTokenRejected
//                return new FFTokenRejected();
//            case Dropbox.ApiError.INVALID_METHOD:
//            default:
//                // Caused by a bug in dropbox.js, in your application, or in Dropbox.
//                // Tell the user an error occurred, ask them to refresh the page.
//                return error;
//        }
    }
    return false;
};


module.exports = Client;