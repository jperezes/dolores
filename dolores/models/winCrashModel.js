var mongoose = require('mongoose');
let Promise= require('bluebird')
var md5 = require('md5');
//mongoose.set('debug', true);

var winReportSchema = mongoose.Schema({
    reportDate: [String],
    hashA: String,
    hashC:String,
    title: String,
    channels:[String],
    method: String,
    feedback_id: String,
    crashes_count: Number,
    client_version: [String],
    id:String,
    githubUrl:String,
    usersAfected:[String],
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
    this.findOne({hashC:hash},function(err,result){
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


 winReportSchema.statics.addGitHubUrl = function(crash_id,gitUrl) {
   return new Promise((resolve,reject) =>{
     this.findOne({id:crash_id},function(err, crash) {
         if(err) {
           let reply = "Failed to add the git crash url: " + err;
           reject(reply)
         } else if(crash) {
           if (typeof(crash.githubUrl) !=='undefined' && crash.githubUrl !== gitUrl)  {
             let reply = "there is already a git hub assigned to this crash: " + crash.githubUrl  +
             "\n\n Please close it or set is as dup. Updating crash to new url... ";
             crash.githubUrl = gitUrl ;
             crash.save(function(err) {
               if (err) {
                 console.log("error saving the issue")
               }// do something
             });
             resolve(reply);
           } else {
             crash.githubUrl = gitUrl;
             crash.save(function(err) {
               if (err) {
                 console.log("error saving the issue")
               }// do something
             });
             let reply = "Github issue url added the the crash. \n\nRemember to add \"**hashC:** _hashC_ \" or \"**Crash Id:** _crash id_ \" to the git issue body so I get the updates of it. Thanks ;)";
             resolve(reply)
           }
         }
    })
   })
 }

 winReportSchema.statics.setCrashAsFixedByHash = function (hash_c,version){
   return new Promise((resolve,reject)=>{
       this.findOne({hashC:hash_c},function(err,crash){
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
           let method = item.method;
           method = method.substring(0,5)
           item.hashC = md5(method)
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

 winReportSchema.statics.recalculateId = function () {
     this.list(function(err,result){
       if(err){
       }
       else if(result !== null){
         let i = 1;
         result.forEach(item=>{
           item.id = i;
           item.save(err =>{
             if (err) {
               console.log("error saving the modified id")
             }
           })
           i = i + 1 ;
         })
         console.log(" number of documents recalculated: " + i)
      } else{
        console.log("crash " + crash_id + " doesn't exit!!!!")
      }
   });
 };

 winReportSchema.statics.countByHashC = function () {
     this.distinct('hashC',function(err,result){
       if(err){
       }
       else if(result !== null){
         let i = 0;
         result.forEach(item=>{
           console.log("hash C is:" + item.hashC)
           console.log("crash id is: " + item.id)
           i = i + 1;
         })
         console.log("number of disctinct documents is: " + i)
      } else{
        console.log("crash " + crash_id + " doesn't exit!!!!")
      }
   });
 };

//module.exports = mongoose.model('WinReport', winReportSchema);
module.exports = winReportSchema;
