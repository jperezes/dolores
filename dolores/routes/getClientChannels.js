let rp = require('request-promise');
let Promise = require('bluebird');

let channels = [process.env.BLUE_URL,process.env.PURPLE_URL,process.env.GREEN_URL,process.env.GOLD_URL]
let options = {
  url:String,
  method: 'GET',
  json: true
}
let versions=[];
let updateVersions = Promise.coroutine(function*(){
  let it = 0;
  for(let url of channels){
    options.url = url
    let channelInfo = yield rp(options) //.then(result => console.log(result))
    versions[it] = channelInfo.versionInfo.version
    console.log(versions[it])
    it = it + 1;
  }
})

updateVersions();
module.exports.updateVersions = updateVersions;
module.exports.versions = versions;
