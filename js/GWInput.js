//Copyright 2014 USGS Wisconsin Internet Mapping(WiM)
//Author: Erik Myers
//Template Created: May 17th, 2013 by WiM JS Dev Team

//04.03.2014 - NE - Added new allLayers object with all map layer info. new functions to automate adding of layers and building of available map layers box and explanation.
//07.16.2013 - NE - Add functionality for adding icon and execute zoom to scale.
//06.19.2013 - NE - Updated to create lat/lng scale bar programmatically after map is created and ready.
//06.18.2013 - TR - Added color style to USGSLinks <a> tags
//06.03.2013 - ESM - Adds function to build and display usgs links on user logo click
//12.03.2014 -ESM -  Adds infoButtons and explanation functionality to TOC main layout
//12.03.2014 -ESM -  Adds all layers and data with descriptions and functionality
//12.03.2014 -ESM -  Adds identifyTask and custom popup rendering

dojo.require("esri.arcgis.utils");
dojo.require("esri.dijit.Popup");
dojo.require("esri.dijit.Legend");
dojo.require("esri.dijit.BasemapGallery");
dojo.require("esri.graphic");
dojo.require("esri.map");
dojo.require("esri.tasks.locator");
dojo.require("esri.virtualearth.VETiledLayer");

dojo.require("dijit.form.CheckBox");
dojo.require("dijit.form.Button");
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("dijit.TitlePane");
dojo.require("dijit.Tooltip");
dojo.require("dijit.Dialog");
dojo.require("dijit.Tooltip");

dojo.require("wim.CollapsingContainer");
dojo.require("wim.ExtentNav");
dojo.require("wim.LatLngScale");
dojo.require("wim.RefreshScreen");
dojo.require("wim.LinksBox");
dojo.require("wim.LoadingScreen");

//various global variables are set here (Declare here, instantiate below)
var map,
  legendLayers = [];
var layersObject = [];
var layerArray = [];
var radioGroupArray = [];
var staticLegendImage;
var identifyTask, identifyParams;
var navToolbar;
var locator;
var layerInfos;

var servicesURL =
  "https://gis1.wim.usgs.gov/server/rest/services/BadRiver/INPUTS/MapServer";

