var Promise = require('promise');
var splunkjs = require('splunk-sdk');

// Create a Service instance and log in
var service = new splunkjs.Service({
  username:"username",
  password:"password",
  scheme:"https",
  host:"host",
  port:"port"
});

let splunkModule = function(){};

// Set the search parameters--specify a time range
let searchParams = {
};

//this method runs searchQuery in splunk, and returns the values of the expectedFields
splunkModule.prototype.splunkSingleRowSearch = (expectedFields, searchQuery) => {
  // Run a normal search that immediately returns the job's SID
  let splunkResult = {
    "field": [],
    "value":[]
  }
  return new Promise((resolve,reject) =>{
    service.search(
      searchQuery,
      searchParams,
      function(err, job) {
        // Display the job's search ID
        console.log("Job SID: ", job.sid);
        // Poll the status of the search job
        job.track({period: 200}, {
          done: function(job) {
            console.log("Done!");
            // Get the results and print them
            job.results({}, function(err, results, job) {
              let fields = results.fields;
              let rows = results.rows;
              let values = rows[0]; //values extracted from the first row (single row search)
              let k = 0;
              for(var j = 0; j < values.length; j++) {
                let field = fields[j];
                let value = values[j];
                if(expectedFields.indexOf(field) > -1){
                  console.log("value found!!");
                  splunkResult.field[k] = field;
                  splunkResult.value[k] = value;
                  k = k + 1 ;
                }
                resolve(splunkResult);
              }
            });

          },
          failed: function(job) {
            reject("failed to retrieve Splunk Search")
            console.log("Job failed")
          },
          error: function(err) {
            done(err);
          }
        });
      }
    );
  })
};

module.exports = splunkModule;
