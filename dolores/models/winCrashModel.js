var mongoose = require('mongoose');
let Promise= require('bluebird')
var md5 = require('md5');
//mongoose.set('debug', true);

var winReportSchema = mongoose.Schema({
    reportDate: [String],
    hashA: String,
    hashC:String,
    title: String,
    method: String,
    feedback_id: String,
    crashes_count: Number,
    client_version: [String],
    id:String,
    is_resolved:String,
    assigned_team:String,
    url: String
});

winReportSchema.static({
	list: function(callback) {
		this.find({}, null, {}, callback);
	}
});

winReportSchema.statics.getCrashByHash = function (hash) {
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

winReportSchema.statics.getCrashesByVersion = function (clientVersion) {
  return new Promise((resolve,reject)=>{
    this.find({client_version:clientVersion},function(err,result){
      if(err){
        reject(error);
      }
      else if(typeof(result[0]) !== 'undefined'){
        console.log("crash found: " + result[0].id)
        resolve(result);

     } else{
       console.log("client version " + clientVersion + " has no crashes!!!!")
       resolve(false);
     }
  });
 })
};
winReportSchema.statics.getCrashById = function (crash_id) {
  return new Promise((resolve,reject)=>{
    this.findOne({id:crash_id},function(err,result){
      if(err){
        reject(error);
      }
      else if(result !== null){
        resolve(result);
     } else{
       console.log("crash " + crash_id + " doesn't exit!!!!")
       resolve(false);
     }
  });
 })
};

winReportSchema.statics.setCrashAsFixed = function (crash_id,version){
  return new Promise((resolve,reject)=>{
      this.findOne({id:crash_id},function(err,crash){
        if(err){
          console.log("crash not found")
          resolve(false);
        }else if(crash){
          if (version === "") {
            crash.is_resolved = crash.client_version.sort().slice(-1).pop();
          } else {
            crash.is_resolved = version
          }
          crash.save(function(err) {
            if (err) {
              console.log("error saving the issue")
            }// do something
          });
         resolve(true);
       }
    });
  })
 }

 winReportSchema.statics.calculateMd5Hash = function () {
     this.list(function(err,result){
       if(err){
       }
       else if(result !== null){
         result.forEach(item=>{
           let hash_A = item.hashA;
           hash_A = hash_A.substring(0,265)
           item.hashC = md5(hash_A)
           item.save(err =>{
             if (err) {
               console.log("error saving the modified hash")
             }
           })
         })
      } else{
        console.log("crash " + crash_id + " doesn't exit!!!!")
      }
   });
 };

//module.exports = mongoose.model('WinReport', winReportSchema);
module.exports = winReportSchema;
