//var MarkerWithLabel = require ('markerwithlabel')
var MarkerWithLabel = require ('markerwithlabel')(google.maps);

function get(url) {
     // Return a new promise.
   return new Promise(function(resolve, reject) {
    // Do the usual XHR stuff
       var req = new XMLHttpRequest();
       req.open('GET', url);

       req.onload = function() {
      // This is called even on 404 etc
      // so check the status
          if (req.status == 200) {
             // Resolve the promise with the response text
             resolve(req.response);
          }
          else {
                  // Otherwise reject with the status text
                  // which will hopefully be a meaningful error
             reject(Error(req.statusText));
          }
       };
                
                    // Handle network error
       req.onerror = function() {
          reject(Error("Network Error"));
       };
              
            // Make the request
       req.send();
    });
};

var map = {}

function initialize() {
   var mapOptions = { center: new google.maps.LatLng(51.5073, -0.1276), zoom: 13, disableDoubleClickZoom: true };
   map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
//                    google.maps.event.addListener(map, 'dblclick', function(me) {
//                          map.setCenter (me.latLng);
//                    });
   var infowindow;
 
   g = function (name, loc, levels) {

      infowindow = new google.maps.InfoWindow ();
      var content = name;
      var marker = new MarkerWithLabel ({
         position: new google.maps.LatLng (loc.lat, loc.long),
         labelContent: "A:" + levels.available.toString () + "F:" + levels.free.toString(),
         labelClass: "labels",
         map: map});
      google.maps.event.addListener(marker, 'click', (function(marker, content, infow) {
                          return function() {
                              infow.setContent(content);
                              infow.open (map, marker);
                          };
                    }) (marker, content, infowindow));
                    };


   google.maps.event.addListener(map, 'dblclick', function(event) {
                     placeMarker(event.latLng);
   });
    
                  function placeMarker(location) {
                     var marker = new google.maps.Marker({
                        position: location,
                        map: map,
                     });
                     var infowindow = new google.maps.InfoWindow({
                      content: 'Lat: ' + location.lat() +
                          '<br>Long: ' + location.lng()
                      });
                      infowindow.open(map,marker);

                      get ('/loc/' + location.lat() + '/' + location.lng()).then (function (dat) {
                         console.log ("for", location.lat(), location.lng(), "got", dat);
                         return JSON.parse (dat);
                         }).then (function (stnss) {
                             var stns = stnss
                             console.log ("forwarded", stns[0]);
                             for (i=0; i<stns.length; i++) {
                              g (stns [i].name, stns[i].loc, stns[i].levels);
                             };

                        }).catch (function (err) {
                                console.log ("failed", err);
                            });

                    }
                 }
                 google.maps.event.addDomListener(window, 'load', initialize);

