/* global Cesium */
/* global define */

Cesium.BingMapsApi.defaultKey = 'AuaqC28h5OlZD5rFFs5E1Sa7pLlDG2OTvO7mBl3RxC7MYNGnnSO0ozowwpTFyITM';

$(function() {
  var viewer = new Cesium.Viewer('map', {
    timeline: false, 
    animation: false
  });
  
  
//   $.get('/geojsons/nrinsiir.geojson', function(data) {
//     var d = JSON.parse(data);
    
//     var coords = d.geometry.coordinates;
//     var blobbos = coords.reduce((i, j) => {
//       return i.concat(j);
//     }, []);
    
//     var wall = viewer.entities.add({
//       name: "trail",
//       wall: {
//         positions: Cesium.Cartesian3.fromDegreesArrayHeights(blobbos),
//         material: Cesium.Color.RED.withAlpha(0.75)
//       }
//     });
    
//     viewer.zoomTo(viewer.entities);
    
//   });
  
  $.get('/trails.geojson', function(data) {
    var d = JSON.parse(data);
    $.each(d.features, function(i, feature) {
      var blobbos = feature.geometry.coordinates.reduce((i,j) => {
        return i.concat(j);
      }, []);
      
      var wall = viewer.entities.add({
        name: feature.properties.id,
        wall: {
          positions: Cesium.Cartesian3.fromDegreesArrayHeights(blobbos),
          material: Cesium.Color.RED.withAlpha(0.5)
        }
      });
    });
    viewer.zoomTo(viewer.entities);
  });

});








// some leaflet monkeying (the plugin for 3d lines is out-of-version and buggy)
// and turf buffer-> extrusion doesn't manage sloped edges?
//
// $(function() {
//   var map = L.map('map').setView([35.123345,-106.56831], 10);
  
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