function init() {
  //sets up the onClick listener for the USGS logo
  dojo.connect(dojo.byId("usgsLogo"), "onclick", showUSGSLinks);

  // a popup is constructed below from the dijit.Popup class, which extends some addtional capability to the InfoWindowBase class.
  var popup = new esri.dijit.Popup({}, dojo.create("div"));

  //IMPORANT: map object declared below. Basic parameters listed here.
  //String referencing container id for the map is required (in this case, "map", in the parens immediately following constructor declaration).
  //Default basemap is set using "basemap" parameter. See API reference page, esri.map Constructor Detail section for parameter info.
  //For template's sake, extent parameter has been set to contiguous US.
  //sliderStyle parameter has been commented out. Remove comments to get a large slider type zoom tool (be sure to fix CSS to prevent overlap with other UI elements)
  //infoWindow parameter sets what will be used as an infoWindow for a map click.
  //If using FeatureLayer,an infoTemplate can be set in the parameters of the FeatureLayer constructor, which will automagically generate an infoWindow.
  map = new esri.Map("map", {
    basemap: "topo",
    wrapAround180: true,
    extent: new esri.geometry.Extent({
      xmin: -10244854.90105959,
      ymin: 5752192.126571113,
      xmax: -9951336.712444402,
      ymax: 5921729.4553077,
      spatialReference: { wkid: 102100 },
    }),
    slider: true,
    sliderStyle: "small", //use "small" for compact version, "large" for long slider version
    logo: false,
    showAttribution: false,
    infoWindow: popup,
  });

  //navToolbar constructor declared, which serves the extent navigator tool.
  navToolbar = new esri.toolbars.Navigation(map);

  //dojo.connect method (a common Dojo framework construction) used to call mapReady function. Fires when the first or base layer has been successfully added to the map.
  dojo.connect(map, "onLoad", mapReady);

  //basemapGallery constructor which serves the basemap selector tool. List of available basemaps can be customized. Here,default ArcGIS online basemaps are set to be available.
  var basemapGallery = new esri.dijit.BasemapGallery(
    {
      showArcGISBasemaps: true,
      map: map,
    },
    "basemapGallery"
  );
  basemapGallery.startup();

  //basemapGallery error catcher
  dojo.connect(basemapGallery, "onError", function () {
    console.log("Basemap gallery failed");
  });

  //calls the executeSiteIdentifyTask function from a click on the map.
  dojo.connect(map, "onClick", executeSiteIdentifyTask);

  //This object contains all layer and their ArcGIS and Wim specific mapper properties (can do feature, wms and dynamic map layers)
  allLayers = {
    "Layer 5 log vertical hydraulic conductivity (Kv)": {
      url: servicesURL,
      visibleLayers: [46],
      arcOptions: {
        visible: false,
        opacity: 0.5,
        id: "l5_log_kz",
      },
      wimOptions: {
        type: "layer",
        includeInLayerList: true,
        esriLegendLabel: false,
      },
    },
    "Layer 4 log vertical hydraulic conductivity (Kv)": {
      url: servicesURL,
      visibleLayers: [45],
      arcOptions: {
        visible: false,
        opacity: 0.5,
        id: "l4_log_kz",
      },
      wimOptions: {
        type: "layer",
        includeInLayerList: true,
        esriLegendLabel: false,
      },
    },
    "Layer 3 log vertical hydraulic conductivity (Kv)": {
      url: servicesURL,
      visibleLayers: [44],
      arcOptions: {
        visible: false,
        opacity: 0.5,
        id: "l3_log_kz",
      },
      wimOptions: {
        type: "layer",
        includeInLayerList: true,
        esriLegendLabel: false,
      },
    },
    "Layers log 1 and 2 vertical hydraulic conductivity (Kv)": {
      url: servicesURL,
      visibleLayers: [43],
      arcOptions: {
        visible: false,
        opacity: 0.5,
        id: "l1_log_kz",
      },
      wimOptions: {
        type: "layer",
        includeInLayerList: true,
        esriLegendLabel: false,
      },
    },
    "Vertical Hydraulic Conductivity (log ft./day)": {
      wimOptions: {
        type: "heading",
        includeInLayerList: true,
        infoButton:
          "Vertical hydraulic conductivity values interpolated from pilot points (log scale).",
      },
    },
    "Layer 5 log horizontal hydraulic conductivity (Kh)": {
      url: servicesURL,
      visibleLayers: [41],
      arcOptions: {
        visible: false,
        opacity: 0.5,
        id: "l5_log_kx",
      },
      wimOptions: {
        type: "layer",
        includeInLayerList: true,
        esriLegendLabel: false,
      },
    },
    "Layer 4 log horizontal hydraulic conductivity (Kh)": {
      url: servicesURL,
      visibleLayers: [40],
      arcOptions: {
        visible: false,
        opacity: 0.5,
        id: "l4_log_kx",
      },
      wimOptions: {
        type: "layer",
        includeInLayerList: true,
        esriLegendLabel: false,
      },
    },
    "Layer 3 log horizontal hydraulic conductivity (Kh)": {
      url: servicesURL,
      visibleLayers: [39],
      arcOptions: {
        visible: false,
        opacity: 0.5,
        id: "l3_log_kx",
      },
      wimOptions: {
        type: "layer",
        includeInLayerList: true,
        esriLegendLabel: false,
      },
    },
    "Layers log 1 and 2 horizontal hydraulic conductivity (Kh)": {
      url: servicesURL,
      visibleLayers: [38],
      arcOptions: {
        visible: false,
        opacity: 0.5,
        id: "l1_log_kx",
      },
      wimOptions: {
        type: "layer",
        includeInLayerList: true,
        esriLegendLabel: false,
      },
    },
    "Horizontal Hydraulic Conductivity (log ft./day)": {
      wimOptions: {
        type: "heading",
        includeInLayerList: true,
        infoButton:
          "Horizontal hydraulic conductivity values interpolated from pilot points (log scale).",
      },
    },
    "Layer 5 vertical hydraulic conductivity (Kv)": {
      url: servicesURL,
      visibleLayers: [36],
      arcOptions: {
        visible: false,
        opacity: 0.5,
        id: "l5_kz",
      },
      wimOptions: {
        type: "layer",
        includeInLayerList: true,
        esriLegendLabel: false,
      },
    },
    "Layer 4 vertical hydraulic conductivity (Kv)": {
      url: servicesURL,
      visibleLayers: [35],
      arcOptions: {
        visible: false,
        opacity: 0.5,
        id: "l4_kz",
      },
      wimOptions: {
        type: "layer",
        includeInLayerList: true,
        esriLegendLabel: false,
      },
    },
    "Layer 3 vertical hydraulic conductivity (Kv)": {
      url: servicesURL,
      visibleLayers: [34],
      arcOptions: {
        visible: false,
        opacity: 0.5,
        id: "l3_kz",
      },
      wimOptions: {
        type: "layer",
        includeInLayerList: true,
        esriLegendLabel: false,
      },
    },
    "Layers 1 and 2 vertical hydraulic conductivity (Kv)": {
      url: servicesURL,
      visibleLayers: [33],
      arcOptions: {
        visible: false,
        opacity: 0.5,
        id: "l1_kz",
      },
      wimOptions: {
        type: "layer",
        includeInLayerList: true,
        esriLegendLabel: false,
      },
    },
    "Vertical Hydraulic Conductivity (ft./day)": {
      wimOptions: {
        type: "heading",
        includeInLayerList: true,
        infoButton:
          "Vertical hydraulic conductivity values interpolated from pilot points.",
      },
    },
    "Layer 5 horizontal hydraulic conductivity (Kh)": {
      url: servicesURL,
      visibleLayers: [31],
      arcOptions: {
        visible: false,
        opacity: 0.5,
        id: "l5_kx",
      },
      wimOptions: {
        type: "layer",
        includeInLayerList: true,
        esriLegendLabel: false,
      },
    },
    "Layer 4 horizontal hydraulic conductivity (Kh)": {
      url: servicesURL,
      visibleLayers: [30],
      arcOptions: {
        visible: false,
        opacity: 0.5,
        id: "l4_kx",
      },
      wimOptions: {
        type: "layer",
        includeInLayerList: true,
        esriLegendLabel: false,
      },
    },
    "Layer 3 horizontal hydraulic conductivity (Kh)": {
      url: servicesURL,
      visibleLayers: [29],
      arcOptions: {
        visible: false,
        opacity: 0.5,
        id: "l3_kx",
      },
      wimOptions: {
        type: "layer",
        includeInLayerList: true,
        esriLegendLabel: false,
      },
    },
    "Layers 1 and 2 horizontal hydraulic conductivity (Kh)": {
      url: servicesURL,
      visibleLayers: [28],
      arcOptions: {
        visible: false,
        opacity: 0.5,
        id: "l1_kx",
      },
      wimOptions: {
        type: "layer",
        includeInLayerList: true,
        esriLegendLabel: false,
      },
    },
    "Horizontal Hydraulic Conductivity (ft./day)": {
      wimOptions: {
        type: "heading",
        includeInLayerList: true,
        infoButton:
          "Horizontal hydraulic conductivity values interpolated from pilot points.",
      },
    },
    Recharge: {
      url: servicesURL,
      visibleLayers: [26],
      arcOptions: {
        visible: true,
        opacity: 0.5,
        id: "_rch",
      },
      wimOptions: {
        type: "layer",
        includeInLayerList: true,
        esriLegendLabel: false,
      },
    },
    "Recharge (in./yr.)": {
      wimOptions: {
        type: "heading",
        includeInLayerList: true,
        infoButton: "Recharge input to the model converted to inches per year.",
      },
    },
    "Layer 5 dry cells": {
      url: servicesURL,
      visibleLayers: [24],
      arcOptions: {
        visible: false,
        opacity: 0.5,
        id: "L5_dry",
      },
      wimOptions: {
        type: "layer",
        includeInLayerList: true,
        esriLegendLabel: false,
      },
    },
    "Layer 4 dry cells": {
      url: servicesURL,
      visibleLayers: [23],
      arcOptions: {
        visible: false,
        opacity: 0.5,
        id: "L4_dry",
      },
      wimOptions: {
        type: "layer",
        includeInLayerList: true,
        esriLegendLabel: false,
      },
    },
    "Layer 3 dry cells": {
      url: servicesURL,
      visibleLayers: [22],
      arcOptions: {
        visible: false,
        opacity: 0.5,
        id: "L3_dry",
      },
      wimOptions: {
        type: "layer",
        includeInLayerList: true,
        esriLegendLabel: false,
      },
    },
    "Layer 2 dry cells": {
      url: servicesURL,
      visibleLayers: [21],
      arcOptions: {
        visible: false,
        opacity: 0.5,
        id: "L2_dry",
      },
      wimOptions: {
        type: "layer",
        includeInLayerList: true,
        esriLegendLabel: false,
      },
    },
    "Layers 1 dry cells": {
      url: servicesURL,
      visibleLayers: [20],
      arcOptions: {
        visible: false,
        opacity: 0.5,
        id: "L1_dry",
      },
      wimOptions: {
        type: "layer",
        includeInLayerList: true,
        esriLegendLabel: false,
      },
    },
    "Dry Cells": {
      wimOptions: {
        type: "heading",
        includeInLayerList: true,
        infoButton:
          "Model cells that are above the simulated water table elevation.",
      },
    },
    "Layer 5 zones": {
      url: servicesURL,
      visibleLayers: [18],
      arcOptions: {
        visible: false,
        opacity: 0.5,
        id: "kzone511",
      },
      wimOptions: {
        type: "layer",
        includeInLayerList: true,
        esriLegendLabel: false,
      },
    },
    "Layer 4 zones": {
      url: servicesURL,
      visibleLayers: [17],
      arcOptions: {
        visible: false,
        opacity: 0.5,
        id: "kzone422",
      },
      wimOptions: {
        type: "layer",
        includeInLayerList: true,
        esriLegendLabel: false,
      },
    },
    "Layer 3 zones": {
      url: servicesURL,
      visibleLayers: [16],
      arcOptions: {
        visible: false,
        opacity: 0.5,
        id: "kzone311",
      },
      wimOptions: {
        type: "layer",
        includeInLayerList: true,
        esriLegendLabel: false,
      },
    },
    "Layers 1 and 2 zones": {
      url: servicesURL,
      visibleLayers: [15],
      arcOptions: {
        visible: false,
        opacity: 0.5,
        id: "kzone111",
      },
      wimOptions: {
        type: "layer",
        includeInLayerList: true,
        esriLegendLabel: false,
      },
    },
    "Pilot Point Zones": {
      wimOptions: {
        type: "heading",
        includeInLayerList: true,
        infoButton:
          "Hydraulic conductivity values were interpolated between pilot points within these zones, which indicate major geologic units. The zones in layer 1 are completely different because they represent surficial glacial deposits. Layer 2 was assigned the same hydraulic conductivity values as layer 1. The zones in layers 3-5 represent major bedrock units; they are only slightly different because of dips in the units (which cause them to be offset between layers).",
      },
    },
    "Streamflow routing cells": {
      url: servicesURL,
      visibleLayers: [13],
      arcOptions: {
        visible: false,
        opacity: 0.9,
        id: "BR_SFR_with_WI_hydro",
      },
      wimOptions: {
        type: "layer",
        includeInLayerList: true,
        esriLegendLabel: false,
        zoomScale: 144448,
      },
    },
    "Streamflow Routing Cells": {
      wimOptions: {
        type: "heading",
        includeInLayerList: true,
        infoButton:
          "Each polygon in this feature is a model cell that has a streamflow routing (SFR) boundary condition.  https://pubs.usgs.gov/tm/2006/tm6A13/",
      },
    },
    "Catchments for groundwater discharge": {
      url: servicesURL,
      visibleLayers: [11],
      arcOptions: {
        visible: false,
        opacity: 0.5,
        id: "MFgrid_segments_dissolved",
      },
      wimOptions: {
        type: "layer",
        includeInLayerList: true,
        esriLegendLabel: false,
      },
    },
    "Groundwater discharge simulated by UZF package": {
      wimOptions: {
        type: "heading",
        includeInLayerList: true,
        infoButton:
          "Each polygon is a catchment derived from NHDPlus. Each catchment was associated with a stream segment (based on which segment had the highest number of reaches within the catchment). All groundwater discharging to the surface in that catchment is routed to that stream segment. Discharge simulated by the UZF package is shown on a cell-by-cell basis in the “Groundwater discharge simulated by UZF package” layer in the Results mapper. Routed discharge from the UZF package is displayed for each stream reach is also displayed in the Results mapper, in the “Groundwater discharge from UZF package” layer under the “Streamflow Results” section.",
      },
    },
    "Pilot points in layer 1": {
      url: servicesURL,
      visibleLayers: [9],
      arcOptions: {
        visible: false,
        opacity: 0.95,
        id: "Pilot points in layer 1",
      },
      wimOptions: {
        type: "layer",
        includeInLayerList: true,
        esriLegendLabel: false,
        layerOptions: {
          selectorType: "radio",
          radioGroup: "pilotPoint",
        },
      },
    },
    "Pilot points in layers 3-5": {
      url: servicesURL,
      visibleLayers: [8],
      arcOptions: {
        visible: false,
        opacity: 0.95,
        id: "Pilot points in layers 3-5",
      },
      wimOptions: {
        type: "layer",
        includeInLayerList: true,
        esriLegendLabel: false,
        layerOptions: {
          selectorType: "radio",
          radioGroup: "pilotPoint",
        },
      },
    },
    "Pilot Points": {
      wimOptions: {
        type: "radioParent",
        includeInLayerList: true,
        infoButton:
          "Hydraulic conductivity values were interpolated between pilot points within these zones, which indicate major geologic units. The zones in layer 1 are different because they represent surficial glacial deposits. Layer 2 was assigned the same hydraulic conductivity values as layer 1. The zones in layers 3-5 represent major bedrock units; they are only slightly different because of dips in the units (which cause them to be offset between layers).",
        layerOptions: {
          selectorType: "radioParent",
          radioGroup: "pilotPoint",
        },
      },
    },
    "Layer 4 vertical hydraulic conductivity (kv)": {
      url: servicesURL,
      visibleLayers: [6],
      arcOptions: {
        visible: false,
        opacity: 0.85,
        id: "identifiability_L4kz",
      },
      wimOptions: {
        type: "layer",
        includeInLayerList: true,
        esriLegendLabel: false,
        layerOptions: {
          selectorType: "radio",
          radioGroup: "pilotPointIdent",
        },
      },
    },
    "Layer 4 horizontal hydraulic conductivity (kh)": {
      url: servicesURL,
      visibleLayers: [5],
      arcOptions: {
        visible: false,
        opacity: 0.85,
        id: "identifiability_L4kh",
      },
      wimOptions: {
        type: "layer",
        includeInLayerList: true,
        esriLegendLabel: false,
        layerOptions: {
          selectorType: "radio",
          radioGroup: "pilotPointIdent",
        },
      },
    },
    "Layer 3 vertical hydraulic conductivity (kv)": {
      url: servicesURL,
      visibleLayers: [4],
      arcOptions: {
        visible: false,
        opacity: 0.85,
        id: "identifiability_L3kz",
      },
      wimOptions: {
        type: "layer",
        includeInLayerList: true,
        esriLegendLabel: false,
        layerOptions: {
          selectorType: "radio",
          radioGroup: "pilotPointIdent",
        },
      },
    },
    "Layer 3 horizontal hydraulic conductivity (kh)": {
      url: servicesURL,
      visibleLayers: [3],
      arcOptions: {
        visible: false,
        opacity: 0.85,
        id: "identifiability_L3kh",
      },
      wimOptions: {
        type: "layer",
        includeInLayerList: true,
        esriLegendLabel: false,
        layerOptions: {
          selectorType: "radio",
          radioGroup: "pilotPointIdent",
        },
      },
    },
    "Layer 1 vertical hydraulic conductivity (kv)": {
      url: servicesURL,
      visibleLayers: [2],
      arcOptions: {
        visible: false,
        opacity: 0.85,
        id: "identifiability_L1kz",
      },
      wimOptions: {
        type: "layer",
        includeInLayerList: true,
        esriLegendLabel: false,
        layerOptions: {
          selectorType: "radio",
          radioGroup: "pilotPointIdent",
        },
      },
    },
    "Layer 1 horizontal hydraulic conductivity (kh)": {
      url: servicesURL,
      visibleLayers: [1],
      arcOptions: {
        visible: false,
        opacity: 0.85,
        id: "identifiability_L1kh",
      },
      wimOptions: {
        type: "layer",
        includeInLayerList: true,
        esriLegendLabel: false,
        layerOptions: {
          selectorType: "radio",
          radioGroup: "pilotPointIdent",
        },
      },
    },
    "Pilot Point Identifiabilities": {
      wimOptions: {
        type: "radioParent",
        includeInLayerList: true,
        visible: false,
        infoButton:
          "During model calibration, hydraulic conductivity is estimated at each pilot point. Each model cell is then populated with a hydraulic conductivity value by interpolation between pilot points. The estimation of K at the pilot point[s] is based on the fit between simulated and observed baseflows and water levels (K is adjusted to achieve the best fit). Identifiability measures the extent to which an individual pilot point is 'informed' by nearby observations. Pilot points that are well informed have an identifiability of 1.0. Values near zero indicate pilot points that do not have a significant effect on model results at the observation locations, and therefore cannot be informed by model fit.",
        layerOptions: {
          selectorType: "radioParent",
          radioGroup: "pilotPointIdent",
          checked: false,
        },
      },
    },
  }; //END allLayers Object

  //this function fires after all layers have been added to map with the map.addLayers method above.
  //this function creates the legend element based on the legendLayers array which contains the relevant data for each layer.
  dojo.connect(map, "onLayersAddResult", function (results) {
    $("#legendDiv").hide();

    var legend = new esri.dijit.Legend(
      {
        map: map,
        layerInfos: legendLayers,
      },
      "legendDiv"
    );
    legend.startup();

    //IMPORTANT: IF REFERENCE LAYER NAMES CHANGE YOU NEED TO EDIT THIS OR IT WILL BOMB
    layerInfos = map.getLayer("identifiability_L1kh").layerInfos;

    //this counter to track first and last of items in legendLayers
    var i = 0;
    var lastItem = layersObject.length;
    //this forEach loop generates the checkbox toggles for each layer by looping through the legendLayers array (same way the legend element is generated).
    dojo.forEach(layersObject, function (layer) {
      var layerName = layer.title;

      if (layer.layer != "heading") {
        if (layer.toggleType == "radioParent") {
          var radioParentCheck = new dijit.form.CheckBox({
            name: "radioParentCheck" + layer.group,
            id: "radioParentCheck_" + layer.group,
            checked: layer.checked,
            params: { group: layer.group },
            onChange: function (evt) {
              var radChildLayers = [];
              var grp = this.params.group;
              dojo.forEach(layersObject, function (layer) {
                if (grp == layer.group && layer.toggleType != "radioParent") {
                  radChildLayers.push(layer.layer);
                }
              });
              if (!this.checked) {
                dojo.forEach(radChildLayers, function (layer) {
                  layer.setVisibility(false);
                });
                var divs = dojo.query("." + grp);
                for (var i = 0; i < divs.length; i++) {
                  divs[i].style.display = "none";
                }
              }
              if (this.checked) {
                var divs = dojo.query("." + grp);
                for (var i = 0; i < divs.length; i++) {
                  divs[i].style.display = "block";
                }
                dojo.forEach(radChildLayers, function (layer) {
                  if (dojo.byId("radioButton" + layer.id).checked) {
                    layer.setVisibility(true);
                  }
                });
              }
              //Check radio buttons in this group to see what's visible
              //jquery selector to get based on group name and then loop through
              /*var checkLayer = map.getLayer(this.value);
							checkLayer.setVisibility(!checkLayer.visible);
							this.checked = checkLayer.visible;	*/
            },
          });
          var toggleDiv = dojo.doc.createElement("div");
          dojo.place(toggleDiv, dojo.byId("toggle"), "after");
          dojo.place(radioParentCheck.domNode, toggleDiv, "first");
          dojo.setStyle(toggleDiv, "paddingLeft", "15px");
          //TESTING
          if (layer.infoButtonText) {
            var infoButton = dojo.create(
              "div",
              {
                innerHTML:
                  '<img class="infoButton" title="Layer Group Explanation" style="height: 15px; width:15px; cursor:pointer;" src="images/infoGraphic.png" />',
              },
              toggleDiv
            ); //WORKS to add HTML div
            dojo.setStyle(infoButton, "float", "right");
            dojo.connect(infoButton, "onclick", function (evt) {
              var infoBox = new dijit.Dialog({
                title: layer.title + " Explanation",
                content: layer.infoButtonText,
                style: "width:400px;",
              });
              infoBox.show();
              dojo.byId("map").appendChild(infoBox);
              dojo.place(infoBox, dojo.byId("map"), "before");
            });
          }
          //END TESTING
          if (i == 0) {
            dojo.setStyle(toggleDiv, "paddingBottom", "10px");
          } else if (i == lastItem) {
            dojo.setStyle(toggleDiv, "paddingTop", "10px");
          }
          var radioParentCheckLabel = dojo.create(
            "label",
            { for: radioParentCheck.name, innerHTML: layerName },
            radioParentCheck.domNode,
            "after"
          );
          //NEEDS TO BE REMOVED ELSE THE INFOBUTTONS GET PUSHED DOWN TO THE NEXT LINE
          //dojo.place("<br/>",radioParentCheckLabel,"after");
        } else if (layer.toggleType == "radio") {
          var radioButton = new dijit.form.RadioButton({
            name: layer.group,
            id: "radioButton" + layer.layer.id,
            value: layer.layer.id,
            checked: layer.layer.visible,
            params: { group: layer.group },
            onChange: function (evt) {
              var radioLayer = map.getLayer(this.value);
              var parentID = "radioParentCheck_" + layer.group;
              this.checked && dijit.byId(parentID).checked
                ? radioLayer.setVisibility(true)
                : radioLayer.setVisibility(false);
            },
          });
          var toggleDiv = dojo.doc.createElement("div");
          dojo.place(toggleDiv, dojo.byId("toggle"), "after");
          dojo.place(radioButton.domNode, toggleDiv, "first");
          dojo.setAttr(toggleDiv, "class", radioButton.params.group);
          dojo.setStyle(toggleDiv, "paddingLeft", "25px");
          dojo.setStyle(toggleDiv, "display", "none");
          if (i == 0) {
            dojo.setStyle(toggleDiv, "paddingBottom", "10px");
          } else if (i == lastItem) {
            dojo.setStyle(toggleDiv, "paddingTop", "10px");
          }
          var radioLabel = dojo.create(
            "label",
            { for: radioButton.name, innerHTML: layerName },
            radioButton.domNode,
            "after"
          );
          dojo.place("<br/>", radioLabel, "after");

          /*} else if (layer.toggleType == 'expand') {

					//IN PROGRESS
					var expandButton = new dijit.form.Button({
						label: "+",
						onClick: function(evt){

						}
					});*/
        } else {
          var checkBox = new dijit.form.CheckBox({
            name: "checkBox" + layer.layer.id,
            value: layer.layer.id,
            checked: layer.layer.visible,
            onChange: function (evt) {
              var checkLayer = map.getLayer(this.value);
              checkLayer.setVisibility(!checkLayer.visible);
              this.checked = checkLayer.visible;
              if (
                allLayers[layerName].wimOptions.includeLegend == true &&
                allLayers[layerName].wimOptions.staticLegendOptions
                  .hasStaticLegend == true
              ) {
                if (checkLayer.visible) {
                  $("#" + layer.layer.id + "Legend").show();
                } else {
                  $("#" + layer.layer.id + "Legend").hide();
                }
              }
            },
          });
          if (allLayers[layerName].wimOptions.zoomScale) {
            //create the holder for the checkbox and zoom icon
            var toggleDiv = dojo.doc.createElement("div");
            dojo.place(toggleDiv, dojo.byId("toggle"), "after");
            dojo.place(checkBox.domNode, toggleDiv, "first");
            var checkLabel = dojo.create(
              "label",
              { for: checkBox.name, innerHTML: layerName },
              checkBox.domNode,
              "after"
            );
            var scale = allLayers[layerName].wimOptions.zoomScale;
            var zoomImage = dojo.doc.createElement("div");
            zoomImage.id = "zoom" + layer.layer.id;
            zoomImage.innerHTML =
              '<img id="zoomImage" title="zoom to visible scale" style="height: 18px;width: 18px; cursor: pointer" src="images/zoom.gif" />';
            dojo.connect(zoomImage, "click", function () {
              if (map.getScale() > scale) {
                map.setScale(scale);
              }
            });
            dojo.place(zoomImage, toggleDiv, "last");
            dojo.setStyle(checkBox.domNode, "float", "left");
            dojo.setStyle(toggleDiv, "paddingLeft", "15px");
            dojo.setStyle(checkLabel, "float", "left");
            dojo.setStyle(toggleDiv, "paddingTop", "5px");
            dojo.setStyle(dojo.byId("zoomImage"), "paddingLeft", "10px");
            dojo.setStyle(toggleDiv, "height", "25px");
            if (i == 0) {
              dojo.setStyle(toggleDiv, "paddingBottom", "10px");
            } else if (i == lastItem) {
              dojo.setStyle(toggleDiv, "paddingTop", "10px");
            }
            dojo.place("<br/>", zoomImage, "after");
          } else {
            var toggleDiv = dojo.doc.createElement("div");
            dojo.place(toggleDiv, dojo.byId("toggle"), "after");
            dojo.place(checkBox.domNode, toggleDiv, "first");
            dojo.setStyle(toggleDiv, "paddingLeft", "15px");
            if (i == 0) {
              dojo.setStyle(toggleDiv, "paddingBottom", "10px");
            } else if (i == lastItem) {
              dojo.setStyle(toggleDiv, "paddingTop", "10px");
            }
            var checkLabel = dojo.create(
              "label",
              { for: checkBox.name, innerHTML: layerName },
              checkBox.domNode,
              "after"
            );
            dojo.place("<br/>", checkLabel, "after");
          }
        }
      } else {
        var headingDiv = dojo.doc.createElement("div");
        headingDiv.innerHTML = layer.title;
        dojo.place(headingDiv, dojo.byId("toggle"), "after");
        dojo.addClass(headingDiv, "heading");
        dojo.setStyle(headingDiv, "paddingTop", "10px");
        dojo.setStyle(headingDiv, "color", "#D3CFBA");
        if (layer.infoButtonText) {
          var infoButton = dojo.create(
            "div",
            {
              innerHTML:
                '<img class="infoButton" title="Layer Group Explanation" style="height: 15px; width:15px; cursor:pointer;" src="images/infoGraphic.png" />',
            },
            headingDiv
          ); //WORKS to add HTML div
          dojo.setStyle(infoButton, "float", "right");
          dojo.connect(infoButton, "onclick", function (evt) {
            //console.log(layer.infoButtonText);
            //var infoBox = dojo.create('div', {innerHTML: layer.infoButtonText}, dojo.byId('availableLayers'));
            var infoBox = new dijit.Dialog({
              title: layer.title + " Explanation",
              content: layer.infoButtonText,
              style: "width:400px;",
            });
            infoBox.show();

            //dojo.byId('map').appendChild(infoBox);
          });
        }
        if (i == 0) {
          dojo.setStyle(headingDiv, "paddingBottom", "10px");
          dojo.setStyle(infoButton, "float", "left");
        } else if (i == lastItem) {
          dojo.setStyle(headingDiv, "paddingTop", "10px");
        }
      }
      i++;
    });

    //function to handle styling adjustments to the esri legend dijit
    setTimeout(function () {
      $.each($('div[id^="legendDiv_"]'), function (index, item) {
        for (layer in allLayers) {
          if (layer == $("#" + item.id + " span").html()) {
            if (
              allLayers[layer].wimOptions.esriLegendLabel !== undefined &&
              allLayers[layer].wimOptions.esriLegendLabel == false
            ) {
              $("#" + item.id + " table.esriLegendLayerLabel").remove();
            }
          }
        }
      });
      $("#legendDiv").show();
    }, 1000);
  });

  addAllLayers();

  //OPTIONAL: the below remaining lines within the init function are for performing an identify task on a layer in the mapper.
  // the following 7 lines establish an IdentifyParameters object(which is an argument for an identifyTask.execute method)and specifies the criteria used to identify features.
  // the constructor of the identifyTask is especially important. the service URL there should match that of the layer from which you'd like to identify.
  //var visibleLayers = [1,2,3,4,5,6];

  identifyParams = new esri.tasks.IdentifyParameters();
  identifyParams.tolerance = 8;
  identifyParams.returnGeometry = true;
  //identifyParams.layerIds = visibleLayers;
  identifyParams.layerOption =
    esri.tasks.IdentifyParameters.LAYER_OPTION_VISIBLE;
  identifyParams.width = map.width;
  identifyParams.height = map.height;
  identifyTask = new esri.tasks.IdentifyTask(servicesURL);

  //OPTIONAL: the following function carries out an identify task query on a layer and returns attributes for the feature in an info window according to the
  //InfoTemplate defined below. It is also possible to set a default info window on the layer declaration which will automatically display all the attributes
  //for the layer in the order they come from the table schema. This code below creates custom labels for each field and substitutes in the value using the notation ${[FIELD NAME]}.
  function executeSiteIdentifyTask(evt) {
    //variables are reset for each click event
    var visibleLayers = [];
    var layersOnly = [];

    //remove non-spatial layers from the layerInfos array (i.e. heading/radioparents/etc)
    for (var i = 0; i < layerInfos.length; i++) {
      if (layerInfos[i].parentLayerId != -1) {
        layersOnly.push(layerInfos[i]); //push entire layer info object into layersOnly array for SPATIAL LAYERS ONLY
      }
    }

    //loop through to find only the currently visible spatial layers
    for (var i = 0; i < layersOnly.length; i++) {
      //var layerVis = map.getLayer(layersOnly[i].name).visible;
      //if (map.getLayer(layersOnly[i].name).visible == true){
      if (
        map.getLayer(layersOnly[i].name) != undefined &&
        map.getLayer(layersOnly[i].name).visible == true
      ) {
        visibleLayers.push(layersOnly[i].id); //visible spatial layers only
      } else {
        continue;
      }
    }

    identifyParams.layerIds = visibleLayers; //set layer Id array to visibleLayers Variable
    identifyParams.geometry = evt.mapPoint;
    identifyParams.mapExtent = map.extent;

    //var layercheck = map.getLayersVisibleAtScale(map.getScale());
    // the deferred variable is set to the parameters defined above and will be used later to build the contents of the infoWindow.
    var deferredResult = identifyTask.execute(identifyParams);

    deferredResult.addCallback(function (response) {
      // response is an array of identify result objects
      // dojo.map is used to set the variable feature to each result in the response array and apply the same template to each of those features,
      return dojo.map(response, function (result) {
        var feature = result.feature;
        var layerid = String(result.layerId);
        var popupLayerName = result.layerName;
        feature.attributes.layerName = result.layerName;

        //pilot point identifiabilities
        if (result.layerId <= 6) {
          var template = new esri.InfoTemplate(
            "Pilot Point Identifiability",
            "<b>Pilot Point Name</b>: ${parameter}<br/>" +
              "<b>Identifiability</b>: ${ident}<br/>" +
              "<b>Layer Name</b>: " +
              popupLayerName +
              "<br/>" +
              "<b>Feature ID</b>: ${FID}<br/>"
          );

          //pilot points
        } else if (result.layerId == 8 || result.layerId == 9) {
          var template = new esri.InfoTemplate(
            "Pilot Points",
            "<b>Layer Name</b>: " +
              popupLayerName +
              "<br/>" +
              "<b>Type</b>: ${type}<br/>" +
              "<b>Layer</b>: ${layer}<br/>" +
              "<b>Point Name</b>: ${parameter}<br/>" +
              "<b>Value</b>: ${value}<br/>" +
              "<b>Zone</b>: ${zone}<br/>"
          );

          //Overland Flow
        } else if (result.layerId == 11) {
          var template = new esri.InfoTemplate(
            "Overland Flow",
            "<b>Segment</b>: ${segment}<br/>"
          );

          //streamflow Routing Cells
        } else if (result.layerId == 13) {
          var template = new esri.InfoTemplate(
            "Streamflow Routing Cells",
            "<b>Reach</b>: ${reach}<br/>" +
              "<b>Segment</b>: ${segment}<br/>" +
              "<b>Elevation</b>: ${sb_elev}<br/>"
          );

          //Recharge Raster
        } else if (result.layerId == 26) {
          var pixelValue = result.feature.attributes["Pixel Value"];
          var template = new esri.InfoTemplate(
            "Recharge Pixel",
            "<b>Value: </b>" + pixelValue + " inches/year </br>"
          );

          //Horizontal Hydraulic Conductivity
        } else if (result.layerId >= 27 && result.layerId <= 31) {
          var pixelValue = result.feature.attributes["Pixel Value"];
          var template = new esri.InfoTemplate(
            "Results",
            "<b>Horizontal Hydraulic Conductivity: </b>" +
              pixelValue +
              " (feet/day) </br>"
          );

          //Vertical Hydraulic Conductivity
        } else if (result.layerId >= 32 && result.layerId <= 36) {
          var pixelValue = result.feature.attributes["Pixel Value"];
          var template = new esri.InfoTemplate(
            "Results",
            "<b>Vertical Hydraulic Conductivity: </b>" +
              pixelValue +
              " (feet/day) </br>"
          );

          //LOG Horizontal Hydraulic Conductivity
        } else if (result.layerId >= 37 && result.layerId <= 41) {
          var pixelValue = result.feature.attributes["Pixel Value"];
          var template = new esri.InfoTemplate(
            "Results",
            "<b>Horizontal Hydraulic Conductivity: </b>" +
              pixelValue +
              " (log feet/day) </br>"
          );

          //LOG Vertical Hydraulic Conductivity
        } else if (result.layerId >= 47 && result.layerId <= 46) {
          var pixelValue = result.feature.attributes["Pixel Value"];
          var template = new esri.InfoTemplate(
            "Results",
            "<b>Horizontal Hydraulic Conductivity: </b>" +
              pixelValue +
              " (log feet/day) </br>"
          );

          //handle other rasters that have result.layerName == "" || result.layerName == undefined
        } else {
          var pixelValue = result.feature.attributes["Pixel Value"];
          var template = new esri.InfoTemplate(
            "Raster Query",
            "<b>Pixel Value</b>: ${Pixel Value} </br>" +
              "<b>Layer Service ID<b>: " +
              layerid +
              "</br>"
          );
        }

        //ties the above defined InfoTemplate to the feature result returned from a click event
        feature.setInfoTemplate(template);

        //returns the value of feature, which is the result of the click event
        return feature;
      });
    });

    //sets the content that informs the info window to the previously established "deferredResult" variable.
    map.infoWindow.setFeatures([deferredResult]);
    //tells the info window to render at the point where the user clicked.
    map.infoWindow.show(evt.mapPoint);
  }
  //end executeSiteIdentifyTask method

  //Geocoder reference to geocoding services
  locator = new esri.tasks.Locator(
    "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer"
  );
  //calls the function that does the goeocoding logic (found in geocoder.js, an associated JS module)*
  dojo.connect(locator, "onAddressToLocationsComplete", showResults);
}
//end of init function

