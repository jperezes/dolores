var colors = require('colors')
const util = require('util')
var extend = util._extend;
var express = require('express')
var clone = require('clone');
var async = require('async');
var bodyParser = require("body-parser");
var https = require('https');
const EventEmitter = require('events')
var callbackListener = 'webhooklistener'

var SparkBot = function(token, port, botdomain)
{
			EventEmitter.call(this)
			const that = this;

			console.log('Constructing SparkBot '.red);
			this.app  = express();
			this.token = token;
			this.port = port;
			this.botdomain = botdomain;
			this.botname =  null;
			this.options = {
			  host: 'api.ciscospark.com',
			  method: 'GET',
			  headers: {
			    'Content-Type': 'application/json; charset=utf-8',
			    'Authorization' : 'Bearer '+ token
			  }
			};

			this.app.get('env')
			this.app.use(bodyParser.urlencoded({ extended: false }));
			this.app.use(bodyParser.json());
			this.app.use(express.static('img'))
			this.app.get('/', function (req, res) {
		  res.send('BOT Initilized')
		})

		this.app.post('/'+callbackListener, function (req, res)
		{
		  console.log('Webhooks API called" '+ JSON.stringify(req.body));

		  if(req.body && req.body.resource == 'messages')
		  {
				var message = req.body.data;

				that.getBotName(function(botname)
				{
					console.log('received botname: '+botname);

					if(message.personEmail != botname)
					{
						that.readMessage(message, function(result)
						{
							var txt = result.text;
							var personId = message.personId;

							that.readPersonDetails(personId, function(personDetails)
							{
								message['message'] = txt;
								message['person'] = personDetails;
								that.emit('message',message);
							});
						})
					}
				})
		  }
			else if(req.body && req.body.resource == 'rooms')
			{
				var message = req.body.data;
				that.emit('rooms',message);
			}
			else if(req.body && req.body.resource == 'memberships')
			{
				var message = req.body.data;
				that.emit('memberships',message);
			}
			else
			{
				var message = req.body.data;
				that.emit('others',message);
			}

		  res.send('webhooks')
		})

		this.app.listen(port, function ()
		{
		  	console.log('Bot started at port'+port)
		})

		this.app.get('/init', function (req, res)
		{
	      that.initializeWeebHooks();
	      res.send('warren started')
		})

		this.getOptions = function() {
        return this.options;
    }

		this.getBotDomain = function() {
				return this.botdomain;
		}

		this.getBotName = function(callback)
		{
				if(that.botname == undefined || that.botname == null )
				{
					that.getMyDetails(function(result){
							that.botname = result['emails'][0];
							console.log('Botname found: '+ that.botname);
							callback(that.botname)
					});
				}
				else
				{
					callback(that.botname)
				}
		}
}

util.inherits(SparkBot, EventEmitter)

SparkBot.prototype.init = function() {
		console.log('Init From SparkBot'.red);
};

SparkBot.prototype.printHelloWorld = function() {
		console.log('Hello World From SparkBot'.red);
};

SparkBot.prototype.initializeWeebHooks = function()
{
		this.deleteAllWebHooks(function(){
			console.log("All registered callbacks deleted");
			this.registerWebHooks()
	}.bind(this));
}

SparkBot.prototype.deleteAllWebHooks = function(doneCallback)
{
    var regWebHooks;
    this.readRegisteredWebHooks(function(result)
    {
        regWebHooks = result;
        this.deleteWebHooks(regWebHooks.items,function(){
            doneCallback();
        })
    }.bind(this));
}

SparkBot.prototype.deleteWebHooks = function(webHooks, doneCallback)
{
		var that = this;
    var queue = async.queue(function (webhook, callback)
    {
      that.deleteWebHook(webhook, function()
      {
        callback();
      });
    }, 5);

    queue.drain = function()
    {
        doneCallback()
    }

    queue.push(webHooks, function (err){});
}

SparkBot.prototype.deleteWebHook = function(webHook, doneCallback)
{
    console.log('deleteWebHook'+JSON.stringify(webHook));
    var optionsCloned = clone(this.getOptions());
    var extendedOptions = extend(optionsCloned, { path: "/v1/webhooks/"+webHook.id });
    extendedOptions['method']='DELETE'
    SparkBot.sendRequest(extendedOptions, doneCallback);
}

SparkBot.prototype.registerWebHooks = function()
{
    var optionsCloned = clone(this.getOptions());
    var extendedOptions = extend(optionsCloned, { path: "/v1/webhooks" });
    var messageData = {'name':'GlobalListener','targetUrl':'http://'+this.getBotDomain()+'/'+callbackListener,'resource':'messages','event':'all'}
    extendedOptions['method']='POST';

    SparkBot.sendRequestWithData(messageData, extendedOptions, function()
    {
        console.log('request sent - registerWebHooks');
    })
}

SparkBot.prototype.getMyDetails = function(callback)
{
    var optionsCloned = clone(this.getOptions());
    var extendedOptions = extend(optionsCloned, { path: "/v1/people/me"});

    SparkBot.sendRequest(extendedOptions, function(result)
    {
        console.log('request sent - getMyDetails');
        callback(result);
    })
}

SparkBot.prototype.sendMessage = function(roomId, txt, callback)
{
    var optionsCloned = clone(this.getOptions());
    var extendedOptions = extend(optionsCloned, { path: "/v1/messages/"});
    extendedOptions['method']='POST';
    var messageData = {'roomId':roomId,'text':txt}

    SparkBot.sendRequestWithData(messageData, extendedOptions, function(result)
    {
        callback(result);
    })
}

SparkBot.prototype.readMessage = function(message, callback)
{
    var optionsCloned = clone(this.getOptions());
    var extendedOptions = extend(optionsCloned, { path: "/v1/messages/"+ message.id });

    SparkBot.sendRequest(extendedOptions, function(result)
    {
        console.log('request sent - readMessage');
        callback(result);
    })
}

SparkBot.prototype.readPersonDetails = function(personId, callback)
{
    var optionsCloned = clone(this.getOptions());
    var extendedOptions = extend(optionsCloned, { path: "/v1/people/"+personId });

    SparkBot.sendRequest(extendedOptions, function(result)
    {
        console.log('request sent - readPersonDetails');
        callback(result);
    })
}

SparkBot.prototype.readRegisteredWebHooks = function(callback)
{
    var optionsCloned = clone(this.getOptions());
    var extendedOptions = extend(optionsCloned, { path: "/v1/webhooks" });

    SparkBot.sendRequest(extendedOptions, function(result)
    {
        console.log('request sent - readRegisteredWebHooks');
        callback(result);
    })
}

SparkBot.sendRequest = function(argOptions, callback)
{
		SparkBot.sendRequestWithData(null, argOptions, callback);
}

SparkBot.sendRequestWithData = function(data, argOptions, callback)
{
    var req = https.request(argOptions, function(res)
    {
      var bodyChunks = [];
      res.setEncoding('utf8');
      res.on('data', function(chunk)
      {
          bodyChunks.push(chunk);
      });

      res.on('end', function()
      {
          var result= {};

          try
          {
            result = JSON.parse(bodyChunks);
          }
          catch (e)
          {
          }
          callback(result);
      });
    });

    req.on('error', function(err){
        console.log( err);
    });

		if(data)
		{
			req.end(JSON.stringify(data));
		}
		else
		{
			req.end();
		}
}

module.exports.SparkBot = SparkBot;
