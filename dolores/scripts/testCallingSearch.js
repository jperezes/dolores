let SplunkSearch = require('./splunk_sched_queries');
let rp = require('request-promise');
let splunkModule = new SplunkSearch();

// Search everything and return the first 10 results
let searchQuery = "search SM_C.appType=\"Native Desktop\" (uaType=sparkmac OR uaType=sparkwindows) " +
"SM_C.key=\"callEnd\"SM_C.value.isWirelessShare=true earliest=-1h " +
"| eval callFailure=if( ('SM_C.value.endReason'=\"wirelessShareTimeoutReached\" OR 'SM_C.value.endReason'=\"cancelledByLocalError\"), 1, 0) " +
"| stats count as total sum(callFailure) as callFailure " +
"| eval SuccessRate=(100 - round(100*callFailure/total,1))";

let wantedResult = ["SuccessRate","callFailure"];

let resultDTO = {
  'search_name':"",
  'result':"",
  'value':"",
  'owner':"",
  'link':""
}
// Set the headers
let headers = {
    'Content-Type': 'application/json'
}
// Configure the request
let options = {
    url: "",
    method: 'POST',
    headers: headers,
    form: {
      field:"",
      value:"",
      search_name:"wireless share success rate alert",
      results_link: "test link",
      owner:"jperezes",
    }
}

function searchPerhour() {
  splunkModule.splunkSingleRowSearch(wantedResult,searchQuery).then(result => {

    if(result.value[1] < 95) {
      // Start the request
      console.log("this is the value to be sent to reuqest" + result.field[1])
      options.form.field = result.field[1];
      options.form.value = result.value[1];
      return options;
    }
    else{
      throw new Error("value inside normal margins")
    }
    console.log("Splunk Result:\n" + result.field[1] +": " + result.value[1])
  }).then(rp).catch(error => console.log("error retrieving the message" + error));
}

console.log("sending hourly ");
//var intervalID = setInterval(searchPerhour, 15000);
searchPerhour();
