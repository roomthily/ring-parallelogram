var express = require('express');
var app = express();

var jsonfile = require('jsonfile');
var random = require('random-js')();

app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.get("/elevate", (req, res) => {
  console.log('hello');
  
  jsonfile.readFile('./hiking.geojson', function(err, data) {
    if (err) {
      console.log(err);
      res.send('nope');
    }
    
    // remap the geojson coordinates to a lnglat comma-separated string
    // for the parameterized request
    var routes = data.features.slice(0,5).map((feature) => {
      return feature.geometry.coordinates.slice(0,5).map((pt) => {
        return pt[1] + ',' + pt[0];
      }).reduce((i, j) => {
        return i.concat(j);
      }, []).join(',');
    });
    
    console.log(routes);
    
    
    // for the request, the mapquest key MUST be a query param 
    // and not in the post body.
    // using post for the charlength of the routes
    var key = process.env.MAPQUEST_KEY;
    
    console.log(data.features.length);
    var feature = data.features[data.features.length-2];
    res.send(feature);
  });
  
  
}); 

app.get('/prep', (req, res) => {
  jsonfile.readFile('./hiking.geojson', function(err, data) {
    if (err) {
      console.log(err);
      res.send('nope');
    }
    
    // add a unique id (oops) for the feature set
    var patched = data.features.map((feature) => {
      feature.properties.id = random.string(8, '1234567890abcdefghijklmnopqrstuvwxyz');
      return feature;
    });
    
    // write it back out
    patched = {
      type: "FeatureCollection",
      features: patched
    };
    
    jsonfile.writeFile('.data/trails.geojson', patched, {spaces: 2}, function(err) {
      if (err) {
        console.log('json write err:', err);
      }
    });
    
    res.send(patched);
  });
});

function _parse(points, data) {
  // remap to a geojson structure with elevation 
  // as a property
}

/*
http://open.mapquestapi.com/elevation/v1/profile
get

key
latLngCollection: lng,lat,lng,lat


the response:
{
    "elevationProfile": [
        {
            "distance": 0,
            "height": 3604
        },
        {
            "distance": 2.0527,
            "height": 3645
        }
    ],
    "shapePoints": [
        39.964014,
        -105.691073,
        39.945855,
        -105.695257
    ],
    "info": {
        "statuscode": 0,
        "copyright": {
            "imageAltText": "© 2017 MapQuest, Inc.",
            "imageUrl": "http://api.mqcdn.com/res/mqlogo.gif",
            "text": "© 2017 MapQuest, Inc."
        },
        "messages": []
    }
}
*/



// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('listening');
});
