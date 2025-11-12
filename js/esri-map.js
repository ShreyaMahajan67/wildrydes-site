/*global WildRydes _config*/

var WildRydes = window.WildRydes || {};
WildRydes.map = WildRydes.map || {};

(function esriMapScopeWrapper($) {
  require([
    "esri/Map",
    "esri/views/MapView",
    "esri/Graphic",
    "esri/geometry/Point",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/geometry/support/webMercatorUtils",
    "dojo/domReady!",
  ], function requireCallback(
    Map,
    MapView,
    Graphic,
    Point,
    SimpleMarkerSymbol,
    webMercatorUtils
  ) {
    var wrMap = WildRydes.map;

    wrMap.selectionMode = wrMap.selectionMode || "pickup";

    var map = new Map({ basemap: "gray-vector" });

    var view = new MapView({
      center: [80.15334782923739, 12.840839737429517],
      container: "map",
      map: map,
      zoom: 12,
    });

    var pickupSymbol = new SimpleMarkerSymbol({
      color: "#ffffff",
      style: "circle",
      size: "12px",
      outline: {
        color: "#1f1f1f",
        width: 1.5,
      },
    });

    var dropoffSymbol = new SimpleMarkerSymbol({
      color: "#7f7f7f",
      style: "circle",
      size: "12px",
      outline: {
        color: "#1f1f1f",
        width: 1.5,
      },
    });

    var pickupGraphic;
    var dropoffGraphic;

    function updateCenter(newValue) {
      wrMap.center = {
        latitude: newValue.latitude,
        longitude: newValue.longitude,
      };
    }

    function updateExtent(newValue) {
      var min = webMercatorUtils.xyToLngLat(newValue.xmin, newValue.ymin);
      var max = webMercatorUtils.xyToLngLat(newValue.xmax, newValue.ymax);
      wrMap.extent = {
        minLng: min[0],
        minLat: min[1],
        maxLng: max[0],
        maxLat: max[1],
      };
    }

    view.watch("extent", updateExtent);
    view.watch("center", updateCenter);
    view.then(function onViewLoad() {
      updateExtent(view.extent);
      updateCenter(view.center);
    });

    view.on("click", function handleViewClick(event) {
      var mode = wrMap.selectionMode === "dropoff" ? "dropoff" : "pickup";
      wrMap.selectedPoint = event.mapPoint;

      if (mode === "dropoff") {
        wrMap.dropoffPoint = event.mapPoint;
        if (dropoffGraphic) {
          view.graphics.remove(dropoffGraphic);
        }
        dropoffGraphic = new Graphic({
          symbol: dropoffSymbol,
          geometry: event.mapPoint,
        });
        view.graphics.add(dropoffGraphic);
      } else {
        wrMap.pickupPoint = event.mapPoint;
        if (pickupGraphic) {
          view.graphics.remove(pickupGraphic);
        }
        pickupGraphic = new Graphic({
          symbol: pickupSymbol,
          geometry: event.mapPoint,
        });
        view.graphics.add(pickupGraphic);
      }

      $(wrMap).trigger("locationChange", [mode, event.mapPoint]);
    });

    wrMap.animate = function animate(origin, dest, callback) {
      var startTime;
      var step = function animateFrame(timestamp) {
        var progress;
        var progressPct;
        var point;
        var deltaLat;
        var deltaLon;
        if (!startTime) startTime = timestamp;
        progress = timestamp - startTime;
        progressPct = Math.min(progress / 2000, 1);
        deltaLat = (dest.latitude - origin.latitude) * progressPct;
        deltaLon = (dest.longitude - origin.longitude) * progressPct;
        point = new Point({
          longitude: origin.longitude + deltaLon,
          latitude: origin.latitude + deltaLat,
        });
        if (progressPct < 1) {
          requestAnimationFrame(step);
        } else {
          callback();
        }
      };
      requestAnimationFrame(step);
    };

    wrMap.unsetLocation = function unsetLocation() {
      if (pickupGraphic) {
        view.graphics.remove(pickupGraphic);
        pickupGraphic = null;
      }
      if (dropoffGraphic) {
        view.graphics.remove(dropoffGraphic);
        dropoffGraphic = null;
      }
    };
  });
})(jQuery);
