var mongoose = require('mongoose');
let Promise= require('bluebird')
//mongoose.set('debug', true);

var winReportSchema = mongoose.Schema({
    reportDate: [String],
    hashA: String,
    title: String,
    method: String,
    feedback_id: String,
    crashes_count: Number,
    client_version: [String],
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
    this.findOne({hashA:hash},function(err,result){
      if(err){
        reject(error);
      }
      else if(result !== null){
        console.log("crash found count: " + result.crashes_count)
        resolve(result);

     } else{
       console.log("new Crash saving to database...: " + result)
       resolve(0);
     }
  });
 })
};
winReportSchema.statics.getCountId = function() {
  return new Promise((resolve,reject)=>{
    this.count({},(err,result)=>{
      if(err){
        reject(err);
      } else {
        resolve(result);
      }
    })
 })
};
//module.exports = mongoose.model('WinReport', winReportSchema);
module.exports = winReportSchema;
