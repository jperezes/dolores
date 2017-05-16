var mongoose = require('mongoose');
let Promise= require('bluebird')

var winReportSchema = mongoose.Schema({
    firstReportDate: String,
    lastReportDate:String,
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
        let res={
          firstReportDate:"",
          crashes_count:0
        }
        res.firstReportDate = result[0].firstReportDate;
        res.crashes_count=result[0].crashes_count;
        resolve(res)
     }
     else{
       console.log("new Crash saving to database...: " + result.n)
       resolve(0);
     }
  }).remove();
 })
};

winReportSchema.statics.sendReport = function(winReport,bot){
  var failureReport = "Win crash received: " +
                    //"\nevent: " + req.body.event +
                    //"\npayload Type: " + req.body.payload_type +
                    "\n\n- **First occurrence:** " + winReport.firstReportDate +
                    "\n\n- **Last occurrence:** " + winReport.lastReportDate +
                    "\n\n- **Title:** " + winReport.title +
                    "\n\n- **method affected:** " + winReport.method +
                    "\n\n- **Feedback ID:** " + winReport.feedback_id  +
                    "\n\n- **Crashes Count:** " + winReport.crashes_count +
                    "\n\n- **Client Version:** " + winReport.client_version +
                    //"\nimpacted_devices_count: " + req.body.payload.impacted_devices_count +
                    "\n\n- **url to the crash:** " + "[PRT server URK]" + "("+ winReport.url + ")";

    bot.sendRichTextMessage(process.env.JUAN_DOLORES_ROOM_ID,failureReport,function(){
        console.log("message sent to the bot");
    });
}

//module.exports = mongoose.model('WinReport', winReportSchema);
module.exports = winReportSchema;
