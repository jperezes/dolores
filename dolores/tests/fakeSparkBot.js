var EventEmitter = require('events');
var clone = require('clone');
var async = require('async');
var bodyParser = require("body-parser");
var emtr = new Emitter();

var SparkBot = function(port,domain) {
    this.port = port;
    this.domain = domain;
    this.options = {
        host: 'test.com',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json; charset=utf-8'
        }
    };

    this.app.get('env')
    this.app.use(bodyParser.urlencoded({
        extended: false
    }));
    this.app.use(bodyParser.json());
    this.app.use(express.static('img'))
    })

    var server = this.app.listen(port, function() {
        console.log(('Bot started at port: ' + port).red)
    })

}

SparkBot.prototype.sendMessage( message, function(){
  var optionsCloned = clone(this.getOptions());
  var extendedOptions = extend(optionsCloned, {
      path: "/v1/messages/"
  });
  extendedOptions['method'] = 'POST';
  var messageData = {
      'roomId': message.roomId,
      'text': message.message
  }

  SparkBot.sendRequestWithData(messageData, extendedOptions, function(result) {
      callback(result);
  })

});
SparkBot.sendRequestWithData = function(data, argOptions, callback) {
    var req = http.request(argOptions, function(res) {
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
