var colors = require('colors')
var util = require('util')
var extend = util._extend;
var express = require('express')
var clone = require('clone');
var async = require('async');
var bodyParser = require("body-parser");
var https = require('https');
var EventEmitter = require('events').EventEmitter;
var callbackListener = 'webhooklistener'

var SparkBot = function(token, port, botdomain) {
    EventEmitter.call(this)
    console.log('Constructing SparkBot '.red);
    this.app = express();
    this.token = token;
    this.port = port;
    this.botdomain = botdomain;
    this.botname = null;
    this.options = {
        host: 'api.ciscospark.com',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': 'Bearer ' + token
        }
    };

    this.app.get('env')
    this.app.use(bodyParser.urlencoded({
        extended: false
    }));
    this.app.use(bodyParser.json());
    this.app.use(express.static('img'))
    this.app.get('/', function(req, res) {
        res.send('BOT Initilized')
    })

    this.app.post('/' + callbackListener, function(req, res) {
        console.log(('Webhooks API called" ' + JSON.stringify(req.body)).red);

        if (req.body && req.body.resource == 'messages') {
            var message = req.body.data;

            this.getBotName(function(botname) {
                console.log('received botname: ' + botname);

                if (message.personEmail != botname) {
                    this.readMessage(message, function(result) {
                        var txt = result.text;
                        var personId = message.personId;

                        this.readPersonDetails(personId, function(personDetails) {
                            message['message'] = txt;
                            message['person'] = personDetails;
                            this.emit('message', message);
                        }.bind(this));
                    }.bind(this))
                }
            }.bind(this))
        } else if (req.body && req.body.resource == 'rooms') {
            var message = req.body.data;
            this.emit('rooms', message);
        } else if (req.body && req.body.resource == 'memberships') {
            var message = req.body.data;
            this.emit('memberships', message);
        } else {
            var message = req.body.data;
            this.emit('others', message);
        }

        res.send('')
    }.bind(this))

    var server = this.app.listen(port, function() {
        console.log(('Bot started at port: ' + port).red)
    })

    this.app.get('/init', function(req, res) {
        this.initializeWeebHooks();
        res.send('bot re-initialized')
    }.bind(this))

    this.getOptions = function() {
        return this.options;
    }

    this.getBotDomain = function() {
        return this.botdomain;
    }

    this.getBotName = function(callback) {
        if (this.botname == undefined || this.botname == null) {
            this.getMyDetails(function(result) {
                this.botname = result['emails'][0];
                console.log('Botname found: ' + this.botname);
                callback(this.botname)
            });
        } else {
            callback(this.botname)
        }
    }

    this.getPort = function()
    {
        return port;
    }
}

util.inherits(SparkBot, EventEmitter)

SparkBot.prototype.getServer= function() {
    return this.app;
};


SparkBot.prototype.init = function() {
    console.log('Init From SparkBot'.red);
};

SparkBot.prototype.printHelloWorld = function() {
    console.log('Hello World From SparkBot'.red);
};

SparkBot.prototype.initializeWeebHooks = function() {
    this.deleteAllWebHooks(function() {
        console.log("All registered callbacks deleted");
        this.registerWebHooks()
    }.bind(this));
}

SparkBot.prototype.deleteAllWebHooks = function(doneCallback) {
    var regWebHooks;
    this.readRegisteredWebHooks(function(result) {
        regWebHooks = result;
        this.deleteWebHooks(regWebHooks.items, function() {
            doneCallback();
        })
    }.bind(this));
}

SparkBot.prototype.deleteWebHooks = function(webHooks, doneCallback) {

    var queue = async.queue(function(webhook, callback) {
        this.deleteWebHook(webhook, function() {
            callback();
        });
    }.bind(this), 5);

    queue.drain = function() {
        doneCallback()
    }

    queue.push(webHooks, function(err) {});
}

SparkBot.prototype.deleteWebHook = function(webHook, doneCallback) {
    console.log('deleteWebHook' + JSON.stringify(webHook));
    var optionsCloned = clone(this.getOptions());
    var extendedOptions = extend(optionsCloned, {
        path: "/v1/webhooks/" + webHook.id
    });
    extendedOptions['method'] = 'DELETE'
    SparkBot.sendRequest(extendedOptions, doneCallback);
}

