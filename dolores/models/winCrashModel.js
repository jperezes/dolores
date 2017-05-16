var mongoose = require('mongoose');
let Promise= require('bluebird')

var winReportSchema = mongoose.Schema({
    reportDate: [String],
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

winReportSchema.statics.sendReport = function(winReport,bot){
  var failureReport = "Win crash received: " +
                    //"\nevent: " + req.body.event +
                    //"\npayload Type: " + req.body.payload_type +
                    "\n\n- **First occurrence:** " + winReport.reportDate[0] +
                    "\n\n- **Last occurrence:** " + winReport.reportDate.slice(-1).pop() +
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
