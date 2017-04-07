let SplunkSearch = require('./splunk_sched_queries');
let request = require('request');
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
    url: "https://doloresbot.azurewebsites.net/v1/faststats/",
    method: 'POST',
    headers: headers,
    form: {
      "field":"",
      "value":"",
      "search_name":"wireless share success rate alert",
      "results_link": "test link",
      "owner":"jperezes",
    }
}

function searchPerhour() {
  splunkModule.splunkSingleRowSearch(wantedResult,searchQuery).then(result => {

    if(result.value[1] < 99) {
      // Start the request
      options.form.field = result.field[1];
      opions.form.value = result.value[1];
      request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          // Print out the response body
          console.log(body)
        }
      })
    }
    if(result < 80 ){
    }
    console.log("Splunk Result:\n" + result.field[1] +": " + result.value[1])
  });
}

request(options, function (error, response, body) {
  console.log("sending post request")
  if (!error && response.statusCode == 200) {
    // Print out the response body
    console.log(body)
  }
})

console.log("this printed immediately before");
//var intervalID = setInterval(searchPerhour, 15000);
//searchPerhour();
console.log("this printed after immediately after");
