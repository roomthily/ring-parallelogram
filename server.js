var express = require('express');
var app = express();

var fs = require('fs');
var jsonfile = require('jsonfile'),
    random = require('random-js')(),
    geojson = require('geojson'),
    client = require('node-rest-client').Client;

app.use(express.static('public'));
app.use('/geojsons', express.static('geojsons'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  // response.sendFile(__dirname + '/views/index.html');
  response.sendFile(__dirname + '/views/extruded.html');
});
app.get("/trails.geojson", function (request, response) {
  response.sendFile(__dirname + '/trail_elevations.geojson');
});

app.get('/merge', (req, res) => {
  // merge any geojsons (that aren't empty) into one
  // file for easier cesium viz
  fs.readdir('./geojsons', function(err, files) {
    var features = [];
    var l = files.length;
    console.log('num files: ',files.length);
    files.forEach(function(f) {
      var stats = fs.statSync('./geojsons/'+f);
      console.log(f, stats.size);

      l--;
      
      if (stats.size > 0) {
        console.log('ok++', l);
        var s = fs.readFileSync('./geojsons/' + f);
        if (s) {
          var data = JSON.parse(s);
          features.push(data);
        }
      }
      if (l < 1) { _f(res, features);}      
    });
  });
});

function _f(res, features) {
  console.log(features.length);
  var output = {type: "FeatureCollection", features: features};
  jsonfile.writeFile('./trail_elevations.geojson', output);
  
  res.send('maybe done');
}

app.get('/elevate', (req, res) => {
  // the google elevation api which gives rate limits
  
  var url = 'https://maps.googleapis.com/maps/api/elevation/json';
  var key = process.env.GOOGLE_KEY;
  
  // https://developers.google.com/maps/documentation/elevation/usage-limits
  // 512 pts per location
  // 50 req/sec
  // 2,500 req a day -> might be 2,500 *pts* per day
  //
  // locations=
  // lat,lng|lat,lng
  
  var c = new client();
  
  // build the request (get?locations=&key=)
  jsonfile.readFile('./trails.geojson', function(err, data) {
    data.features.forEach(function(feature) {
      var fid = feature.properties.id;
      if (fs.existsSync('./geojsons/' + fid + '.geojson')) {
        return;
      }
      
      if (feature.geometry.coordinates.length > 512) {
        // do nothing right now
        console.log('feature '+ fid + 'is too long');
        return;
      }
      
      var remapped = feature.geometry.coordinates.map((pt) => {
        return pt[1] + ',' + pt[0];
      }).reduce((i,j) => {
        return i.concat(j);
      }, []).join('|');
      
      var args = {
        parameters: {
          key: key,
          locations: remapped
        }
      };
      
      c.get(url, args, function(g_data, g_response) {
        if (g_data.status != 'OK') {
          console.log('failed request ('+fid+')', g_data.status);
          if (g_data.status == 'OVER_QUERY_LIMIT') {
            console.log(g_data);
            res.send('break it down');
          }
          return;
        }
        
        // dump the response as well
        jsonfile.writeFile('./responses/'+fid+'.json', g_data, function(err) {
          if (err) {
            console.log('json write err: ', err);
          }
        });
        
        // {
        //    "results" : [
        //       {
        //          "elevation" : 1608.637939453125,
        //          "location" : {
        //             "lat" : 39.73915360,
        //             "lng" : -104.98470340
        //          },
        //          "resolution" : 4.771975994110107
        //       }
        //    ],
        //    "status" : "OK"
        // }
        var new_features = {
          id: fid,
          points: g_data.results.map((obj) => {
            return [obj.location.lng, obj.location.lat, obj.elevation];
          })
        };
        var new_geojson = geojson.parse(new_features, {'LineString': 'points', include: ['id']});
        
        if (new_geojson != {}) {
          jsonfile.writeFile('./geojsons/'+fid + '.geojson', new_geojson, function(err) {
            if (err) {
              console.log('geojson write err: ', err);
            }
          });
        }
        
        setTimeout(function() {
          console.log('post-'+fid+' waiting...');
        }, 1000);
      });
    });
    res.send('done-ish');
  });
});


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
