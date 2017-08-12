var express = require('express');
var app = express();

var fs = require('fs');
var random = require('random-js')();

app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.get("/elevate", (req, res) => {
  
  
  var url = 'https://cdn.glitch.com/fba00c56-88bc-4a49-9d6e-c91edb55d9ee%2Fhiking.geojson?1502579682756';
  
  
  fs.readFileSync('./assets/hiking.geojson', (err, data) => {
    var j = JSON.parse(data);
    
    var feature = random.pick(j.features);
    
    console.log(feature);
  });
  
}); 


// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