//mapReady function that fires when the first or base layer has been successfully added to the map. Very useful in many situations. called above by this line: dojo.connect(map, "onLoad", mapReady)
function mapReady(map) {
  //Sets the globe button on the extent nav tool to reset extent to the initial extent.
  dijit.byId("extentSelector").set("initExtent", map.extent);

  dojo.style("loadingScreen", "opacity", "0.75");
  var loadingUpdate = dojo.connect(map, "onUpdateStart", function () {
    dojo.style("loadingScreen", "visibility", "visible");
  });

  dojo.connect(map, "onUpdateEnd", function () {
    //commented out because of DropDown loading-- look at AllDone()
    dojo.style("loadingScreen", "visibility", "hidden");
    dojo.disconnect(loadingUpdate);

    dojo.connect(map, "onUpdateStart", function () {
      dojo.style("refreshScreen", "visibility", "visible");
    });

    dojo.connect(map, "onUpdateEnd", function () {
      dojo.style("refreshScreen", "visibility", "hidden");
    });
  });

  //Create scale bar programmatically because there are some event listeners that can't be set until the map is created.
  //Just uses a simple div with id "latLngScaleBar" to contain it
  var latLngBar = new wim.LatLngScale({ map: map }, "latLngScaleBar");
}

//function to iterate through allLayers array and build array for legend as well as array for adding services based on esri and wim specific options
function addAllLayers() {
  for (layer in allLayers) {
    if (allLayers[layer].wimOptions.type == "layer") {
      console.log(layer);
      var newLayer;
      if (allLayers[layer].wimOptions.layerType == "agisFeature") {
        newLayer = new esri.layers.FeatureLayer(
          allLayers[layer].url,
          allLayers[layer].arcOptions
        );
      } else if (allLayers[layer].wimOptions.layerType == "agisWMS") {
        newLayer = new esri.layers.WMSLayer(
          allLayers[layer].url,
          allLayers[layer].arcOptions
        );
        if (
          allLayers[layer].wimOptions.includeLegend == true &&
          allLayers[layer].wimOptions.staticLegendOptions.hasStaticLegend ==
            true
        ) {
          var staticLegendImage = dojo.doc.createElement("div");
          staticLegendImage.id = allLayers[layer].arcOptions.id + "Legend";
          staticLegendImage.innerHTML =
            '<b style="">' +
            allLayers[layer].wimOptions.staticLegendOptions.legendTitle +
            '</b><br/><img style="padding-top: 10px; width: ' +
            (parseInt($("#explanation").width()) - 25).toString() +
            'px" src="' +
            allLayers[layer].wimOptions.staticLegendOptions.legendUrl +
            '" />';
          dojo.place(staticLegendImage, dojo.byId("legendDiv"), "after");
          if (allLayers[layer].arcOptions.visible == false) {
            $("#" + staticLegendImage.id).hide();
          }
        }
      } else {
        newLayer = new esri.layers.ArcGISDynamicMapServiceLayer(
          allLayers[layer].url,
          allLayers[layer].arcOptions
        );
        if (allLayers[layer].visibleLayers) {
          newLayer.setVisibleLayers(allLayers[layer].visibleLayers);
        }
      }

      //set wim options
      if (allLayers[layer].wimOptions) {
        if (allLayers[layer].wimOptions.includeInLayerList == true) {
          if (
            allLayers[layer].wimOptions.layerOptions &&
            allLayers[layer].wimOptions.layerOptions.selectorType == "radio"
          ) {
            radioGroup = allLayers[layer].wimOptions.layerOptions.radioGroup;
            radioGroupArray.push({ group: radioGroup, layer: newLayer });

            addToObjects(
              {
                layer: newLayer,
                type: "layer",
                title: layer,
                toggleType: "radio",
                group: radioGroup,
              },
              allLayers[layer].wimOptions
            );
          } else {
            addToObjects(
              {
                layer: newLayer,
                type: "layer",
                title: layer,
                toggleType: "checkbox",
                group: "",
              },
              allLayers[layer].wimOptions
            );
          }
        }
      } else {
        addToObjects(
          { layer: newLayer, title: layer },
          allLayers[layer].wimOptions
        );
      }
      layerArray.push(newLayer);
    } else if (allLayers[layer].wimOptions.type == "radioParent") {
      radioGroup = allLayers[layer].wimOptions.layerOptions.radioGroup;
      radioGroupArray.push({ group: radioGroup, layer: null });

      // ORIGINAL  layersObject.push({layer:null, type: "radioParent", title: layer, toggleType: "radioParent", group: radioGroup});
      if (allLayers[layer].wimOptions.infoButton != undefined) {
        if (allLayers[layer].wimOptions.visible == true) {
          var checked = allLayers[layer].wimOptions.visible;
          var infoButtonText = allLayers[layer].wimOptions.infoButton;
          layersObject.push({
            layer: null,
            type: "radioParent",
            title: layer,
            toggleType: "radioParent",
            group: radioGroup,
            infoButtonText: infoButtonText,
            checked: checked,
          });
        } else {
          var infoButtonText = allLayers[layer].wimOptions.infoButton;
          layersObject.push({
            layer: null,
            type: "radioParent",
            title: layer,
            toggleType: "radioParent",
            group: radioGroup,
            infoButtonText: infoButtonText,
          });
        }
      } else {
        layersObject.push({
          layer: null,
          type: "radioParent",
          title: layer,
          toggleType: "radioParent",
          group: radioGroup,
        });
        if (allLayers[layer].wimOptions.visible == true) {
          var checked = allLayers[layer].wimOptions.visible;
          layersObject.push({
            layer: null,
            type: "radioParent",
            title: layer,
            toggleType: "radioParent",
            group: radioGroup,
            checked: checked,
          });
        } else {
          layersObject.push({
            layer: null,
            type: "radioParent",
            title: layer,
            toggleType: "radioParent",
            group: radioGroup,
          });
        }
      }
    } else {
      //for heading label only
      //push infoButton text into layerObject array for NON-RADIOPARENT Headings
      if (allLayers[layer].wimOptions.infoButton != undefined) {
        var infoButtonText = allLayers[layer].wimOptions.infoButton;
        layersObject.push({
          layer: "heading",
          title: layer,
          infoButtonText: infoButtonText,
        });
      } else {
        layersObject.push({ layer: "heading", title: layer });
      }
    }
  }

  map.addLayers(layerArray);

  function addToObjects(fullObject, wimOptions) {
    layersObject.push(fullObject);
    if (wimOptions.includeLegend != false) {
      legendLayers.push(fullObject);
    }
  }
}

