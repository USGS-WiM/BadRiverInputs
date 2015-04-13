/*
	Copyright: 2014 WiM - USGS
	Author: Erik Myers USGS Wisconsin Internet Mapping
	Created: January, 2014	
*/


dojo.provide("wim.TabbedSearch");

dojo.require("dijit._Container");
dojo.require("dijit._TemplatedMixin");
dojo.require("dijit._OnDijitClickMixin");
dojo.require("dijit._WidgetBase");




dojo.declare("wim.TabbedSearch", [ dijit._WidgetBase, dijit._OnDijitClickMixin, dijit._Container, dijit._TemplatedMixin ],
{
	templatePath: dojo.moduleUrl("wim","templates/TabbedSearch.html"),
	
	/* Define your component custom attributes here ... */
	baseClass: "tabbedSearch",
	title: "coolContainer",
	titleImageUrl: null,
	
	getContentNode: function() {
		return this.containerNode;
	},
	
	constructor: function() {
		//console.log('hello TabbedsearchDijit')
	},	
		
		
});