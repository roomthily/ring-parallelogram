/* global mapboxgl */
/* global turf */
/* global d3 */


mapboxgl.accessToken = 'pk.eyJ1Ijoicm9vbXRoaWx5IiwiYSI6ImNpeWl6bHhxbDA1dHkzM282cXFlbjJmcWwifQ.GS5tUoAVwjh70nJKC3EbgA';

$(function() {
  
  // var map = L.map('map').setView([35.123345,-106.56831], 10);
  // L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
  //     attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
  //     maxZoom: 18,
  //     id: 'mapbox.streets',
  //     accessToken: 'pk.eyJ1Ijoicm9vbXRoaWx5IiwiYSI6ImNpeWl6bHhxbDA1dHkzM282cXFlbjJmcWwifQ.GS5tUoAVwjh70nJKC3EbgA'
  // }).addTo(map);
  
  var map = new mapboxgl.Map({
    container: 'map', 
    style: 'mapbox://styles/mapbox/light-v9', 
    center: [-106.56831, 35.123345],
    zoom: 10,
    pitch: 45
  });
  
  
  map.on('load', function() {
    $.get('/geojsons/nrinsiir.geojson', function(data) {
      var d = JSON.parse(data);

      // use turf to create small lines along the trail,
      // buffer to a small polygon, add a interpolated 
      // height for that stretch and extrude

      var id = d.properties.id;
      var coords = d.geometry.coordinates;

      var new_features = [];
      for (var i=0; i < coords.length-1; i++) {
        var spt = coords[i];
        var ept = coords[i+1];

        // console.log(spt.slice(0,2), ept.slice(0,2));

        var s_elev = spt[2];
        var e_elev = ept[2];

        var line = turf.lineString([
          spt.slice(0,2),
          ept.slice(0,2)
        ]);

        var chunks = turf.lineChunk(line, 1, 'kilometers');

        // interp height
        var interp = d3.interpolateNumber(s_elev, e_elev);
        
        // buffer
        $.each(chunks.features, function(j, chunk) {
          var b = turf.buffer(chunk, 0.1, 'kilometers');

          b.properties.height = interp(
            parseFloat(j)/parseFloat(chunks.features.length)
          );
          b.properties.id = id + '-' + i + '-' + j;

          new_features.push(b);
        });
      }
      
      var nf = turf.featureCollection(new_features);
      console.log(nf);

      // add polys to map
      map.addLayer({
        'id': 'buffers',
        'type': 'fill-extrusion',
        'source': {
          'type': 'geojson',
          'data': nf
        },
        'paint': {
          'fill-extrusion-color': '#aaa',
          'fill-extrusion-height': {
            'type': 'identity',
            'property': 'height'
          },
          'fill-extrusion-opacity': 0.5
        }
      });
    });
  });
  


});



  
//   $.get('/trails.geojson', function(data) {
//     var d = JSON.parse(data);
//     $.each(d.features, function(i, feature) {
      
//     });
//   });




// some leaflet monkeying (the plugin for 3d lines is out-of-version and buggy)
// and turf buffer-> extrusion doesn't manage sloped edges?
//
// $(function() {
//   
  
//   // add the basemap
//   L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
//       attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
//       maxZoom: 18,
//       id: 'mapbox.streets',
//       accessToken: 'pk.eyJ1Ijoicm9vbXRoaWx5IiwiYSI6ImNpeWl6bHhxbDA1dHkzM282cXFlbjJmcWwifQ.GS5tUoAVwjh70nJKC3EbgA'
//   }).addTo(map);
  
//   // and let's see if we can get our 3d trail added 
//   // $.get('/geojsons/nrinsiir.geojson', function(data) {
//   //   var d = JSON.parse(data);
//   //   d.properties.color = "rgba(255,0,0, 0.5)";
//   //   console.log(d.properties);
//   // });
  
//   // ANYWAY.
//   // turf to add a small poly for each segment of the path
//   // and then webgl extrude fill *waves hands* 
//   // to display the elevation
//   $.get('/geojsons/nrinsiir.geojson', function(data) {
//     var d = JSON.parse(data);
    
//     var coords = d.geometry.coordinates;
//     var blobbos = [];
//     for (var i=0; i < coords.length-1; i++) {
//       // for each pair of pts, (i, i+1), make 
//       // a line, make a buffer, add the elevations? 
//       // at the end?
      
      
//     }
    
//   });
  
  
// });
