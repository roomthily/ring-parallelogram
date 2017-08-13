var express = require('express');
var app = express();

var fs = require('fs');
var jsonfile = require('jsonfile'),
    random = require('random-js')(),
    geojson = require('geojson'),
    client = require('node-rest-client').Client;

app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.get('/elevate', (req, res) => {
  // the google elevation api which gives rate limits
  
  
});

const profile_url = 'http://open.mapquestapi.com/elevation/v1/profile';
const key = process.env.MAPQUEST_KEY;

app.get("/elevate_mq", (req, res) => {
  console.log('hello');
  
  // for the request, the mapquest key MUST be a query param 
  // and not in the post body.
  // using post for the charlength of the routes
  
  jsonfile.readFile('./trails.geojson', function(err, data) {
    if (err) {
      console.log(err);
      res.send('nope');
    }
    
    var c = new client();
    
    // let's not process the ones already done
    // (rate- and transaction-limited api)
    data.features.slice(0,2).forEach(function(feature) {
      var fid = feature.properies.id;
      if (fs.existsSync('./.data/' + fid + '.geojson')) {
        return;
      }
      
      // get the elevation and dump the single geojson
      var remapped = feature.geometry.coordinates.map((pt) => {
        return pt[1] + ',' + pt[0];
      }).reduce((i, j) => {
        return i.concat(j);
      }, []).join(',');
      
      
      var args = {
        parameters: {key: key}, // the query params
        data: {
          latLngCollection: remapped,
          inShapeFormat: 'raw'
        }
      };
      
      // if the info.statuscode == 601 or 602, no data for the points
      c.post(profile_url, args, function(mq_data, mq_response) {
        if (mq_data.info.statuscode == 601 || mq_data.info.statuscode == 602) {
          console.log('no elevation data for: ', fid);
          setTimeout(function() {
            console.log('processed ' + fid + ' and waiting...');
          }, 5000);
          return;
        }
        if (mq_data.info.messages.length > 0) {
          console.log('messages?', mq_data.info.messages);
          setTimeout(function() {
            console.log('processed ' + fid + ' and waiting...');
          }, 5000);
          return;
        }
        
        // parse the response and dump to a file
        var new_feature = Array.from(_parse_mq(fid, feature.geometry.coordinates, mq_data));
        var new_geojson = geojson.parse(new_feature, {'LineString': 'points', include: ['id']});
        
        jsonfile.writeFile('./geojsons/' + fid + './geojson', new_geojson, {space: 2}, function(err) {
          console.log('json write err: ', err);
        });
      });
      
      // wait a little bit for the next for the rate-limit
      // that i actually do not know (time-wise or #points in the array-wise)
      setTimeout(function() {
        console.log('processed ' + fid + ' and waiting...');
      }, 5000);
    });
    
    
    console.log(data.features.length);
    var feature = data.features[data.features.length-2];
    res.send(feature);
  });
}); 

app.get('/test', (req, res) => {
  // testing the parser
  var fid = 'blobbo';
  
  
  var inputs = [
    [-105.69107294082642,39.96401374138905],
    [-105.69525718688965,39.94585473665865]
  ];

  var output = {
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
  };
  
  var new_features = Array.from(_parse_mq(fid, inputs, output));
  
  res.send(geojson.parse(new_features, {'LineString': 'points', include: ['id']}));
});

function *_parse_mq(fid, points, data) {
  // points: array[[x,y]]
  // data: response from mapquest
  // remap to a geojson structure with elevation 
  // as a property
  
  var feature = {
    id: fid,
    points: []
  };
  
  var profile = data['elevationProfile'];
  
  for (var i=0; i < points.length; i++) {
    var point = points[i];
    if (profile[i].height != -32768) {
      // that is mapquest's nodata value
      point.push(profile[i].height);
    }
    // to a point of x, y, elev(m)
    feature.points.push(point);
  }
  
  yield feature;
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

// ** an oversight in the geojson
// app.get('/prep', (req, res) => {
//   jsonfile.readFile('./hiking.geojson', function(err, data) {
//     if (err) {
//       console.log(err);
//       res.send('nope');
//     }
    
//     // add a unique id (oops) for the feature set
//     var patched = data.features.map((feature) => {
//       feature.properties.id = random.string(8, '1234567890abcdefghijklmnopqrstuvwxyz');
//       return feature;
//     });
    
//     // write it back out
//     patched = {
//       type: "FeatureCollection",
//       features: patched
//     };
    
//     jsonfile.writeFile('.data/trails.geojson', patched, {spaces: 2}, function(err) {
//       if (err) {
//         console.log('json write err:', err);
//       }
//     });
    
//     res.send(patched);
//   });
// });