// USGS Logo click handler function
function showUSGSLinks(evt) {
  //check to see if there is already an existing linksDiv so that it is not build additional linksDiv. Unlikely to occur since the usgsLinks div is being destroyed on mouseleave.
  if (!dojo.byId("usgsLinks")) {
    //create linksDiv
    var linksDiv = dojo.doc.createElement("div");
    linksDiv.id = "usgsLinks";
    //LINKS BOX HEADER TITLE HERE
    linksDiv.innerHTML = '<div class="usgsLinksHeader"><b>USGS Links</b></div>';
    //USGS LINKS GO HERE
    linksDiv.innerHTML += "<p>";
    linksDiv.innerHTML +=
      '<a style="color:white" target="_blank" href="https://www.usgs.gov/">USGS Home</a><br />';
    linksDiv.innerHTML +=
      '<a style="color:white" target="_blank" href="https://www.usgs.gov/ask/">Contact USGS</a><br />';
    linksDiv.innerHTML +=
      '<a style="color:white" target="_blank" href="https://search.usgs.gov/">Search USGS</a><br />';
    linksDiv.innerHTML +=
      '<a style="color:white" target="_blank" href="https://www.usgs.gov/laws/accessibility.html">Accessibility</a><br />';
    linksDiv.innerHTML +=
      '<a style="color:white" target="_blank" href="https://www.usgs.gov/foia/">FOIA</a><br />';
    linksDiv.innerHTML +=
      '<a style="color:white" target="_blank" href="https://www.usgs.gov/laws/privacy.html">Privacy</a><br />';
    linksDiv.innerHTML +=
      '<a style="color:white" target="_blank" href="https://www.usgs.gov/laws/policies_notices.html">Policies and Notices</a></p>';

    //place the new div at the click point minus 5px so the mouse cursor is within the div
    linksDiv.style.top = evt.clientY - 5 + "px";
    linksDiv.style.left = evt.clientX - 5 + "px";

    //add the div to the document
    dojo.byId("map").appendChild(linksDiv);
    //on mouse leave, call the removeLinks function
    dojo.connect(dojo.byId("usgsLinks"), "onmouseleave", removeLinks);
  }
}

//remove (destroy) the usgs Links div (called on mouseleave event)
function removeLinks() {
  dojo.destroy("usgsLinks");
}

dojo.ready(init);
//IMPORTANT: while easy to miss, this little line above makes everything work. it fires when the DOM is ready and all dojo.require calls have been resolved.
//Also when all other JS has been parsed, as it lives here at the bottom of the document. Once all is parsed, the init function is executed*
