let SplunkSearch = require('./splunk_sched_queries');
let splunkModule = new SplunkSearch();

// Search everything and return the first 10 results
let searchQuery = "search SM_C.appType=\"Native Desktop\" (uaType=sparkmac OR uaType=sparkwindows) " +
"SM_C.key=\"callEnd\"SM_C.value.isWirelessShare=true earliest=-1h " +
"| eval callFailure=if( ('SM_C.value.endReason'=\"wirelessShareTimeoutReached\" OR 'SM_C.value.endReason'=\"cancelledByLocalError\"), 1, 0) " +
"| stats count as total sum(callFailure) as callFailure " +
"| eval SuccessRate=(100 - round(100*callFailure/total,1))";

let wantedResult = ["SuccessRate","callFailure"];
function searchPerhour() {
  splunkModule.splunkSingleRowSearch(wantedResult,searchQuery).then(result => {
    if(result.value[1] < 99) {
      //call bot to send value
    }
    if(result < 80 ){
    }
    console.log("Splunk Result:\n" + result.field[1] +": " + result.value[1])
  });
}
function myFunction() {

}
console.log("this printed immediately before");
//var intervalID = setInterval(searchPerhour, 15000);
searchPerhour();
console.log("this printed after immediately after");