SparkBot.prototype.registerWebHooks = function() {
    var optionsCloned = clone(this.getOptions());
    var extendedOptions = extend(optionsCloned, {
        path: "/v1/webhooks"
    });
    var messageData = {
        'name': 'GlobalListener',
        'targetUrl': 'http://' + this.getBotDomain() +( isNaN(this.getPort()) ? '' : this.getPort() ) +'/' + callbackListener,
        'resource': 'messages',
        'event': 'all'
    }
    extendedOptions['method'] = 'POST';

    SparkBot.sendRequestWithData(messageData, extendedOptions, function() {
        console.log('request sent - registerWebHooks');
    })
}

SparkBot.prototype.getMyDetails = function(callback) {
    var optionsCloned = clone(this.getOptions());
    var extendedOptions = extend(optionsCloned, {
        path: "/v1/people/me"
    });

    SparkBot.sendRequest(extendedOptions, function(result) {
        console.log('request sent - getMyDetails');
        callback(result);
    })
}

SparkBot.prototype.sendMessage = function(roomId, txt, callback) {
    var optionsCloned = clone(this.getOptions());
    var extendedOptions = extend(optionsCloned, {
        path: "/v1/messages/"
    });
    extendedOptions['method'] = 'POST';
    var messageData = {
        'roomId': roomId,
        'text': txt
    }

    SparkBot.sendRequestWithData(messageData, extendedOptions, function(result) {
        callback(result);
    })
}

SparkBot.prototype.sendRichTextMessage = function(roomId, txt, callback) {
    var optionsCloned = clone(this.getOptions());
    var extendedOptions = extend(optionsCloned, {
        path: "/v1/messages/"
    });
    extendedOptions['method'] = 'POST';
    var messageData = {
        'roomId': roomId,
        'markdown': txt
    }
    SparkBot.sendRequestWithData(messageData, extendedOptions, function(result) {
        callback(result);
    })
}

SparkBot.prototype.sendMessageWithFile = function(roomId, txt, filesUrl, callback) {
    var optionsCloned = clone(this.getOptions());
    var extendedOptions = extend(optionsCloned, {
        path: "/v1/messages/"
    });
    extendedOptions['method'] = 'POST';
    var messageData = {
        'roomId': roomId,
        'text': txt,
        'files': filesUrl
    }

    SparkBot.sendRequestWithData(messageData, extendedOptions, function(result) {
        callback(result);
    })
}

SparkBot.prototype.readMessage = function(message, callback) {
    var optionsCloned = clone(this.getOptions());
    var extendedOptions = extend(optionsCloned, {
        path: "/v1/messages/" + message.id
    });

    SparkBot.sendRequest(extendedOptions, function(result) {
        console.log('request sent - readMessage');
        callback(result);
    })
}

SparkBot.prototype.readPersonDetails = function(personId, callback) {
    var optionsCloned = clone(this.getOptions());
    var extendedOptions = extend(optionsCloned, {
        path: "/v1/people/" + personId
    });

    SparkBot.sendRequest(extendedOptions, function(result) {
        console.log('request sent - readPersonDetails');
        callback(result);
    })
}

SparkBot.prototype.readRegisteredWebHooks = function(callback) {
    var optionsCloned = clone(this.getOptions());
    var extendedOptions = extend(optionsCloned, {
        path: "/v1/webhooks"
    });

    SparkBot.sendRequest(extendedOptions, function(result) {
        console.log('request sent - readRegisteredWebHooks');
        callback(result);
    })
}

SparkBot.sendRequest = function(argOptions, callback) {
    SparkBot.sendRequestWithData(null, argOptions, callback);
}

SparkBot.sendRequestWithData = function(data, argOptions, callback) {
    var req = https.request(argOptions, function(res) {
        var bodyChunks = [];
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            bodyChunks.push(chunk);
        });

        res.on('end', function() {
            var result = {};

            try {
                result = JSON.parse(bodyChunks);
            } catch (e) {}
            callback(result);
        });
    });

    req.on('error', function(err) {
        console.log(err);
    });

    if (data) {
        req.end(JSON.stringify(data));
    } else {
        req.end();
    }
}

module.exports.SparkBot = SparkBot;
