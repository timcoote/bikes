(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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


},{"markerwithlabel":2}],2:[function(require,module,exports){
/**
 * @name MarkerWithLabel for V3
 * @version 1.1.9 [June 30, 2013]
 * @author Gary Little (inspired by code from Marc Ridey of Google).
 * @copyright Copyright 2012 Gary Little [gary at luxcentral.com]
 * @fileoverview MarkerWithLabel extends the Google Maps JavaScript API V3
 *  <code>google.maps.Marker</code> class.
 *  <p>
 *  MarkerWithLabel allows you to define markers with associated labels. As you would expect,
 *  if the marker is draggable, so too will be the label. In addition, a marker with a label
 *  responds to all mouse events in the same manner as a regular marker. It also fires mouse
 *  events and "property changed" events just as a regular marker would. Version 1.1 adds
 *  support for the raiseOnDrag feature introduced in API V3.3.
 *  <p>
 *  If you drag a marker by its label, you can cancel the drag and return the marker to its
 *  original position by pressing the <code>Esc</code> key. This doesn't work if you drag the marker
 *  itself because this feature is not (yet) supported in the <code>google.maps.Marker</code> class.
 */

/*!
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*jslint browser:true */
/*global document,google */

/**
 * @param {Function} childCtor Child class.
 * @param {Function} parentCtor Parent class.
 */
function inherits(childCtor, parentCtor) {
  /** @constructor */
  function tempCtor() {};
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor();
  /** @override */
  childCtor.prototype.constructor = childCtor;
}

/**
 * @param {Object} gMapsApi The Google Maps API instance (usually `google.maps`)
 * @return {Function} The instantiable MarkerWithLabel class
 */
module.exports = function(gMapsApi) {

  /**
   * This constructor creates a label and associates it with a marker.
   * It is for the private use of the MarkerWithLabel class.
   * @constructor
   * @param {Marker} marker The marker with which the label is to be associated.
   * @param {string} crossURL The URL of the cross image =.
   * @param {string} handCursor The URL of the hand cursor.
   * @private
   */
  function MarkerLabel_(marker, crossURL, handCursorURL) {
    this.marker_ = marker;
    this.handCursorURL_ = marker.handCursorURL;

    this.labelDiv_ = document.createElement("div");
    this.labelDiv_.style.cssText = "position: absolute; overflow: hidden;";

    // Set up the DIV for handling mouse events in the label. This DIV forms a transparent veil
    // in the "overlayMouseTarget" pane, a veil that covers just the label. This is done so that
    // events can be captured even if the label is in the shadow of a google.maps.InfoWindow.
    // Code is included here to ensure the veil is always exactly the same size as the label.
    this.eventDiv_ = document.createElement("div");
    this.eventDiv_.style.cssText = this.labelDiv_.style.cssText;

    // This is needed for proper behavior on MSIE:
    this.eventDiv_.setAttribute("onselectstart", "return false;");
    this.eventDiv_.setAttribute("ondragstart", "return false;");

    // Get the DIV for the "X" to be displayed when the marker is raised.
    this.crossDiv_ = MarkerLabel_.getSharedCross(crossURL);
  }
  inherits(MarkerLabel_, gMapsApi.OverlayView);

  /**
   * Returns the DIV for the cross used when dragging a marker when the
   * raiseOnDrag parameter set to true. One cross is shared with all markers.
   * @param {string} crossURL The URL of the cross image =.
   * @private
   */
  MarkerLabel_.getSharedCross = function (crossURL) {
    var div;
    if (typeof MarkerLabel_.getSharedCross.crossDiv === "undefined") {
      div = document.createElement("img");
      div.style.cssText = "position: absolute; z-index: 1000002; display: none;";
      // Hopefully Google never changes the standard "X" attributes:
      div.style.marginLeft = "-8px";
      div.style.marginTop = "-9px";
      div.src = crossURL;
      MarkerLabel_.getSharedCross.crossDiv = div;
    }
    return MarkerLabel_.getSharedCross.crossDiv;
  };

  /**
   * Adds the DIV representing the label to the DOM. This method is called
   * automatically when the marker's <code>setMap</code> method is called.
   * @private
   */
  MarkerLabel_.prototype.onAdd = function () {
    var me = this;
    var cMouseIsDown = false;
    var cDraggingLabel = false;
    var cSavedZIndex;
    var cLatOffset, cLngOffset;
    var cIgnoreClick;
    var cRaiseEnabled;
    var cStartPosition;
    var cStartCenter;
    // Constants:
    var cRaiseOffset = 20;
    var cDraggingCursor = "url(" + this.handCursorURL_ + ")";

    // Stops all processing of an event.
    //
    var cAbortEvent = function (e) {
      if (e.preventDefault) {
        e.preventDefault();
      }
      e.cancelBubble = true;
      if (e.stopPropagation) {
        e.stopPropagation();
      }
    };

    var cStopBounce = function () {
      me.marker_.setAnimation(null);
    };

    this.getPanes().markerLayer.appendChild(this.labelDiv_);
    this.getPanes().overlayMouseTarget.appendChild(this.eventDiv_);
    // One cross is shared with all markers, so only add it once:
    if (typeof MarkerLabel_.getSharedCross.processed === "undefined") {
      this.getPanes().markerLayer.appendChild(this.crossDiv_);
      MarkerLabel_.getSharedCross.processed = true;
    }

    this.listeners_ = [
      gMapsApi.event.addDomListener(this.eventDiv_, "mouseover", function (e) {
        if (me.marker_.getDraggable() || me.marker_.getClickable()) {
          this.style.cursor = "pointer";
          gMapsApi.event.trigger(me.marker_, "mouseover", e);
        }
      }),
      gMapsApi.event.addDomListener(this.eventDiv_, "mouseout", function (e) {
        if ((me.marker_.getDraggable() || me.marker_.getClickable()) && !cDraggingLabel) {
          this.style.cursor = me.marker_.getCursor();
          gMapsApi.event.trigger(me.marker_, "mouseout", e);
        }
      }),
      gMapsApi.event.addDomListener(this.eventDiv_, "mousedown", function (e) {
        cDraggingLabel = false;
        if (me.marker_.getDraggable()) {
          cMouseIsDown = true;
          this.style.cursor = cDraggingCursor;
        }
        if (me.marker_.getDraggable() || me.marker_.getClickable()) {
          gMapsApi.event.trigger(me.marker_, "mousedown", e);
          cAbortEvent(e); // Prevent map pan when starting a drag on a label
        }
      }),
      gMapsApi.event.addDomListener(document, "mouseup", function (mEvent) {
        var position;
        if (cMouseIsDown) {
          cMouseIsDown = false;
          me.eventDiv_.style.cursor = "pointer";
          gMapsApi.event.trigger(me.marker_, "mouseup", mEvent);
        }
        if (cDraggingLabel) {
          if (cRaiseEnabled) { // Lower the marker & label
            position = me.getProjection().fromLatLngToDivPixel(me.marker_.getPosition());
            position.y += cRaiseOffset;
            me.marker_.setPosition(me.getProjection().fromDivPixelToLatLng(position));
            // This is not the same bouncing style as when the marker portion is dragged,
            // but it will have to do:
            try { // Will fail if running Google Maps API earlier than V3.3
              me.marker_.setAnimation(gMapsApi.Animation.BOUNCE);
              setTimeout(cStopBounce, 1406);
            } catch (e) {}
          }
          me.crossDiv_.style.display = "none";
          me.marker_.setZIndex(cSavedZIndex);
          cIgnoreClick = true; // Set flag to ignore the click event reported after a label drag
          cDraggingLabel = false;
          mEvent.latLng = me.marker_.getPosition();
          gMapsApi.event.trigger(me.marker_, "dragend", mEvent);
        }
      }),
      gMapsApi.event.addListener(me.marker_.getMap(), "mousemove", function (mEvent) {
        var position;
        if (cMouseIsDown) {
          if (cDraggingLabel) {
            // Change the reported location from the mouse position to the marker position:
            mEvent.latLng = new gMapsApi.LatLng(mEvent.latLng.lat() - cLatOffset, mEvent.latLng.lng() - cLngOffset);
            position = me.getProjection().fromLatLngToDivPixel(mEvent.latLng);
            if (cRaiseEnabled) {
              me.crossDiv_.style.left = position.x + "px";
              me.crossDiv_.style.top = position.y + "px";
              me.crossDiv_.style.display = "";
              position.y -= cRaiseOffset;
            }
            me.marker_.setPosition(me.getProjection().fromDivPixelToLatLng(position));
            if (cRaiseEnabled) { // Don't raise the veil; this hack needed to make MSIE act properly
              me.eventDiv_.style.top = (position.y + cRaiseOffset) + "px";
            }
            gMapsApi.event.trigger(me.marker_, "drag", mEvent);
          } else {
            // Calculate offsets from the click point to the marker position:
            cLatOffset = mEvent.latLng.lat() - me.marker_.getPosition().lat();
            cLngOffset = mEvent.latLng.lng() - me.marker_.getPosition().lng();
            cSavedZIndex = me.marker_.getZIndex();
            cStartPosition = me.marker_.getPosition();
            cStartCenter = me.marker_.getMap().getCenter();
            cRaiseEnabled = me.marker_.get("raiseOnDrag");
            cDraggingLabel = true;
            me.marker_.setZIndex(1000000); // Moves the marker & label to the foreground during a drag
            mEvent.latLng = me.marker_.getPosition();
            gMapsApi.event.trigger(me.marker_, "dragstart", mEvent);
          }
        }
      }),
      gMapsApi.event.addDomListener(document, "keydown", function (e) {
        if (cDraggingLabel) {
          if (e.keyCode === 27) { // Esc key
            cRaiseEnabled = false;
            me.marker_.setPosition(cStartPosition);
            me.marker_.getMap().setCenter(cStartCenter);
            gMapsApi.event.trigger(document, "mouseup", e);
          }
        }
      }),
      gMapsApi.event.addDomListener(this.eventDiv_, "click", function (e) {
        if (me.marker_.getDraggable() || me.marker_.getClickable()) {
          if (cIgnoreClick) { // Ignore the click reported when a label drag ends
            cIgnoreClick = false;
          } else {
            gMapsApi.event.trigger(me.marker_, "click", e);
            cAbortEvent(e); // Prevent click from being passed on to map
          }
        }
      }),
      gMapsApi.event.addDomListener(this.eventDiv_, "dblclick", function (e) {
        if (me.marker_.getDraggable() || me.marker_.getClickable()) {
          gMapsApi.event.trigger(me.marker_, "dblclick", e);
          cAbortEvent(e); // Prevent map zoom when double-clicking on a label
        }
      }),
      gMapsApi.event.addListener(this.marker_, "dragstart", function (mEvent) {
        if (!cDraggingLabel) {
          cRaiseEnabled = this.get("raiseOnDrag");
        }
      }),
      gMapsApi.event.addListener(this.marker_, "drag", function (mEvent) {
        if (!cDraggingLabel) {
          if (cRaiseEnabled) {
            me.setPosition(cRaiseOffset);
            // During a drag, the marker's z-index is temporarily set to 1000000 to
            // ensure it appears above all other markers. Also set the label's z-index
            // to 1000000 (plus or minus 1 depending on whether the label is supposed
            // to be above or below the marker).
            me.labelDiv_.style.zIndex = 1000000 + (this.get("labelInBackground") ? -1 : +1);
          }
        }
      }),
      gMapsApi.event.addListener(this.marker_, "dragend", function (mEvent) {
        if (!cDraggingLabel) {
          if (cRaiseEnabled) {
            me.setPosition(0); // Also restores z-index of label
          }
        }
      }),
      gMapsApi.event.addListener(this.marker_, "position_changed", function () {
        me.setPosition();
      }),
      gMapsApi.event.addListener(this.marker_, "zindex_changed", function () {
        me.setZIndex();
      }),
      gMapsApi.event.addListener(this.marker_, "visible_changed", function () {
        me.setVisible();
      }),
      gMapsApi.event.addListener(this.marker_, "labelvisible_changed", function () {
        me.setVisible();
      }),
      gMapsApi.event.addListener(this.marker_, "title_changed", function () {
        me.setTitle();
      }),
      gMapsApi.event.addListener(this.marker_, "labelcontent_changed", function () {
        me.setContent();
      }),
      gMapsApi.event.addListener(this.marker_, "labelanchor_changed", function () {
        me.setAnchor();
      }),
      gMapsApi.event.addListener(this.marker_, "labelclass_changed", function () {
        me.setStyles();
      }),
      gMapsApi.event.addListener(this.marker_, "labelstyle_changed", function () {
        me.setStyles();
      })
    ];
  };

  /**
   * Removes the DIV for the label from the DOM. It also removes all event handlers.
   * This method is called automatically when the marker's <code>setMap(null)</code>
   * method is called.
   * @private
   */
  MarkerLabel_.prototype.onRemove = function () {
    var i;
    this.labelDiv_.parentNode.removeChild(this.labelDiv_);
    this.eventDiv_.parentNode.removeChild(this.eventDiv_);

    // Remove event listeners:
    for (i = 0; i < this.listeners_.length; i++) {
      gMapsApi.event.removeListener(this.listeners_[i]);
    }
  };

  /**
   * Draws the label on the map.
   * @private
   */
  MarkerLabel_.prototype.draw = function () {
    this.setContent();
    this.setTitle();
    this.setStyles();
  };

  /**
   * Sets the content of the label.
   * The content can be plain text or an HTML DOM node.
   * @private
   */
  MarkerLabel_.prototype.setContent = function () {
    var content = this.marker_.get("labelContent");
    if (typeof content.nodeType === "undefined") {
      this.labelDiv_.innerHTML = content;
      this.eventDiv_.innerHTML = this.labelDiv_.innerHTML;
    } else {
      // Remove current content
      while (this.labelDiv_.lastChild) {
        this.labelDiv_.removeChild(this.labelDiv_.lastChild);
      }

      while (this.eventDiv_.lastChild) {
        this.eventDiv_.removeChild(this.eventDiv_.lastChild);
      }

      this.labelDiv_.appendChild(content);
      content = content.cloneNode(true);
      this.eventDiv_.appendChild(content);
    }
  };

  /**
   * Sets the content of the tool tip for the label. It is
   * always set to be the same as for the marker itself.
   * @private
   */
  MarkerLabel_.prototype.setTitle = function () {
    this.eventDiv_.title = this.marker_.getTitle() || "";
  };

  /**
   * Sets the style of the label by setting the style sheet and applying
   * other specific styles requested.
   * @private
   */
  MarkerLabel_.prototype.setStyles = function () {
    var i, labelStyle;

    // Apply style values from the style sheet defined in the labelClass parameter:
    this.labelDiv_.className = this.marker_.get("labelClass");
    this.eventDiv_.className = this.labelDiv_.className;

    // Clear existing inline style values:
    this.labelDiv_.style.cssText = "";
    this.eventDiv_.style.cssText = "";
    // Apply style values defined in the labelStyle parameter:
    labelStyle = this.marker_.get("labelStyle");
    for (i in labelStyle) {
      if (labelStyle.hasOwnProperty(i)) {
        this.labelDiv_.style[i] = labelStyle[i];
        this.eventDiv_.style[i] = labelStyle[i];
      }
    }
    this.setMandatoryStyles();
  };

  /**
   * Sets the mandatory styles to the DIV representing the label as well as to the
   * associated event DIV. This includes setting the DIV position, z-index, and visibility.
   * @private
   */
  MarkerLabel_.prototype.setMandatoryStyles = function () {
    this.labelDiv_.style.position = "absolute";
    this.labelDiv_.style.overflow = "hidden";
    // Make sure the opacity setting causes the desired effect on MSIE:
    if (typeof this.labelDiv_.style.opacity !== "undefined" && this.labelDiv_.style.opacity !== "") {
      this.labelDiv_.style.MsFilter = "\"progid:DXImageTransform.Microsoft.Alpha(opacity=" + (this.labelDiv_.style.opacity * 100) + ")\"";
      this.labelDiv_.style.filter = "alpha(opacity=" + (this.labelDiv_.style.opacity * 100) + ")";
    }

    this.eventDiv_.style.position = this.labelDiv_.style.position;
    this.eventDiv_.style.overflow = this.labelDiv_.style.overflow;
    this.eventDiv_.style.opacity = 0.01; // Don't use 0; DIV won't be clickable on MSIE
    this.eventDiv_.style.MsFilter = "\"progid:DXImageTransform.Microsoft.Alpha(opacity=1)\"";
    this.eventDiv_.style.filter = "alpha(opacity=1)"; // For MSIE

    this.setAnchor();
    this.setPosition(); // This also updates z-index, if necessary.
    this.setVisible();
  };

  /**
   * Sets the anchor point of the label.
   * @private
   */
  MarkerLabel_.prototype.setAnchor = function () {
    var anchor = this.marker_.get("labelAnchor");
    this.labelDiv_.style.marginLeft = -anchor.x + "px";
    this.labelDiv_.style.marginTop = -anchor.y + "px";
    this.eventDiv_.style.marginLeft = -anchor.x + "px";
    this.eventDiv_.style.marginTop = -anchor.y + "px";
  };

  /**
   * Sets the position of the label. The z-index is also updated, if necessary.
   * @private
   */
  MarkerLabel_.prototype.setPosition = function (yOffset) {
    var position = this.getProjection().fromLatLngToDivPixel(this.marker_.getPosition());
    if (typeof yOffset === "undefined") {
      yOffset = 0;
    }
    this.labelDiv_.style.left = Math.round(position.x) + "px";
    this.labelDiv_.style.top = Math.round(position.y - yOffset) + "px";
    this.eventDiv_.style.left = this.labelDiv_.style.left;
    this.eventDiv_.style.top = this.labelDiv_.style.top;

    this.setZIndex();
  };

  /**
   * Sets the z-index of the label. If the marker's z-index property has not been defined, the z-index
   * of the label is set to the vertical coordinate of the label. This is in keeping with the default
   * stacking order for Google Maps: markers to the south are in front of markers to the north.
   * @private
   */
  MarkerLabel_.prototype.setZIndex = function () {
    var zAdjust = (this.marker_.get("labelInBackground") ? -1 : +1);
    if (typeof this.marker_.getZIndex() === "undefined") {
      this.labelDiv_.style.zIndex = parseInt(this.labelDiv_.style.top, 10) + zAdjust;
      this.eventDiv_.style.zIndex = this.labelDiv_.style.zIndex;
    } else {
      this.labelDiv_.style.zIndex = this.marker_.getZIndex() + zAdjust;
      this.eventDiv_.style.zIndex = this.labelDiv_.style.zIndex;
    }
  };

  /**
   * Sets the visibility of the label. The label is visible only if the marker itself is
   * visible (i.e., its visible property is true) and the labelVisible property is true.
   * @private
   */
  MarkerLabel_.prototype.setVisible = function () {
    if (this.marker_.get("labelVisible")) {
      this.labelDiv_.style.display = this.marker_.getVisible() ? "block" : "none";
    } else {
      this.labelDiv_.style.display = "none";
    }
    this.eventDiv_.style.display = this.labelDiv_.style.display;
  };

  /**
   * @name MarkerWithLabelOptions
   * @class This class represents the optional parameter passed to the {@link MarkerWithLabel} constructor.
   *  The properties available are the same as for <code>google.maps.Marker</code> with the addition
   *  of the properties listed below. To change any of these additional properties after the labeled
   *  marker has been created, call <code>google.maps.Marker.set(propertyName, propertyValue)</code>.
   *  <p>
   *  When any of these properties changes, a property changed event is fired. The names of these
   *  events are derived from the name of the property and are of the form <code>propertyname_changed</code>.
   *  For example, if the content of the label changes, a <code>labelcontent_changed</code> event
   *  is fired.
   *  <p>
   * @property {string|Node} [labelContent] The content of the label (plain text or an HTML DOM node).
   * @property {Point} [labelAnchor] By default, a label is drawn with its anchor point at (0,0) so
   *  that its top left corner is positioned at the anchor point of the associated marker. Use this
   *  property to change the anchor point of the label. For example, to center a 50px-wide label
   *  beneath a marker, specify a <code>labelAnchor</code> of <code>google.maps.Point(25, 0)</code>.
   *  (Note: x-values increase to the right and y-values increase to the top.)
   * @property {string} [labelClass] The name of the CSS class defining the styles for the label.
   *  Note that style values for <code>position</code>, <code>overflow</code>, <code>top</code>,
   *  <code>left</code>, <code>zIndex</code>, <code>display</code>, <code>marginLeft</code>, and
   *  <code>marginTop</code> are ignored; these styles are for internal use only.
   * @property {Object} [labelStyle] An object literal whose properties define specific CSS
   *  style values to be applied to the label. Style values defined here override those that may
   *  be defined in the <code>labelClass</code> style sheet. If this property is changed after the
   *  label has been created, all previously set styles (except those defined in the style sheet)
   *  are removed from the label before the new style values are applied.
   *  Note that style values for <code>position</code>, <code>overflow</code>, <code>top</code>,
   *  <code>left</code>, <code>zIndex</code>, <code>display</code>, <code>marginLeft</code>, and
   *  <code>marginTop</code> are ignored; these styles are for internal use only.
   * @property {boolean} [labelInBackground] A flag indicating whether a label that overlaps its
   *  associated marker should appear in the background (i.e., in a plane below the marker).
   *  The default is <code>false</code>, which causes the label to appear in the foreground.
   * @property {boolean} [labelVisible] A flag indicating whether the label is to be visible.
   *  The default is <code>true</code>. Note that even if <code>labelVisible</code> is
   *  <code>true</code>, the label will <i>not</i> be visible unless the associated marker is also
   *  visible (i.e., unless the marker's <code>visible</code> property is <code>true</code>).
   * @property {boolean} [raiseOnDrag] A flag indicating whether the label and marker are to be
   *  raised when the marker is dragged. The default is <code>true</code>. If a draggable marker is
   *  being created and a version of Google Maps API earlier than V3.3 is being used, this property
   *  must be set to <code>false</code>.
   * @property {boolean} [optimized] A flag indicating whether rendering is to be optimized for the
   *  marker. <b>Important: The optimized rendering technique is not supported by MarkerWithLabel,
   *  so the value of this parameter is always forced to <code>false</code>.
   * @property {string} [crossImage="http://maps.gstatic.com/intl/en_us/mapfiles/drag_cross_67_16.png"]
   *  The URL of the cross image to be displayed while dragging a marker.
   * @property {string} [handCursor="http://maps.gstatic.com/intl/en_us/mapfiles/closedhand_8_8.cur"]
   *  The URL of the cursor to be displayed while dragging a marker.
   */
  /**
   * Creates a MarkerWithLabel with the options specified in {@link MarkerWithLabelOptions}.
   * @constructor
   * @param {MarkerWithLabelOptions} [opt_options] The optional parameters.
   */
  function MarkerWithLabel(opt_options) {
    opt_options = opt_options || {};
    opt_options.labelContent = opt_options.labelContent || "";
    opt_options.labelAnchor = opt_options.labelAnchor || new gMapsApi.Point(0, 0);
    opt_options.labelClass = opt_options.labelClass || "markerLabels";
    opt_options.labelStyle = opt_options.labelStyle || {};
    opt_options.labelInBackground = opt_options.labelInBackground || false;
    if (typeof opt_options.labelVisible === "undefined") {
      opt_options.labelVisible = true;
    }
    if (typeof opt_options.raiseOnDrag === "undefined") {
      opt_options.raiseOnDrag = true;
    }
    if (typeof opt_options.clickable === "undefined") {
      opt_options.clickable = true;
    }
    if (typeof opt_options.draggable === "undefined") {
      opt_options.draggable = false;
    }
    if (typeof opt_options.optimized === "undefined") {
      opt_options.optimized = false;
    }
    opt_options.crossImage = opt_options.crossImage || "http" + (document.location.protocol === "https:" ? "s" : "") + "://maps.gstatic.com/intl/en_us/mapfiles/drag_cross_67_16.png";
    opt_options.handCursor = opt_options.handCursor || "http" + (document.location.protocol === "https:" ? "s" : "") + "://maps.gstatic.com/intl/en_us/mapfiles/closedhand_8_8.cur";
    opt_options.optimized = false; // Optimized rendering is not supported

    this.label = new MarkerLabel_(this, opt_options.crossImage, opt_options.handCursor); // Bind the label to the marker

    // Call the parent constructor. It calls Marker.setValues to initialize, so all
    // the new parameters are conveniently saved and can be accessed with get/set.
    // Marker.set triggers a property changed event (called "propertyname_changed")
    // that the marker label listens for in order to react to state changes.
    gMapsApi.Marker.apply(this, arguments);
  }
  inherits(MarkerWithLabel, gMapsApi.Marker);

  /**
   * Overrides the standard Marker setMap function.
   * @param {Map} theMap The map to which the marker is to be added.
   * @private
   */
  MarkerWithLabel.prototype.setMap = function (theMap) {

    // Call the inherited function...
    gMapsApi.Marker.prototype.setMap.apply(this, arguments);

    // ... then deal with the label:
    this.label.setMap(theMap);
  };

  return MarkerWithLabel;
}

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvdXNyL2xpYi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL3ZhZ3JhbnQvaGVyb2t1L3guanMiLCIvdmFncmFudC9ub2RlX21vZHVsZXMvbWFya2Vyd2l0aGxhYmVsL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvL3ZhciBNYXJrZXJXaXRoTGFiZWwgPSByZXF1aXJlICgnbWFya2Vyd2l0aGxhYmVsJylcbnZhciBNYXJrZXJXaXRoTGFiZWwgPSByZXF1aXJlICgnbWFya2Vyd2l0aGxhYmVsJykoZ29vZ2xlLm1hcHMpO1xuXG5mdW5jdGlvbiBnZXQodXJsKSB7XG4gICAgIC8vIFJldHVybiBhIG5ldyBwcm9taXNlLlxuICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgIC8vIERvIHRoZSB1c3VhbCBYSFIgc3R1ZmZcbiAgICAgICB2YXIgcmVxID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgcmVxLm9wZW4oJ0dFVCcsIHVybCk7XG5cbiAgICAgICByZXEub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAvLyBUaGlzIGlzIGNhbGxlZCBldmVuIG9uIDQwNCBldGNcbiAgICAgIC8vIHNvIGNoZWNrIHRoZSBzdGF0dXNcbiAgICAgICAgICBpZiAocmVxLnN0YXR1cyA9PSAyMDApIHtcbiAgICAgICAgICAgICAvLyBSZXNvbHZlIHRoZSBwcm9taXNlIHdpdGggdGhlIHJlc3BvbnNlIHRleHRcbiAgICAgICAgICAgICByZXNvbHZlKHJlcS5yZXNwb25zZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgLy8gT3RoZXJ3aXNlIHJlamVjdCB3aXRoIHRoZSBzdGF0dXMgdGV4dFxuICAgICAgICAgICAgICAgICAgLy8gd2hpY2ggd2lsbCBob3BlZnVsbHkgYmUgYSBtZWFuaW5nZnVsIGVycm9yXG4gICAgICAgICAgICAgcmVqZWN0KEVycm9yKHJlcS5zdGF0dXNUZXh0KSk7XG4gICAgICAgICAgfVxuICAgICAgIH07XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIEhhbmRsZSBuZXR3b3JrIGVycm9yXG4gICAgICAgcmVxLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZWplY3QoRXJyb3IoXCJOZXR3b3JrIEVycm9yXCIpKTtcbiAgICAgICB9O1xuICAgICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIE1ha2UgdGhlIHJlcXVlc3RcbiAgICAgICByZXEuc2VuZCgpO1xuICAgIH0pO1xufTtcblxudmFyIG1hcCA9IHt9XG5cbmZ1bmN0aW9uIGluaXRpYWxpemUoKSB7XG4gICB2YXIgbWFwT3B0aW9ucyA9IHsgY2VudGVyOiBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKDUxLjUwNzMsIC0wLjEyNzYpLCB6b29tOiAxMywgZGlzYWJsZURvdWJsZUNsaWNrWm9vbTogdHJ1ZSB9O1xuICAgbWFwID0gbmV3IGdvb2dsZS5tYXBzLk1hcChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1hcC1jYW52YXNcIiksIG1hcE9wdGlvbnMpO1xuLy8gICAgICAgICAgICAgICAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKG1hcCwgJ2RibGNsaWNrJywgZnVuY3Rpb24obWUpIHtcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICBtYXAuc2V0Q2VudGVyIChtZS5sYXRMbmcpO1xuLy8gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgdmFyIGluZm93aW5kb3c7XG4gXG4gICBnID0gZnVuY3Rpb24gKG5hbWUsIGxvYywgbGV2ZWxzKSB7XG5cbiAgICAgIGluZm93aW5kb3cgPSBuZXcgZ29vZ2xlLm1hcHMuSW5mb1dpbmRvdyAoKTtcbiAgICAgIHZhciBjb250ZW50ID0gbmFtZTtcbiAgICAgIHZhciBtYXJrZXIgPSBuZXcgTWFya2VyV2l0aExhYmVsICh7XG4gICAgICAgICBwb3NpdGlvbjogbmV3IGdvb2dsZS5tYXBzLkxhdExuZyAobG9jLmxhdCwgbG9jLmxvbmcpLFxuICAgICAgICAgbGFiZWxDb250ZW50OiBcIkE6XCIgKyBsZXZlbHMuYXZhaWxhYmxlLnRvU3RyaW5nICgpICsgXCJGOlwiICsgbGV2ZWxzLmZyZWUudG9TdHJpbmcoKSxcbiAgICAgICAgIGxhYmVsQ2xhc3M6IFwibGFiZWxzXCIsXG4gICAgICAgICBtYXA6IG1hcH0pO1xuICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIobWFya2VyLCAnY2xpY2snLCAoZnVuY3Rpb24obWFya2VyLCBjb250ZW50LCBpbmZvdykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmZvdy5zZXRDb250ZW50KGNvbnRlbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5mb3cub3BlbiAobWFwLCBtYXJrZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9KSAobWFya2VyLCBjb250ZW50LCBpbmZvd2luZG93KSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG5cblxuICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIobWFwLCAnZGJsY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgICAgICAgICAgcGxhY2VNYXJrZXIoZXZlbnQubGF0TG5nKTtcbiAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gcGxhY2VNYXJrZXIobG9jYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgIHZhciBtYXJrZXIgPSBuZXcgZ29vZ2xlLm1hcHMuTWFya2VyKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBsb2NhdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcDogbWFwLFxuICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICB2YXIgaW5mb3dpbmRvdyA9IG5ldyBnb29nbGUubWFwcy5JbmZvV2luZG93KHtcbiAgICAgICAgICAgICAgICAgICAgICBjb250ZW50OiAnTGF0OiAnICsgbG9jYXRpb24ubGF0KCkgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAnPGJyPkxvbmc6ICcgKyBsb2NhdGlvbi5sbmcoKVxuICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgIGluZm93aW5kb3cub3BlbihtYXAsbWFya2VyKTtcblxuICAgICAgICAgICAgICAgICAgICAgIGdldCAoJy9sb2MvJyArIGxvY2F0aW9uLmxhdCgpICsgJy8nICsgbG9jYXRpb24ubG5nKCkpLnRoZW4gKGZ1bmN0aW9uIChkYXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyAoXCJmb3JcIiwgbG9jYXRpb24ubGF0KCksIGxvY2F0aW9uLmxuZygpLCBcImdvdFwiLCBkYXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBKU09OLnBhcnNlIChkYXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgIH0pLnRoZW4gKGZ1bmN0aW9uIChzdG5zcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgc3RucyA9IHN0bnNzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nIChcImZvcndhcmRlZFwiLCBzdG5zWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChpPTA7IGk8c3Rucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZyAoc3RucyBbaV0ubmFtZSwgc3Ruc1tpXS5sb2MsIHN0bnNbaV0ubGV2ZWxzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2ggKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cgKFwiZmFpbGVkXCIsIGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZERvbUxpc3RlbmVyKHdpbmRvdywgJ2xvYWQnLCBpbml0aWFsaXplKTtcblxuIiwiLyoqXG4gKiBAbmFtZSBNYXJrZXJXaXRoTGFiZWwgZm9yIFYzXG4gKiBAdmVyc2lvbiAxLjEuOSBbSnVuZSAzMCwgMjAxM11cbiAqIEBhdXRob3IgR2FyeSBMaXR0bGUgKGluc3BpcmVkIGJ5IGNvZGUgZnJvbSBNYXJjIFJpZGV5IG9mIEdvb2dsZSkuXG4gKiBAY29weXJpZ2h0IENvcHlyaWdodCAyMDEyIEdhcnkgTGl0dGxlIFtnYXJ5IGF0IGx1eGNlbnRyYWwuY29tXVxuICogQGZpbGVvdmVydmlldyBNYXJrZXJXaXRoTGFiZWwgZXh0ZW5kcyB0aGUgR29vZ2xlIE1hcHMgSmF2YVNjcmlwdCBBUEkgVjNcbiAqICA8Y29kZT5nb29nbGUubWFwcy5NYXJrZXI8L2NvZGU+IGNsYXNzLlxuICogIDxwPlxuICogIE1hcmtlcldpdGhMYWJlbCBhbGxvd3MgeW91IHRvIGRlZmluZSBtYXJrZXJzIHdpdGggYXNzb2NpYXRlZCBsYWJlbHMuIEFzIHlvdSB3b3VsZCBleHBlY3QsXG4gKiAgaWYgdGhlIG1hcmtlciBpcyBkcmFnZ2FibGUsIHNvIHRvbyB3aWxsIGJlIHRoZSBsYWJlbC4gSW4gYWRkaXRpb24sIGEgbWFya2VyIHdpdGggYSBsYWJlbFxuICogIHJlc3BvbmRzIHRvIGFsbCBtb3VzZSBldmVudHMgaW4gdGhlIHNhbWUgbWFubmVyIGFzIGEgcmVndWxhciBtYXJrZXIuIEl0IGFsc28gZmlyZXMgbW91c2VcbiAqICBldmVudHMgYW5kIFwicHJvcGVydHkgY2hhbmdlZFwiIGV2ZW50cyBqdXN0IGFzIGEgcmVndWxhciBtYXJrZXIgd291bGQuIFZlcnNpb24gMS4xIGFkZHNcbiAqICBzdXBwb3J0IGZvciB0aGUgcmFpc2VPbkRyYWcgZmVhdHVyZSBpbnRyb2R1Y2VkIGluIEFQSSBWMy4zLlxuICogIDxwPlxuICogIElmIHlvdSBkcmFnIGEgbWFya2VyIGJ5IGl0cyBsYWJlbCwgeW91IGNhbiBjYW5jZWwgdGhlIGRyYWcgYW5kIHJldHVybiB0aGUgbWFya2VyIHRvIGl0c1xuICogIG9yaWdpbmFsIHBvc2l0aW9uIGJ5IHByZXNzaW5nIHRoZSA8Y29kZT5Fc2M8L2NvZGU+IGtleS4gVGhpcyBkb2Vzbid0IHdvcmsgaWYgeW91IGRyYWcgdGhlIG1hcmtlclxuICogIGl0c2VsZiBiZWNhdXNlIHRoaXMgZmVhdHVyZSBpcyBub3QgKHlldCkgc3VwcG9ydGVkIGluIHRoZSA8Y29kZT5nb29nbGUubWFwcy5NYXJrZXI8L2NvZGU+IGNsYXNzLlxuICovXG5cbi8qIVxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8qanNsaW50IGJyb3dzZXI6dHJ1ZSAqL1xuLypnbG9iYWwgZG9jdW1lbnQsZ29vZ2xlICovXG5cbi8qKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2hpbGRDdG9yIENoaWxkIGNsYXNzLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gcGFyZW50Q3RvciBQYXJlbnQgY2xhc3MuXG4gKi9cbmZ1bmN0aW9uIGluaGVyaXRzKGNoaWxkQ3RvciwgcGFyZW50Q3Rvcikge1xuICAvKiogQGNvbnN0cnVjdG9yICovXG4gIGZ1bmN0aW9uIHRlbXBDdG9yKCkge307XG4gIHRlbXBDdG9yLnByb3RvdHlwZSA9IHBhcmVudEN0b3IucHJvdG90eXBlO1xuICBjaGlsZEN0b3Iuc3VwZXJDbGFzc18gPSBwYXJlbnRDdG9yLnByb3RvdHlwZTtcbiAgY2hpbGRDdG9yLnByb3RvdHlwZSA9IG5ldyB0ZW1wQ3RvcigpO1xuICAvKiogQG92ZXJyaWRlICovXG4gIGNoaWxkQ3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjaGlsZEN0b3I7XG59XG5cbi8qKlxuICogQHBhcmFtIHtPYmplY3R9IGdNYXBzQXBpIFRoZSBHb29nbGUgTWFwcyBBUEkgaW5zdGFuY2UgKHVzdWFsbHkgYGdvb2dsZS5tYXBzYClcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSBUaGUgaW5zdGFudGlhYmxlIE1hcmtlcldpdGhMYWJlbCBjbGFzc1xuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGdNYXBzQXBpKSB7XG5cbiAgLyoqXG4gICAqIFRoaXMgY29uc3RydWN0b3IgY3JlYXRlcyBhIGxhYmVsIGFuZCBhc3NvY2lhdGVzIGl0IHdpdGggYSBtYXJrZXIuXG4gICAqIEl0IGlzIGZvciB0aGUgcHJpdmF0ZSB1c2Ugb2YgdGhlIE1hcmtlcldpdGhMYWJlbCBjbGFzcy5cbiAgICogQGNvbnN0cnVjdG9yXG4gICAqIEBwYXJhbSB7TWFya2VyfSBtYXJrZXIgVGhlIG1hcmtlciB3aXRoIHdoaWNoIHRoZSBsYWJlbCBpcyB0byBiZSBhc3NvY2lhdGVkLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gY3Jvc3NVUkwgVGhlIFVSTCBvZiB0aGUgY3Jvc3MgaW1hZ2UgPS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IGhhbmRDdXJzb3IgVGhlIFVSTCBvZiB0aGUgaGFuZCBjdXJzb3IuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBmdW5jdGlvbiBNYXJrZXJMYWJlbF8obWFya2VyLCBjcm9zc1VSTCwgaGFuZEN1cnNvclVSTCkge1xuICAgIHRoaXMubWFya2VyXyA9IG1hcmtlcjtcbiAgICB0aGlzLmhhbmRDdXJzb3JVUkxfID0gbWFya2VyLmhhbmRDdXJzb3JVUkw7XG5cbiAgICB0aGlzLmxhYmVsRGl2XyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgdGhpcy5sYWJlbERpdl8uc3R5bGUuY3NzVGV4dCA9IFwicG9zaXRpb246IGFic29sdXRlOyBvdmVyZmxvdzogaGlkZGVuO1wiO1xuXG4gICAgLy8gU2V0IHVwIHRoZSBESVYgZm9yIGhhbmRsaW5nIG1vdXNlIGV2ZW50cyBpbiB0aGUgbGFiZWwuIFRoaXMgRElWIGZvcm1zIGEgdHJhbnNwYXJlbnQgdmVpbFxuICAgIC8vIGluIHRoZSBcIm92ZXJsYXlNb3VzZVRhcmdldFwiIHBhbmUsIGEgdmVpbCB0aGF0IGNvdmVycyBqdXN0IHRoZSBsYWJlbC4gVGhpcyBpcyBkb25lIHNvIHRoYXRcbiAgICAvLyBldmVudHMgY2FuIGJlIGNhcHR1cmVkIGV2ZW4gaWYgdGhlIGxhYmVsIGlzIGluIHRoZSBzaGFkb3cgb2YgYSBnb29nbGUubWFwcy5JbmZvV2luZG93LlxuICAgIC8vIENvZGUgaXMgaW5jbHVkZWQgaGVyZSB0byBlbnN1cmUgdGhlIHZlaWwgaXMgYWx3YXlzIGV4YWN0bHkgdGhlIHNhbWUgc2l6ZSBhcyB0aGUgbGFiZWwuXG4gICAgdGhpcy5ldmVudERpdl8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIHRoaXMuZXZlbnREaXZfLnN0eWxlLmNzc1RleHQgPSB0aGlzLmxhYmVsRGl2Xy5zdHlsZS5jc3NUZXh0O1xuXG4gICAgLy8gVGhpcyBpcyBuZWVkZWQgZm9yIHByb3BlciBiZWhhdmlvciBvbiBNU0lFOlxuICAgIHRoaXMuZXZlbnREaXZfLnNldEF0dHJpYnV0ZShcIm9uc2VsZWN0c3RhcnRcIiwgXCJyZXR1cm4gZmFsc2U7XCIpO1xuICAgIHRoaXMuZXZlbnREaXZfLnNldEF0dHJpYnV0ZShcIm9uZHJhZ3N0YXJ0XCIsIFwicmV0dXJuIGZhbHNlO1wiKTtcblxuICAgIC8vIEdldCB0aGUgRElWIGZvciB0aGUgXCJYXCIgdG8gYmUgZGlzcGxheWVkIHdoZW4gdGhlIG1hcmtlciBpcyByYWlzZWQuXG4gICAgdGhpcy5jcm9zc0Rpdl8gPSBNYXJrZXJMYWJlbF8uZ2V0U2hhcmVkQ3Jvc3MoY3Jvc3NVUkwpO1xuICB9XG4gIGluaGVyaXRzKE1hcmtlckxhYmVsXywgZ01hcHNBcGkuT3ZlcmxheVZpZXcpO1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBESVYgZm9yIHRoZSBjcm9zcyB1c2VkIHdoZW4gZHJhZ2dpbmcgYSBtYXJrZXIgd2hlbiB0aGVcbiAgICogcmFpc2VPbkRyYWcgcGFyYW1ldGVyIHNldCB0byB0cnVlLiBPbmUgY3Jvc3MgaXMgc2hhcmVkIHdpdGggYWxsIG1hcmtlcnMuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjcm9zc1VSTCBUaGUgVVJMIG9mIHRoZSBjcm9zcyBpbWFnZSA9LlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgTWFya2VyTGFiZWxfLmdldFNoYXJlZENyb3NzID0gZnVuY3Rpb24gKGNyb3NzVVJMKSB7XG4gICAgdmFyIGRpdjtcbiAgICBpZiAodHlwZW9mIE1hcmtlckxhYmVsXy5nZXRTaGFyZWRDcm9zcy5jcm9zc0RpdiA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImltZ1wiKTtcbiAgICAgIGRpdi5zdHlsZS5jc3NUZXh0ID0gXCJwb3NpdGlvbjogYWJzb2x1dGU7IHotaW5kZXg6IDEwMDAwMDI7IGRpc3BsYXk6IG5vbmU7XCI7XG4gICAgICAvLyBIb3BlZnVsbHkgR29vZ2xlIG5ldmVyIGNoYW5nZXMgdGhlIHN0YW5kYXJkIFwiWFwiIGF0dHJpYnV0ZXM6XG4gICAgICBkaXYuc3R5bGUubWFyZ2luTGVmdCA9IFwiLThweFwiO1xuICAgICAgZGl2LnN0eWxlLm1hcmdpblRvcCA9IFwiLTlweFwiO1xuICAgICAgZGl2LnNyYyA9IGNyb3NzVVJMO1xuICAgICAgTWFya2VyTGFiZWxfLmdldFNoYXJlZENyb3NzLmNyb3NzRGl2ID0gZGl2O1xuICAgIH1cbiAgICByZXR1cm4gTWFya2VyTGFiZWxfLmdldFNoYXJlZENyb3NzLmNyb3NzRGl2O1xuICB9O1xuXG4gIC8qKlxuICAgKiBBZGRzIHRoZSBESVYgcmVwcmVzZW50aW5nIHRoZSBsYWJlbCB0byB0aGUgRE9NLiBUaGlzIG1ldGhvZCBpcyBjYWxsZWRcbiAgICogYXV0b21hdGljYWxseSB3aGVuIHRoZSBtYXJrZXIncyA8Y29kZT5zZXRNYXA8L2NvZGU+IG1ldGhvZCBpcyBjYWxsZWQuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBNYXJrZXJMYWJlbF8ucHJvdG90eXBlLm9uQWRkID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBtZSA9IHRoaXM7XG4gICAgdmFyIGNNb3VzZUlzRG93biA9IGZhbHNlO1xuICAgIHZhciBjRHJhZ2dpbmdMYWJlbCA9IGZhbHNlO1xuICAgIHZhciBjU2F2ZWRaSW5kZXg7XG4gICAgdmFyIGNMYXRPZmZzZXQsIGNMbmdPZmZzZXQ7XG4gICAgdmFyIGNJZ25vcmVDbGljaztcbiAgICB2YXIgY1JhaXNlRW5hYmxlZDtcbiAgICB2YXIgY1N0YXJ0UG9zaXRpb247XG4gICAgdmFyIGNTdGFydENlbnRlcjtcbiAgICAvLyBDb25zdGFudHM6XG4gICAgdmFyIGNSYWlzZU9mZnNldCA9IDIwO1xuICAgIHZhciBjRHJhZ2dpbmdDdXJzb3IgPSBcInVybChcIiArIHRoaXMuaGFuZEN1cnNvclVSTF8gKyBcIilcIjtcblxuICAgIC8vIFN0b3BzIGFsbCBwcm9jZXNzaW5nIG9mIGFuIGV2ZW50LlxuICAgIC8vXG4gICAgdmFyIGNBYm9ydEV2ZW50ID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgIGlmIChlLnByZXZlbnREZWZhdWx0KSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIH1cbiAgICAgIGUuY2FuY2VsQnViYmxlID0gdHJ1ZTtcbiAgICAgIGlmIChlLnN0b3BQcm9wYWdhdGlvbikge1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgY1N0b3BCb3VuY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBtZS5tYXJrZXJfLnNldEFuaW1hdGlvbihudWxsKTtcbiAgICB9O1xuXG4gICAgdGhpcy5nZXRQYW5lcygpLm1hcmtlckxheWVyLmFwcGVuZENoaWxkKHRoaXMubGFiZWxEaXZfKTtcbiAgICB0aGlzLmdldFBhbmVzKCkub3ZlcmxheU1vdXNlVGFyZ2V0LmFwcGVuZENoaWxkKHRoaXMuZXZlbnREaXZfKTtcbiAgICAvLyBPbmUgY3Jvc3MgaXMgc2hhcmVkIHdpdGggYWxsIG1hcmtlcnMsIHNvIG9ubHkgYWRkIGl0IG9uY2U6XG4gICAgaWYgKHR5cGVvZiBNYXJrZXJMYWJlbF8uZ2V0U2hhcmVkQ3Jvc3MucHJvY2Vzc2VkID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aGlzLmdldFBhbmVzKCkubWFya2VyTGF5ZXIuYXBwZW5kQ2hpbGQodGhpcy5jcm9zc0Rpdl8pO1xuICAgICAgTWFya2VyTGFiZWxfLmdldFNoYXJlZENyb3NzLnByb2Nlc3NlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgdGhpcy5saXN0ZW5lcnNfID0gW1xuICAgICAgZ01hcHNBcGkuZXZlbnQuYWRkRG9tTGlzdGVuZXIodGhpcy5ldmVudERpdl8sIFwibW91c2VvdmVyXCIsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGlmIChtZS5tYXJrZXJfLmdldERyYWdnYWJsZSgpIHx8IG1lLm1hcmtlcl8uZ2V0Q2xpY2thYmxlKCkpIHtcbiAgICAgICAgICB0aGlzLnN0eWxlLmN1cnNvciA9IFwicG9pbnRlclwiO1xuICAgICAgICAgIGdNYXBzQXBpLmV2ZW50LnRyaWdnZXIobWUubWFya2VyXywgXCJtb3VzZW92ZXJcIiwgZSk7XG4gICAgICAgIH1cbiAgICAgIH0pLFxuICAgICAgZ01hcHNBcGkuZXZlbnQuYWRkRG9tTGlzdGVuZXIodGhpcy5ldmVudERpdl8sIFwibW91c2VvdXRcIiwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaWYgKChtZS5tYXJrZXJfLmdldERyYWdnYWJsZSgpIHx8IG1lLm1hcmtlcl8uZ2V0Q2xpY2thYmxlKCkpICYmICFjRHJhZ2dpbmdMYWJlbCkge1xuICAgICAgICAgIHRoaXMuc3R5bGUuY3Vyc29yID0gbWUubWFya2VyXy5nZXRDdXJzb3IoKTtcbiAgICAgICAgICBnTWFwc0FwaS5ldmVudC50cmlnZ2VyKG1lLm1hcmtlcl8sIFwibW91c2VvdXRcIiwgZSk7XG4gICAgICAgIH1cbiAgICAgIH0pLFxuICAgICAgZ01hcHNBcGkuZXZlbnQuYWRkRG9tTGlzdGVuZXIodGhpcy5ldmVudERpdl8sIFwibW91c2Vkb3duXCIsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGNEcmFnZ2luZ0xhYmVsID0gZmFsc2U7XG4gICAgICAgIGlmIChtZS5tYXJrZXJfLmdldERyYWdnYWJsZSgpKSB7XG4gICAgICAgICAgY01vdXNlSXNEb3duID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLnN0eWxlLmN1cnNvciA9IGNEcmFnZ2luZ0N1cnNvcjtcbiAgICAgICAgfVxuICAgICAgICBpZiAobWUubWFya2VyXy5nZXREcmFnZ2FibGUoKSB8fCBtZS5tYXJrZXJfLmdldENsaWNrYWJsZSgpKSB7XG4gICAgICAgICAgZ01hcHNBcGkuZXZlbnQudHJpZ2dlcihtZS5tYXJrZXJfLCBcIm1vdXNlZG93blwiLCBlKTtcbiAgICAgICAgICBjQWJvcnRFdmVudChlKTsgLy8gUHJldmVudCBtYXAgcGFuIHdoZW4gc3RhcnRpbmcgYSBkcmFnIG9uIGEgbGFiZWxcbiAgICAgICAgfVxuICAgICAgfSksXG4gICAgICBnTWFwc0FwaS5ldmVudC5hZGREb21MaXN0ZW5lcihkb2N1bWVudCwgXCJtb3VzZXVwXCIsIGZ1bmN0aW9uIChtRXZlbnQpIHtcbiAgICAgICAgdmFyIHBvc2l0aW9uO1xuICAgICAgICBpZiAoY01vdXNlSXNEb3duKSB7XG4gICAgICAgICAgY01vdXNlSXNEb3duID0gZmFsc2U7XG4gICAgICAgICAgbWUuZXZlbnREaXZfLnN0eWxlLmN1cnNvciA9IFwicG9pbnRlclwiO1xuICAgICAgICAgIGdNYXBzQXBpLmV2ZW50LnRyaWdnZXIobWUubWFya2VyXywgXCJtb3VzZXVwXCIsIG1FdmVudCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNEcmFnZ2luZ0xhYmVsKSB7XG4gICAgICAgICAgaWYgKGNSYWlzZUVuYWJsZWQpIHsgLy8gTG93ZXIgdGhlIG1hcmtlciAmIGxhYmVsXG4gICAgICAgICAgICBwb3NpdGlvbiA9IG1lLmdldFByb2plY3Rpb24oKS5mcm9tTGF0TG5nVG9EaXZQaXhlbChtZS5tYXJrZXJfLmdldFBvc2l0aW9uKCkpO1xuICAgICAgICAgICAgcG9zaXRpb24ueSArPSBjUmFpc2VPZmZzZXQ7XG4gICAgICAgICAgICBtZS5tYXJrZXJfLnNldFBvc2l0aW9uKG1lLmdldFByb2plY3Rpb24oKS5mcm9tRGl2UGl4ZWxUb0xhdExuZyhwb3NpdGlvbikpO1xuICAgICAgICAgICAgLy8gVGhpcyBpcyBub3QgdGhlIHNhbWUgYm91bmNpbmcgc3R5bGUgYXMgd2hlbiB0aGUgbWFya2VyIHBvcnRpb24gaXMgZHJhZ2dlZCxcbiAgICAgICAgICAgIC8vIGJ1dCBpdCB3aWxsIGhhdmUgdG8gZG86XG4gICAgICAgICAgICB0cnkgeyAvLyBXaWxsIGZhaWwgaWYgcnVubmluZyBHb29nbGUgTWFwcyBBUEkgZWFybGllciB0aGFuIFYzLjNcbiAgICAgICAgICAgICAgbWUubWFya2VyXy5zZXRBbmltYXRpb24oZ01hcHNBcGkuQW5pbWF0aW9uLkJPVU5DRSk7XG4gICAgICAgICAgICAgIHNldFRpbWVvdXQoY1N0b3BCb3VuY2UsIDE0MDYpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICAgICAgICB9XG4gICAgICAgICAgbWUuY3Jvc3NEaXZfLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICBtZS5tYXJrZXJfLnNldFpJbmRleChjU2F2ZWRaSW5kZXgpO1xuICAgICAgICAgIGNJZ25vcmVDbGljayA9IHRydWU7IC8vIFNldCBmbGFnIHRvIGlnbm9yZSB0aGUgY2xpY2sgZXZlbnQgcmVwb3J0ZWQgYWZ0ZXIgYSBsYWJlbCBkcmFnXG4gICAgICAgICAgY0RyYWdnaW5nTGFiZWwgPSBmYWxzZTtcbiAgICAgICAgICBtRXZlbnQubGF0TG5nID0gbWUubWFya2VyXy5nZXRQb3NpdGlvbigpO1xuICAgICAgICAgIGdNYXBzQXBpLmV2ZW50LnRyaWdnZXIobWUubWFya2VyXywgXCJkcmFnZW5kXCIsIG1FdmVudCk7XG4gICAgICAgIH1cbiAgICAgIH0pLFxuICAgICAgZ01hcHNBcGkuZXZlbnQuYWRkTGlzdGVuZXIobWUubWFya2VyXy5nZXRNYXAoKSwgXCJtb3VzZW1vdmVcIiwgZnVuY3Rpb24gKG1FdmVudCkge1xuICAgICAgICB2YXIgcG9zaXRpb247XG4gICAgICAgIGlmIChjTW91c2VJc0Rvd24pIHtcbiAgICAgICAgICBpZiAoY0RyYWdnaW5nTGFiZWwpIHtcbiAgICAgICAgICAgIC8vIENoYW5nZSB0aGUgcmVwb3J0ZWQgbG9jYXRpb24gZnJvbSB0aGUgbW91c2UgcG9zaXRpb24gdG8gdGhlIG1hcmtlciBwb3NpdGlvbjpcbiAgICAgICAgICAgIG1FdmVudC5sYXRMbmcgPSBuZXcgZ01hcHNBcGkuTGF0TG5nKG1FdmVudC5sYXRMbmcubGF0KCkgLSBjTGF0T2Zmc2V0LCBtRXZlbnQubGF0TG5nLmxuZygpIC0gY0xuZ09mZnNldCk7XG4gICAgICAgICAgICBwb3NpdGlvbiA9IG1lLmdldFByb2plY3Rpb24oKS5mcm9tTGF0TG5nVG9EaXZQaXhlbChtRXZlbnQubGF0TG5nKTtcbiAgICAgICAgICAgIGlmIChjUmFpc2VFbmFibGVkKSB7XG4gICAgICAgICAgICAgIG1lLmNyb3NzRGl2Xy5zdHlsZS5sZWZ0ID0gcG9zaXRpb24ueCArIFwicHhcIjtcbiAgICAgICAgICAgICAgbWUuY3Jvc3NEaXZfLnN0eWxlLnRvcCA9IHBvc2l0aW9uLnkgKyBcInB4XCI7XG4gICAgICAgICAgICAgIG1lLmNyb3NzRGl2Xy5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcbiAgICAgICAgICAgICAgcG9zaXRpb24ueSAtPSBjUmFpc2VPZmZzZXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtZS5tYXJrZXJfLnNldFBvc2l0aW9uKG1lLmdldFByb2plY3Rpb24oKS5mcm9tRGl2UGl4ZWxUb0xhdExuZyhwb3NpdGlvbikpO1xuICAgICAgICAgICAgaWYgKGNSYWlzZUVuYWJsZWQpIHsgLy8gRG9uJ3QgcmFpc2UgdGhlIHZlaWw7IHRoaXMgaGFjayBuZWVkZWQgdG8gbWFrZSBNU0lFIGFjdCBwcm9wZXJseVxuICAgICAgICAgICAgICBtZS5ldmVudERpdl8uc3R5bGUudG9wID0gKHBvc2l0aW9uLnkgKyBjUmFpc2VPZmZzZXQpICsgXCJweFwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZ01hcHNBcGkuZXZlbnQudHJpZ2dlcihtZS5tYXJrZXJfLCBcImRyYWdcIiwgbUV2ZW50KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIG9mZnNldHMgZnJvbSB0aGUgY2xpY2sgcG9pbnQgdG8gdGhlIG1hcmtlciBwb3NpdGlvbjpcbiAgICAgICAgICAgIGNMYXRPZmZzZXQgPSBtRXZlbnQubGF0TG5nLmxhdCgpIC0gbWUubWFya2VyXy5nZXRQb3NpdGlvbigpLmxhdCgpO1xuICAgICAgICAgICAgY0xuZ09mZnNldCA9IG1FdmVudC5sYXRMbmcubG5nKCkgLSBtZS5tYXJrZXJfLmdldFBvc2l0aW9uKCkubG5nKCk7XG4gICAgICAgICAgICBjU2F2ZWRaSW5kZXggPSBtZS5tYXJrZXJfLmdldFpJbmRleCgpO1xuICAgICAgICAgICAgY1N0YXJ0UG9zaXRpb24gPSBtZS5tYXJrZXJfLmdldFBvc2l0aW9uKCk7XG4gICAgICAgICAgICBjU3RhcnRDZW50ZXIgPSBtZS5tYXJrZXJfLmdldE1hcCgpLmdldENlbnRlcigpO1xuICAgICAgICAgICAgY1JhaXNlRW5hYmxlZCA9IG1lLm1hcmtlcl8uZ2V0KFwicmFpc2VPbkRyYWdcIik7XG4gICAgICAgICAgICBjRHJhZ2dpbmdMYWJlbCA9IHRydWU7XG4gICAgICAgICAgICBtZS5tYXJrZXJfLnNldFpJbmRleCgxMDAwMDAwKTsgLy8gTW92ZXMgdGhlIG1hcmtlciAmIGxhYmVsIHRvIHRoZSBmb3JlZ3JvdW5kIGR1cmluZyBhIGRyYWdcbiAgICAgICAgICAgIG1FdmVudC5sYXRMbmcgPSBtZS5tYXJrZXJfLmdldFBvc2l0aW9uKCk7XG4gICAgICAgICAgICBnTWFwc0FwaS5ldmVudC50cmlnZ2VyKG1lLm1hcmtlcl8sIFwiZHJhZ3N0YXJ0XCIsIG1FdmVudCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KSxcbiAgICAgIGdNYXBzQXBpLmV2ZW50LmFkZERvbUxpc3RlbmVyKGRvY3VtZW50LCBcImtleWRvd25cIiwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaWYgKGNEcmFnZ2luZ0xhYmVsKSB7XG4gICAgICAgICAgaWYgKGUua2V5Q29kZSA9PT0gMjcpIHsgLy8gRXNjIGtleVxuICAgICAgICAgICAgY1JhaXNlRW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICAgICAgbWUubWFya2VyXy5zZXRQb3NpdGlvbihjU3RhcnRQb3NpdGlvbik7XG4gICAgICAgICAgICBtZS5tYXJrZXJfLmdldE1hcCgpLnNldENlbnRlcihjU3RhcnRDZW50ZXIpO1xuICAgICAgICAgICAgZ01hcHNBcGkuZXZlbnQudHJpZ2dlcihkb2N1bWVudCwgXCJtb3VzZXVwXCIsIGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSksXG4gICAgICBnTWFwc0FwaS5ldmVudC5hZGREb21MaXN0ZW5lcih0aGlzLmV2ZW50RGl2XywgXCJjbGlja1wiLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICBpZiAobWUubWFya2VyXy5nZXREcmFnZ2FibGUoKSB8fCBtZS5tYXJrZXJfLmdldENsaWNrYWJsZSgpKSB7XG4gICAgICAgICAgaWYgKGNJZ25vcmVDbGljaykgeyAvLyBJZ25vcmUgdGhlIGNsaWNrIHJlcG9ydGVkIHdoZW4gYSBsYWJlbCBkcmFnIGVuZHNcbiAgICAgICAgICAgIGNJZ25vcmVDbGljayA9IGZhbHNlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBnTWFwc0FwaS5ldmVudC50cmlnZ2VyKG1lLm1hcmtlcl8sIFwiY2xpY2tcIiwgZSk7XG4gICAgICAgICAgICBjQWJvcnRFdmVudChlKTsgLy8gUHJldmVudCBjbGljayBmcm9tIGJlaW5nIHBhc3NlZCBvbiB0byBtYXBcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pLFxuICAgICAgZ01hcHNBcGkuZXZlbnQuYWRkRG9tTGlzdGVuZXIodGhpcy5ldmVudERpdl8sIFwiZGJsY2xpY2tcIiwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaWYgKG1lLm1hcmtlcl8uZ2V0RHJhZ2dhYmxlKCkgfHwgbWUubWFya2VyXy5nZXRDbGlja2FibGUoKSkge1xuICAgICAgICAgIGdNYXBzQXBpLmV2ZW50LnRyaWdnZXIobWUubWFya2VyXywgXCJkYmxjbGlja1wiLCBlKTtcbiAgICAgICAgICBjQWJvcnRFdmVudChlKTsgLy8gUHJldmVudCBtYXAgem9vbSB3aGVuIGRvdWJsZS1jbGlja2luZyBvbiBhIGxhYmVsXG4gICAgICAgIH1cbiAgICAgIH0pLFxuICAgICAgZ01hcHNBcGkuZXZlbnQuYWRkTGlzdGVuZXIodGhpcy5tYXJrZXJfLCBcImRyYWdzdGFydFwiLCBmdW5jdGlvbiAobUV2ZW50KSB7XG4gICAgICAgIGlmICghY0RyYWdnaW5nTGFiZWwpIHtcbiAgICAgICAgICBjUmFpc2VFbmFibGVkID0gdGhpcy5nZXQoXCJyYWlzZU9uRHJhZ1wiKTtcbiAgICAgICAgfVxuICAgICAgfSksXG4gICAgICBnTWFwc0FwaS5ldmVudC5hZGRMaXN0ZW5lcih0aGlzLm1hcmtlcl8sIFwiZHJhZ1wiLCBmdW5jdGlvbiAobUV2ZW50KSB7XG4gICAgICAgIGlmICghY0RyYWdnaW5nTGFiZWwpIHtcbiAgICAgICAgICBpZiAoY1JhaXNlRW5hYmxlZCkge1xuICAgICAgICAgICAgbWUuc2V0UG9zaXRpb24oY1JhaXNlT2Zmc2V0KTtcbiAgICAgICAgICAgIC8vIER1cmluZyBhIGRyYWcsIHRoZSBtYXJrZXIncyB6LWluZGV4IGlzIHRlbXBvcmFyaWx5IHNldCB0byAxMDAwMDAwIHRvXG4gICAgICAgICAgICAvLyBlbnN1cmUgaXQgYXBwZWFycyBhYm92ZSBhbGwgb3RoZXIgbWFya2Vycy4gQWxzbyBzZXQgdGhlIGxhYmVsJ3Mgei1pbmRleFxuICAgICAgICAgICAgLy8gdG8gMTAwMDAwMCAocGx1cyBvciBtaW51cyAxIGRlcGVuZGluZyBvbiB3aGV0aGVyIHRoZSBsYWJlbCBpcyBzdXBwb3NlZFxuICAgICAgICAgICAgLy8gdG8gYmUgYWJvdmUgb3IgYmVsb3cgdGhlIG1hcmtlcikuXG4gICAgICAgICAgICBtZS5sYWJlbERpdl8uc3R5bGUuekluZGV4ID0gMTAwMDAwMCArICh0aGlzLmdldChcImxhYmVsSW5CYWNrZ3JvdW5kXCIpID8gLTEgOiArMSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KSxcbiAgICAgIGdNYXBzQXBpLmV2ZW50LmFkZExpc3RlbmVyKHRoaXMubWFya2VyXywgXCJkcmFnZW5kXCIsIGZ1bmN0aW9uIChtRXZlbnQpIHtcbiAgICAgICAgaWYgKCFjRHJhZ2dpbmdMYWJlbCkge1xuICAgICAgICAgIGlmIChjUmFpc2VFbmFibGVkKSB7XG4gICAgICAgICAgICBtZS5zZXRQb3NpdGlvbigwKTsgLy8gQWxzbyByZXN0b3JlcyB6LWluZGV4IG9mIGxhYmVsXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KSxcbiAgICAgIGdNYXBzQXBpLmV2ZW50LmFkZExpc3RlbmVyKHRoaXMubWFya2VyXywgXCJwb3NpdGlvbl9jaGFuZ2VkXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbWUuc2V0UG9zaXRpb24oKTtcbiAgICAgIH0pLFxuICAgICAgZ01hcHNBcGkuZXZlbnQuYWRkTGlzdGVuZXIodGhpcy5tYXJrZXJfLCBcInppbmRleF9jaGFuZ2VkXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbWUuc2V0WkluZGV4KCk7XG4gICAgICB9KSxcbiAgICAgIGdNYXBzQXBpLmV2ZW50LmFkZExpc3RlbmVyKHRoaXMubWFya2VyXywgXCJ2aXNpYmxlX2NoYW5nZWRcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICBtZS5zZXRWaXNpYmxlKCk7XG4gICAgICB9KSxcbiAgICAgIGdNYXBzQXBpLmV2ZW50LmFkZExpc3RlbmVyKHRoaXMubWFya2VyXywgXCJsYWJlbHZpc2libGVfY2hhbmdlZFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1lLnNldFZpc2libGUoKTtcbiAgICAgIH0pLFxuICAgICAgZ01hcHNBcGkuZXZlbnQuYWRkTGlzdGVuZXIodGhpcy5tYXJrZXJfLCBcInRpdGxlX2NoYW5nZWRcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICBtZS5zZXRUaXRsZSgpO1xuICAgICAgfSksXG4gICAgICBnTWFwc0FwaS5ldmVudC5hZGRMaXN0ZW5lcih0aGlzLm1hcmtlcl8sIFwibGFiZWxjb250ZW50X2NoYW5nZWRcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICBtZS5zZXRDb250ZW50KCk7XG4gICAgICB9KSxcbiAgICAgIGdNYXBzQXBpLmV2ZW50LmFkZExpc3RlbmVyKHRoaXMubWFya2VyXywgXCJsYWJlbGFuY2hvcl9jaGFuZ2VkXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbWUuc2V0QW5jaG9yKCk7XG4gICAgICB9KSxcbiAgICAgIGdNYXBzQXBpLmV2ZW50LmFkZExpc3RlbmVyKHRoaXMubWFya2VyXywgXCJsYWJlbGNsYXNzX2NoYW5nZWRcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICBtZS5zZXRTdHlsZXMoKTtcbiAgICAgIH0pLFxuICAgICAgZ01hcHNBcGkuZXZlbnQuYWRkTGlzdGVuZXIodGhpcy5tYXJrZXJfLCBcImxhYmVsc3R5bGVfY2hhbmdlZFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1lLnNldFN0eWxlcygpO1xuICAgICAgfSlcbiAgICBdO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZW1vdmVzIHRoZSBESVYgZm9yIHRoZSBsYWJlbCBmcm9tIHRoZSBET00uIEl0IGFsc28gcmVtb3ZlcyBhbGwgZXZlbnQgaGFuZGxlcnMuXG4gICAqIFRoaXMgbWV0aG9kIGlzIGNhbGxlZCBhdXRvbWF0aWNhbGx5IHdoZW4gdGhlIG1hcmtlcidzIDxjb2RlPnNldE1hcChudWxsKTwvY29kZT5cbiAgICogbWV0aG9kIGlzIGNhbGxlZC5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIE1hcmtlckxhYmVsXy5wcm90b3R5cGUub25SZW1vdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGk7XG4gICAgdGhpcy5sYWJlbERpdl8ucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLmxhYmVsRGl2Xyk7XG4gICAgdGhpcy5ldmVudERpdl8ucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLmV2ZW50RGl2Xyk7XG5cbiAgICAvLyBSZW1vdmUgZXZlbnQgbGlzdGVuZXJzOlxuICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLmxpc3RlbmVyc18ubGVuZ3RoOyBpKyspIHtcbiAgICAgIGdNYXBzQXBpLmV2ZW50LnJlbW92ZUxpc3RlbmVyKHRoaXMubGlzdGVuZXJzX1tpXSk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBEcmF3cyB0aGUgbGFiZWwgb24gdGhlIG1hcC5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIE1hcmtlckxhYmVsXy5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnNldENvbnRlbnQoKTtcbiAgICB0aGlzLnNldFRpdGxlKCk7XG4gICAgdGhpcy5zZXRTdHlsZXMoKTtcbiAgfTtcblxuICAvKipcbiAgICogU2V0cyB0aGUgY29udGVudCBvZiB0aGUgbGFiZWwuXG4gICAqIFRoZSBjb250ZW50IGNhbiBiZSBwbGFpbiB0ZXh0IG9yIGFuIEhUTUwgRE9NIG5vZGUuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBNYXJrZXJMYWJlbF8ucHJvdG90eXBlLnNldENvbnRlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNvbnRlbnQgPSB0aGlzLm1hcmtlcl8uZ2V0KFwibGFiZWxDb250ZW50XCIpO1xuICAgIGlmICh0eXBlb2YgY29udGVudC5ub2RlVHlwZSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhpcy5sYWJlbERpdl8uaW5uZXJIVE1MID0gY29udGVudDtcbiAgICAgIHRoaXMuZXZlbnREaXZfLmlubmVySFRNTCA9IHRoaXMubGFiZWxEaXZfLmlubmVySFRNTDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gUmVtb3ZlIGN1cnJlbnQgY29udGVudFxuICAgICAgd2hpbGUgKHRoaXMubGFiZWxEaXZfLmxhc3RDaGlsZCkge1xuICAgICAgICB0aGlzLmxhYmVsRGl2Xy5yZW1vdmVDaGlsZCh0aGlzLmxhYmVsRGl2Xy5sYXN0Q2hpbGQpO1xuICAgICAgfVxuXG4gICAgICB3aGlsZSAodGhpcy5ldmVudERpdl8ubGFzdENoaWxkKSB7XG4gICAgICAgIHRoaXMuZXZlbnREaXZfLnJlbW92ZUNoaWxkKHRoaXMuZXZlbnREaXZfLmxhc3RDaGlsZCk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMubGFiZWxEaXZfLmFwcGVuZENoaWxkKGNvbnRlbnQpO1xuICAgICAgY29udGVudCA9IGNvbnRlbnQuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgdGhpcy5ldmVudERpdl8uYXBwZW5kQ2hpbGQoY29udGVudCk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBjb250ZW50IG9mIHRoZSB0b29sIHRpcCBmb3IgdGhlIGxhYmVsLiBJdCBpc1xuICAgKiBhbHdheXMgc2V0IHRvIGJlIHRoZSBzYW1lIGFzIGZvciB0aGUgbWFya2VyIGl0c2VsZi5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIE1hcmtlckxhYmVsXy5wcm90b3R5cGUuc2V0VGl0bGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5ldmVudERpdl8udGl0bGUgPSB0aGlzLm1hcmtlcl8uZ2V0VGl0bGUoKSB8fCBcIlwiO1xuICB9O1xuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBzdHlsZSBvZiB0aGUgbGFiZWwgYnkgc2V0dGluZyB0aGUgc3R5bGUgc2hlZXQgYW5kIGFwcGx5aW5nXG4gICAqIG90aGVyIHNwZWNpZmljIHN0eWxlcyByZXF1ZXN0ZWQuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBNYXJrZXJMYWJlbF8ucHJvdG90eXBlLnNldFN0eWxlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgaSwgbGFiZWxTdHlsZTtcblxuICAgIC8vIEFwcGx5IHN0eWxlIHZhbHVlcyBmcm9tIHRoZSBzdHlsZSBzaGVldCBkZWZpbmVkIGluIHRoZSBsYWJlbENsYXNzIHBhcmFtZXRlcjpcbiAgICB0aGlzLmxhYmVsRGl2Xy5jbGFzc05hbWUgPSB0aGlzLm1hcmtlcl8uZ2V0KFwibGFiZWxDbGFzc1wiKTtcbiAgICB0aGlzLmV2ZW50RGl2Xy5jbGFzc05hbWUgPSB0aGlzLmxhYmVsRGl2Xy5jbGFzc05hbWU7XG5cbiAgICAvLyBDbGVhciBleGlzdGluZyBpbmxpbmUgc3R5bGUgdmFsdWVzOlxuICAgIHRoaXMubGFiZWxEaXZfLnN0eWxlLmNzc1RleHQgPSBcIlwiO1xuICAgIHRoaXMuZXZlbnREaXZfLnN0eWxlLmNzc1RleHQgPSBcIlwiO1xuICAgIC8vIEFwcGx5IHN0eWxlIHZhbHVlcyBkZWZpbmVkIGluIHRoZSBsYWJlbFN0eWxlIHBhcmFtZXRlcjpcbiAgICBsYWJlbFN0eWxlID0gdGhpcy5tYXJrZXJfLmdldChcImxhYmVsU3R5bGVcIik7XG4gICAgZm9yIChpIGluIGxhYmVsU3R5bGUpIHtcbiAgICAgIGlmIChsYWJlbFN0eWxlLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgIHRoaXMubGFiZWxEaXZfLnN0eWxlW2ldID0gbGFiZWxTdHlsZVtpXTtcbiAgICAgICAgdGhpcy5ldmVudERpdl8uc3R5bGVbaV0gPSBsYWJlbFN0eWxlW2ldO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnNldE1hbmRhdG9yeVN0eWxlcygpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBtYW5kYXRvcnkgc3R5bGVzIHRvIHRoZSBESVYgcmVwcmVzZW50aW5nIHRoZSBsYWJlbCBhcyB3ZWxsIGFzIHRvIHRoZVxuICAgKiBhc3NvY2lhdGVkIGV2ZW50IERJVi4gVGhpcyBpbmNsdWRlcyBzZXR0aW5nIHRoZSBESVYgcG9zaXRpb24sIHotaW5kZXgsIGFuZCB2aXNpYmlsaXR5LlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgTWFya2VyTGFiZWxfLnByb3RvdHlwZS5zZXRNYW5kYXRvcnlTdHlsZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5sYWJlbERpdl8uc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XG4gICAgdGhpcy5sYWJlbERpdl8uc3R5bGUub3ZlcmZsb3cgPSBcImhpZGRlblwiO1xuICAgIC8vIE1ha2Ugc3VyZSB0aGUgb3BhY2l0eSBzZXR0aW5nIGNhdXNlcyB0aGUgZGVzaXJlZCBlZmZlY3Qgb24gTVNJRTpcbiAgICBpZiAodHlwZW9mIHRoaXMubGFiZWxEaXZfLnN0eWxlLm9wYWNpdHkgIT09IFwidW5kZWZpbmVkXCIgJiYgdGhpcy5sYWJlbERpdl8uc3R5bGUub3BhY2l0eSAhPT0gXCJcIikge1xuICAgICAgdGhpcy5sYWJlbERpdl8uc3R5bGUuTXNGaWx0ZXIgPSBcIlxcXCJwcm9naWQ6RFhJbWFnZVRyYW5zZm9ybS5NaWNyb3NvZnQuQWxwaGEob3BhY2l0eT1cIiArICh0aGlzLmxhYmVsRGl2Xy5zdHlsZS5vcGFjaXR5ICogMTAwKSArIFwiKVxcXCJcIjtcbiAgICAgIHRoaXMubGFiZWxEaXZfLnN0eWxlLmZpbHRlciA9IFwiYWxwaGEob3BhY2l0eT1cIiArICh0aGlzLmxhYmVsRGl2Xy5zdHlsZS5vcGFjaXR5ICogMTAwKSArIFwiKVwiO1xuICAgIH1cblxuICAgIHRoaXMuZXZlbnREaXZfLnN0eWxlLnBvc2l0aW9uID0gdGhpcy5sYWJlbERpdl8uc3R5bGUucG9zaXRpb247XG4gICAgdGhpcy5ldmVudERpdl8uc3R5bGUub3ZlcmZsb3cgPSB0aGlzLmxhYmVsRGl2Xy5zdHlsZS5vdmVyZmxvdztcbiAgICB0aGlzLmV2ZW50RGl2Xy5zdHlsZS5vcGFjaXR5ID0gMC4wMTsgLy8gRG9uJ3QgdXNlIDA7IERJViB3b24ndCBiZSBjbGlja2FibGUgb24gTVNJRVxuICAgIHRoaXMuZXZlbnREaXZfLnN0eWxlLk1zRmlsdGVyID0gXCJcXFwicHJvZ2lkOkRYSW1hZ2VUcmFuc2Zvcm0uTWljcm9zb2Z0LkFscGhhKG9wYWNpdHk9MSlcXFwiXCI7XG4gICAgdGhpcy5ldmVudERpdl8uc3R5bGUuZmlsdGVyID0gXCJhbHBoYShvcGFjaXR5PTEpXCI7IC8vIEZvciBNU0lFXG5cbiAgICB0aGlzLnNldEFuY2hvcigpO1xuICAgIHRoaXMuc2V0UG9zaXRpb24oKTsgLy8gVGhpcyBhbHNvIHVwZGF0ZXMgei1pbmRleCwgaWYgbmVjZXNzYXJ5LlxuICAgIHRoaXMuc2V0VmlzaWJsZSgpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBhbmNob3IgcG9pbnQgb2YgdGhlIGxhYmVsLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgTWFya2VyTGFiZWxfLnByb3RvdHlwZS5zZXRBbmNob3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGFuY2hvciA9IHRoaXMubWFya2VyXy5nZXQoXCJsYWJlbEFuY2hvclwiKTtcbiAgICB0aGlzLmxhYmVsRGl2Xy5zdHlsZS5tYXJnaW5MZWZ0ID0gLWFuY2hvci54ICsgXCJweFwiO1xuICAgIHRoaXMubGFiZWxEaXZfLnN0eWxlLm1hcmdpblRvcCA9IC1hbmNob3IueSArIFwicHhcIjtcbiAgICB0aGlzLmV2ZW50RGl2Xy5zdHlsZS5tYXJnaW5MZWZ0ID0gLWFuY2hvci54ICsgXCJweFwiO1xuICAgIHRoaXMuZXZlbnREaXZfLnN0eWxlLm1hcmdpblRvcCA9IC1hbmNob3IueSArIFwicHhcIjtcbiAgfTtcblxuICAvKipcbiAgICogU2V0cyB0aGUgcG9zaXRpb24gb2YgdGhlIGxhYmVsLiBUaGUgei1pbmRleCBpcyBhbHNvIHVwZGF0ZWQsIGlmIG5lY2Vzc2FyeS5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIE1hcmtlckxhYmVsXy5wcm90b3R5cGUuc2V0UG9zaXRpb24gPSBmdW5jdGlvbiAoeU9mZnNldCkge1xuICAgIHZhciBwb3NpdGlvbiA9IHRoaXMuZ2V0UHJvamVjdGlvbigpLmZyb21MYXRMbmdUb0RpdlBpeGVsKHRoaXMubWFya2VyXy5nZXRQb3NpdGlvbigpKTtcbiAgICBpZiAodHlwZW9mIHlPZmZzZXQgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHlPZmZzZXQgPSAwO1xuICAgIH1cbiAgICB0aGlzLmxhYmVsRGl2Xy5zdHlsZS5sZWZ0ID0gTWF0aC5yb3VuZChwb3NpdGlvbi54KSArIFwicHhcIjtcbiAgICB0aGlzLmxhYmVsRGl2Xy5zdHlsZS50b3AgPSBNYXRoLnJvdW5kKHBvc2l0aW9uLnkgLSB5T2Zmc2V0KSArIFwicHhcIjtcbiAgICB0aGlzLmV2ZW50RGl2Xy5zdHlsZS5sZWZ0ID0gdGhpcy5sYWJlbERpdl8uc3R5bGUubGVmdDtcbiAgICB0aGlzLmV2ZW50RGl2Xy5zdHlsZS50b3AgPSB0aGlzLmxhYmVsRGl2Xy5zdHlsZS50b3A7XG5cbiAgICB0aGlzLnNldFpJbmRleCgpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB6LWluZGV4IG9mIHRoZSBsYWJlbC4gSWYgdGhlIG1hcmtlcidzIHotaW5kZXggcHJvcGVydHkgaGFzIG5vdCBiZWVuIGRlZmluZWQsIHRoZSB6LWluZGV4XG4gICAqIG9mIHRoZSBsYWJlbCBpcyBzZXQgdG8gdGhlIHZlcnRpY2FsIGNvb3JkaW5hdGUgb2YgdGhlIGxhYmVsLiBUaGlzIGlzIGluIGtlZXBpbmcgd2l0aCB0aGUgZGVmYXVsdFxuICAgKiBzdGFja2luZyBvcmRlciBmb3IgR29vZ2xlIE1hcHM6IG1hcmtlcnMgdG8gdGhlIHNvdXRoIGFyZSBpbiBmcm9udCBvZiBtYXJrZXJzIHRvIHRoZSBub3J0aC5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIE1hcmtlckxhYmVsXy5wcm90b3R5cGUuc2V0WkluZGV4ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciB6QWRqdXN0ID0gKHRoaXMubWFya2VyXy5nZXQoXCJsYWJlbEluQmFja2dyb3VuZFwiKSA/IC0xIDogKzEpO1xuICAgIGlmICh0eXBlb2YgdGhpcy5tYXJrZXJfLmdldFpJbmRleCgpID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aGlzLmxhYmVsRGl2Xy5zdHlsZS56SW5kZXggPSBwYXJzZUludCh0aGlzLmxhYmVsRGl2Xy5zdHlsZS50b3AsIDEwKSArIHpBZGp1c3Q7XG4gICAgICB0aGlzLmV2ZW50RGl2Xy5zdHlsZS56SW5kZXggPSB0aGlzLmxhYmVsRGl2Xy5zdHlsZS56SW5kZXg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubGFiZWxEaXZfLnN0eWxlLnpJbmRleCA9IHRoaXMubWFya2VyXy5nZXRaSW5kZXgoKSArIHpBZGp1c3Q7XG4gICAgICB0aGlzLmV2ZW50RGl2Xy5zdHlsZS56SW5kZXggPSB0aGlzLmxhYmVsRGl2Xy5zdHlsZS56SW5kZXg7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB2aXNpYmlsaXR5IG9mIHRoZSBsYWJlbC4gVGhlIGxhYmVsIGlzIHZpc2libGUgb25seSBpZiB0aGUgbWFya2VyIGl0c2VsZiBpc1xuICAgKiB2aXNpYmxlIChpLmUuLCBpdHMgdmlzaWJsZSBwcm9wZXJ0eSBpcyB0cnVlKSBhbmQgdGhlIGxhYmVsVmlzaWJsZSBwcm9wZXJ0eSBpcyB0cnVlLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgTWFya2VyTGFiZWxfLnByb3RvdHlwZS5zZXRWaXNpYmxlID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLm1hcmtlcl8uZ2V0KFwibGFiZWxWaXNpYmxlXCIpKSB7XG4gICAgICB0aGlzLmxhYmVsRGl2Xy5zdHlsZS5kaXNwbGF5ID0gdGhpcy5tYXJrZXJfLmdldFZpc2libGUoKSA/IFwiYmxvY2tcIiA6IFwibm9uZVwiO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmxhYmVsRGl2Xy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgfVxuICAgIHRoaXMuZXZlbnREaXZfLnN0eWxlLmRpc3BsYXkgPSB0aGlzLmxhYmVsRGl2Xy5zdHlsZS5kaXNwbGF5O1xuICB9O1xuXG4gIC8qKlxuICAgKiBAbmFtZSBNYXJrZXJXaXRoTGFiZWxPcHRpb25zXG4gICAqIEBjbGFzcyBUaGlzIGNsYXNzIHJlcHJlc2VudHMgdGhlIG9wdGlvbmFsIHBhcmFtZXRlciBwYXNzZWQgdG8gdGhlIHtAbGluayBNYXJrZXJXaXRoTGFiZWx9IGNvbnN0cnVjdG9yLlxuICAgKiAgVGhlIHByb3BlcnRpZXMgYXZhaWxhYmxlIGFyZSB0aGUgc2FtZSBhcyBmb3IgPGNvZGU+Z29vZ2xlLm1hcHMuTWFya2VyPC9jb2RlPiB3aXRoIHRoZSBhZGRpdGlvblxuICAgKiAgb2YgdGhlIHByb3BlcnRpZXMgbGlzdGVkIGJlbG93LiBUbyBjaGFuZ2UgYW55IG9mIHRoZXNlIGFkZGl0aW9uYWwgcHJvcGVydGllcyBhZnRlciB0aGUgbGFiZWxlZFxuICAgKiAgbWFya2VyIGhhcyBiZWVuIGNyZWF0ZWQsIGNhbGwgPGNvZGU+Z29vZ2xlLm1hcHMuTWFya2VyLnNldChwcm9wZXJ0eU5hbWUsIHByb3BlcnR5VmFsdWUpPC9jb2RlPi5cbiAgICogIDxwPlxuICAgKiAgV2hlbiBhbnkgb2YgdGhlc2UgcHJvcGVydGllcyBjaGFuZ2VzLCBhIHByb3BlcnR5IGNoYW5nZWQgZXZlbnQgaXMgZmlyZWQuIFRoZSBuYW1lcyBvZiB0aGVzZVxuICAgKiAgZXZlbnRzIGFyZSBkZXJpdmVkIGZyb20gdGhlIG5hbWUgb2YgdGhlIHByb3BlcnR5IGFuZCBhcmUgb2YgdGhlIGZvcm0gPGNvZGU+cHJvcGVydHluYW1lX2NoYW5nZWQ8L2NvZGU+LlxuICAgKiAgRm9yIGV4YW1wbGUsIGlmIHRoZSBjb250ZW50IG9mIHRoZSBsYWJlbCBjaGFuZ2VzLCBhIDxjb2RlPmxhYmVsY29udGVudF9jaGFuZ2VkPC9jb2RlPiBldmVudFxuICAgKiAgaXMgZmlyZWQuXG4gICAqICA8cD5cbiAgICogQHByb3BlcnR5IHtzdHJpbmd8Tm9kZX0gW2xhYmVsQ29udGVudF0gVGhlIGNvbnRlbnQgb2YgdGhlIGxhYmVsIChwbGFpbiB0ZXh0IG9yIGFuIEhUTUwgRE9NIG5vZGUpLlxuICAgKiBAcHJvcGVydHkge1BvaW50fSBbbGFiZWxBbmNob3JdIEJ5IGRlZmF1bHQsIGEgbGFiZWwgaXMgZHJhd24gd2l0aCBpdHMgYW5jaG9yIHBvaW50IGF0ICgwLDApIHNvXG4gICAqICB0aGF0IGl0cyB0b3AgbGVmdCBjb3JuZXIgaXMgcG9zaXRpb25lZCBhdCB0aGUgYW5jaG9yIHBvaW50IG9mIHRoZSBhc3NvY2lhdGVkIG1hcmtlci4gVXNlIHRoaXNcbiAgICogIHByb3BlcnR5IHRvIGNoYW5nZSB0aGUgYW5jaG9yIHBvaW50IG9mIHRoZSBsYWJlbC4gRm9yIGV4YW1wbGUsIHRvIGNlbnRlciBhIDUwcHgtd2lkZSBsYWJlbFxuICAgKiAgYmVuZWF0aCBhIG1hcmtlciwgc3BlY2lmeSBhIDxjb2RlPmxhYmVsQW5jaG9yPC9jb2RlPiBvZiA8Y29kZT5nb29nbGUubWFwcy5Qb2ludCgyNSwgMCk8L2NvZGU+LlxuICAgKiAgKE5vdGU6IHgtdmFsdWVzIGluY3JlYXNlIHRvIHRoZSByaWdodCBhbmQgeS12YWx1ZXMgaW5jcmVhc2UgdG8gdGhlIHRvcC4pXG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbbGFiZWxDbGFzc10gVGhlIG5hbWUgb2YgdGhlIENTUyBjbGFzcyBkZWZpbmluZyB0aGUgc3R5bGVzIGZvciB0aGUgbGFiZWwuXG4gICAqICBOb3RlIHRoYXQgc3R5bGUgdmFsdWVzIGZvciA8Y29kZT5wb3NpdGlvbjwvY29kZT4sIDxjb2RlPm92ZXJmbG93PC9jb2RlPiwgPGNvZGU+dG9wPC9jb2RlPixcbiAgICogIDxjb2RlPmxlZnQ8L2NvZGU+LCA8Y29kZT56SW5kZXg8L2NvZGU+LCA8Y29kZT5kaXNwbGF5PC9jb2RlPiwgPGNvZGU+bWFyZ2luTGVmdDwvY29kZT4sIGFuZFxuICAgKiAgPGNvZGU+bWFyZ2luVG9wPC9jb2RlPiBhcmUgaWdub3JlZDsgdGhlc2Ugc3R5bGVzIGFyZSBmb3IgaW50ZXJuYWwgdXNlIG9ubHkuXG4gICAqIEBwcm9wZXJ0eSB7T2JqZWN0fSBbbGFiZWxTdHlsZV0gQW4gb2JqZWN0IGxpdGVyYWwgd2hvc2UgcHJvcGVydGllcyBkZWZpbmUgc3BlY2lmaWMgQ1NTXG4gICAqICBzdHlsZSB2YWx1ZXMgdG8gYmUgYXBwbGllZCB0byB0aGUgbGFiZWwuIFN0eWxlIHZhbHVlcyBkZWZpbmVkIGhlcmUgb3ZlcnJpZGUgdGhvc2UgdGhhdCBtYXlcbiAgICogIGJlIGRlZmluZWQgaW4gdGhlIDxjb2RlPmxhYmVsQ2xhc3M8L2NvZGU+IHN0eWxlIHNoZWV0LiBJZiB0aGlzIHByb3BlcnR5IGlzIGNoYW5nZWQgYWZ0ZXIgdGhlXG4gICAqICBsYWJlbCBoYXMgYmVlbiBjcmVhdGVkLCBhbGwgcHJldmlvdXNseSBzZXQgc3R5bGVzIChleGNlcHQgdGhvc2UgZGVmaW5lZCBpbiB0aGUgc3R5bGUgc2hlZXQpXG4gICAqICBhcmUgcmVtb3ZlZCBmcm9tIHRoZSBsYWJlbCBiZWZvcmUgdGhlIG5ldyBzdHlsZSB2YWx1ZXMgYXJlIGFwcGxpZWQuXG4gICAqICBOb3RlIHRoYXQgc3R5bGUgdmFsdWVzIGZvciA8Y29kZT5wb3NpdGlvbjwvY29kZT4sIDxjb2RlPm92ZXJmbG93PC9jb2RlPiwgPGNvZGU+dG9wPC9jb2RlPixcbiAgICogIDxjb2RlPmxlZnQ8L2NvZGU+LCA8Y29kZT56SW5kZXg8L2NvZGU+LCA8Y29kZT5kaXNwbGF5PC9jb2RlPiwgPGNvZGU+bWFyZ2luTGVmdDwvY29kZT4sIGFuZFxuICAgKiAgPGNvZGU+bWFyZ2luVG9wPC9jb2RlPiBhcmUgaWdub3JlZDsgdGhlc2Ugc3R5bGVzIGFyZSBmb3IgaW50ZXJuYWwgdXNlIG9ubHkuXG4gICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gW2xhYmVsSW5CYWNrZ3JvdW5kXSBBIGZsYWcgaW5kaWNhdGluZyB3aGV0aGVyIGEgbGFiZWwgdGhhdCBvdmVybGFwcyBpdHNcbiAgICogIGFzc29jaWF0ZWQgbWFya2VyIHNob3VsZCBhcHBlYXIgaW4gdGhlIGJhY2tncm91bmQgKGkuZS4sIGluIGEgcGxhbmUgYmVsb3cgdGhlIG1hcmtlcikuXG4gICAqICBUaGUgZGVmYXVsdCBpcyA8Y29kZT5mYWxzZTwvY29kZT4sIHdoaWNoIGNhdXNlcyB0aGUgbGFiZWwgdG8gYXBwZWFyIGluIHRoZSBmb3JlZ3JvdW5kLlxuICAgKiBAcHJvcGVydHkge2Jvb2xlYW59IFtsYWJlbFZpc2libGVdIEEgZmxhZyBpbmRpY2F0aW5nIHdoZXRoZXIgdGhlIGxhYmVsIGlzIHRvIGJlIHZpc2libGUuXG4gICAqICBUaGUgZGVmYXVsdCBpcyA8Y29kZT50cnVlPC9jb2RlPi4gTm90ZSB0aGF0IGV2ZW4gaWYgPGNvZGU+bGFiZWxWaXNpYmxlPC9jb2RlPiBpc1xuICAgKiAgPGNvZGU+dHJ1ZTwvY29kZT4sIHRoZSBsYWJlbCB3aWxsIDxpPm5vdDwvaT4gYmUgdmlzaWJsZSB1bmxlc3MgdGhlIGFzc29jaWF0ZWQgbWFya2VyIGlzIGFsc29cbiAgICogIHZpc2libGUgKGkuZS4sIHVubGVzcyB0aGUgbWFya2VyJ3MgPGNvZGU+dmlzaWJsZTwvY29kZT4gcHJvcGVydHkgaXMgPGNvZGU+dHJ1ZTwvY29kZT4pLlxuICAgKiBAcHJvcGVydHkge2Jvb2xlYW59IFtyYWlzZU9uRHJhZ10gQSBmbGFnIGluZGljYXRpbmcgd2hldGhlciB0aGUgbGFiZWwgYW5kIG1hcmtlciBhcmUgdG8gYmVcbiAgICogIHJhaXNlZCB3aGVuIHRoZSBtYXJrZXIgaXMgZHJhZ2dlZC4gVGhlIGRlZmF1bHQgaXMgPGNvZGU+dHJ1ZTwvY29kZT4uIElmIGEgZHJhZ2dhYmxlIG1hcmtlciBpc1xuICAgKiAgYmVpbmcgY3JlYXRlZCBhbmQgYSB2ZXJzaW9uIG9mIEdvb2dsZSBNYXBzIEFQSSBlYXJsaWVyIHRoYW4gVjMuMyBpcyBiZWluZyB1c2VkLCB0aGlzIHByb3BlcnR5XG4gICAqICBtdXN0IGJlIHNldCB0byA8Y29kZT5mYWxzZTwvY29kZT4uXG4gICAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gW29wdGltaXplZF0gQSBmbGFnIGluZGljYXRpbmcgd2hldGhlciByZW5kZXJpbmcgaXMgdG8gYmUgb3B0aW1pemVkIGZvciB0aGVcbiAgICogIG1hcmtlci4gPGI+SW1wb3J0YW50OiBUaGUgb3B0aW1pemVkIHJlbmRlcmluZyB0ZWNobmlxdWUgaXMgbm90IHN1cHBvcnRlZCBieSBNYXJrZXJXaXRoTGFiZWwsXG4gICAqICBzbyB0aGUgdmFsdWUgb2YgdGhpcyBwYXJhbWV0ZXIgaXMgYWx3YXlzIGZvcmNlZCB0byA8Y29kZT5mYWxzZTwvY29kZT4uXG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbY3Jvc3NJbWFnZT1cImh0dHA6Ly9tYXBzLmdzdGF0aWMuY29tL2ludGwvZW5fdXMvbWFwZmlsZXMvZHJhZ19jcm9zc182N18xNi5wbmdcIl1cbiAgICogIFRoZSBVUkwgb2YgdGhlIGNyb3NzIGltYWdlIHRvIGJlIGRpc3BsYXllZCB3aGlsZSBkcmFnZ2luZyBhIG1hcmtlci5cbiAgICogQHByb3BlcnR5IHtzdHJpbmd9IFtoYW5kQ3Vyc29yPVwiaHR0cDovL21hcHMuZ3N0YXRpYy5jb20vaW50bC9lbl91cy9tYXBmaWxlcy9jbG9zZWRoYW5kXzhfOC5jdXJcIl1cbiAgICogIFRoZSBVUkwgb2YgdGhlIGN1cnNvciB0byBiZSBkaXNwbGF5ZWQgd2hpbGUgZHJhZ2dpbmcgYSBtYXJrZXIuXG4gICAqL1xuICAvKipcbiAgICogQ3JlYXRlcyBhIE1hcmtlcldpdGhMYWJlbCB3aXRoIHRoZSBvcHRpb25zIHNwZWNpZmllZCBpbiB7QGxpbmsgTWFya2VyV2l0aExhYmVsT3B0aW9uc30uXG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKiBAcGFyYW0ge01hcmtlcldpdGhMYWJlbE9wdGlvbnN9IFtvcHRfb3B0aW9uc10gVGhlIG9wdGlvbmFsIHBhcmFtZXRlcnMuXG4gICAqL1xuICBmdW5jdGlvbiBNYXJrZXJXaXRoTGFiZWwob3B0X29wdGlvbnMpIHtcbiAgICBvcHRfb3B0aW9ucyA9IG9wdF9vcHRpb25zIHx8IHt9O1xuICAgIG9wdF9vcHRpb25zLmxhYmVsQ29udGVudCA9IG9wdF9vcHRpb25zLmxhYmVsQ29udGVudCB8fCBcIlwiO1xuICAgIG9wdF9vcHRpb25zLmxhYmVsQW5jaG9yID0gb3B0X29wdGlvbnMubGFiZWxBbmNob3IgfHwgbmV3IGdNYXBzQXBpLlBvaW50KDAsIDApO1xuICAgIG9wdF9vcHRpb25zLmxhYmVsQ2xhc3MgPSBvcHRfb3B0aW9ucy5sYWJlbENsYXNzIHx8IFwibWFya2VyTGFiZWxzXCI7XG4gICAgb3B0X29wdGlvbnMubGFiZWxTdHlsZSA9IG9wdF9vcHRpb25zLmxhYmVsU3R5bGUgfHwge307XG4gICAgb3B0X29wdGlvbnMubGFiZWxJbkJhY2tncm91bmQgPSBvcHRfb3B0aW9ucy5sYWJlbEluQmFja2dyb3VuZCB8fCBmYWxzZTtcbiAgICBpZiAodHlwZW9mIG9wdF9vcHRpb25zLmxhYmVsVmlzaWJsZSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgb3B0X29wdGlvbnMubGFiZWxWaXNpYmxlID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBvcHRfb3B0aW9ucy5yYWlzZU9uRHJhZyA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgb3B0X29wdGlvbnMucmFpc2VPbkRyYWcgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIG9wdF9vcHRpb25zLmNsaWNrYWJsZSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgb3B0X29wdGlvbnMuY2xpY2thYmxlID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBvcHRfb3B0aW9ucy5kcmFnZ2FibGUgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIG9wdF9vcHRpb25zLmRyYWdnYWJsZSA9IGZhbHNlO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIG9wdF9vcHRpb25zLm9wdGltaXplZCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgb3B0X29wdGlvbnMub3B0aW1pemVkID0gZmFsc2U7XG4gICAgfVxuICAgIG9wdF9vcHRpb25zLmNyb3NzSW1hZ2UgPSBvcHRfb3B0aW9ucy5jcm9zc0ltYWdlIHx8IFwiaHR0cFwiICsgKGRvY3VtZW50LmxvY2F0aW9uLnByb3RvY29sID09PSBcImh0dHBzOlwiID8gXCJzXCIgOiBcIlwiKSArIFwiOi8vbWFwcy5nc3RhdGljLmNvbS9pbnRsL2VuX3VzL21hcGZpbGVzL2RyYWdfY3Jvc3NfNjdfMTYucG5nXCI7XG4gICAgb3B0X29wdGlvbnMuaGFuZEN1cnNvciA9IG9wdF9vcHRpb25zLmhhbmRDdXJzb3IgfHwgXCJodHRwXCIgKyAoZG9jdW1lbnQubG9jYXRpb24ucHJvdG9jb2wgPT09IFwiaHR0cHM6XCIgPyBcInNcIiA6IFwiXCIpICsgXCI6Ly9tYXBzLmdzdGF0aWMuY29tL2ludGwvZW5fdXMvbWFwZmlsZXMvY2xvc2VkaGFuZF84XzguY3VyXCI7XG4gICAgb3B0X29wdGlvbnMub3B0aW1pemVkID0gZmFsc2U7IC8vIE9wdGltaXplZCByZW5kZXJpbmcgaXMgbm90IHN1cHBvcnRlZFxuXG4gICAgdGhpcy5sYWJlbCA9IG5ldyBNYXJrZXJMYWJlbF8odGhpcywgb3B0X29wdGlvbnMuY3Jvc3NJbWFnZSwgb3B0X29wdGlvbnMuaGFuZEN1cnNvcik7IC8vIEJpbmQgdGhlIGxhYmVsIHRvIHRoZSBtYXJrZXJcblxuICAgIC8vIENhbGwgdGhlIHBhcmVudCBjb25zdHJ1Y3Rvci4gSXQgY2FsbHMgTWFya2VyLnNldFZhbHVlcyB0byBpbml0aWFsaXplLCBzbyBhbGxcbiAgICAvLyB0aGUgbmV3IHBhcmFtZXRlcnMgYXJlIGNvbnZlbmllbnRseSBzYXZlZCBhbmQgY2FuIGJlIGFjY2Vzc2VkIHdpdGggZ2V0L3NldC5cbiAgICAvLyBNYXJrZXIuc2V0IHRyaWdnZXJzIGEgcHJvcGVydHkgY2hhbmdlZCBldmVudCAoY2FsbGVkIFwicHJvcGVydHluYW1lX2NoYW5nZWRcIilcbiAgICAvLyB0aGF0IHRoZSBtYXJrZXIgbGFiZWwgbGlzdGVucyBmb3IgaW4gb3JkZXIgdG8gcmVhY3QgdG8gc3RhdGUgY2hhbmdlcy5cbiAgICBnTWFwc0FwaS5NYXJrZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuICBpbmhlcml0cyhNYXJrZXJXaXRoTGFiZWwsIGdNYXBzQXBpLk1hcmtlcik7XG5cbiAgLyoqXG4gICAqIE92ZXJyaWRlcyB0aGUgc3RhbmRhcmQgTWFya2VyIHNldE1hcCBmdW5jdGlvbi5cbiAgICogQHBhcmFtIHtNYXB9IHRoZU1hcCBUaGUgbWFwIHRvIHdoaWNoIHRoZSBtYXJrZXIgaXMgdG8gYmUgYWRkZWQuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBNYXJrZXJXaXRoTGFiZWwucHJvdG90eXBlLnNldE1hcCA9IGZ1bmN0aW9uICh0aGVNYXApIHtcblxuICAgIC8vIENhbGwgdGhlIGluaGVyaXRlZCBmdW5jdGlvbi4uLlxuICAgIGdNYXBzQXBpLk1hcmtlci5wcm90b3R5cGUuc2V0TWFwLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICAvLyAuLi4gdGhlbiBkZWFsIHdpdGggdGhlIGxhYmVsOlxuICAgIHRoaXMubGFiZWwuc2V0TWFwKHRoZU1hcCk7XG4gIH07XG5cbiAgcmV0dXJuIE1hcmtlcldpdGhMYWJlbDtcbn1cbiJdfQ==
