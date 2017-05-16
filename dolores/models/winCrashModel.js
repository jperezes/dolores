var mongoose = require('mongoose');
let Promise= require('bluebird')

var winReportSchema = mongoose.Schema({
    reportDate: String,
    hashA: String,
    title: String,
    method: String,
    feedback_id: String,
    crashes_count: Number,
    client_version: String,
    id:String,
    url: String
});

winReportSchema.static({
	list: function(callback) {
		this.find({}, null, {}, callback);
	}
});

winReportSchema.statics.getCountAndDelete = function (hash) {
  return new Promise((resolve,reject)=>{
    this.find({hashA:hash},function(err,result){
      let roomsIds = [];
      if(err){
        reject(error);
      }
      else if(typeof(result[0]) !== 'undefined'){
        console.dir("crash found count: " + result[0].hashA)
        resolve(result[0].crashes_count)
     }
     else{
       console.log("new Crash saving to database...: " + result.n)
       resolve(0);
     }
  }).remove();
 })
};

//module.exports = mongoose.model('WinReport', winReportSchema);
module.exports = winReportSchema;
