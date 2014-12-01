// TODO this does not work unless require and system are available 
//var log = function () {
//	require('system').system.stderr.write(Array.prototype.join.call(arguments, ' ') + '\n');
//}

// psudo logging function to get testing runtime values
var log = function(msg) {
	expect('Logging: >>>> ' + msg +' <<<<      ignore this over here->').not.toBeDefined()
}


//TODO why do I have to place this here rather than adding it to the module ?
//TODO why is this necessary to get proper angular.$compile ?
var testCtrl = function($scope) {}

// simple placeholder noop function
var noop = function(){}

// OpenLayers mock instance - there are few test we plan to target OpenLayers
var OpenLayers = {
	Control : {
		DragPan       : noop,
		DrawFeature   : function() { return {
			handler   : {callbacks:{}},
			events    : {register:noop}
		}},
		LayerSwitcher : noop,
		MousePosition : noop,
	},
	Handler : {
		RegularPolygon : noop,		
	},
	LonLat  : noop,
	Layer   : {
		ArcGIS93Rest:function() { return {
			setVisibility : noop,
			events        : {register:noop},
		}},
		WMS   : noop,
		Vector: noop,
	},
	Map     : function() { return {
		addControl   : noop,
		addLayers    : noop,
		setBaseLayer : noop,
		setCenter    : noop,
	}},
	Pixel   : noop,
}
OpenLayers.Control.LayerSwitcher


// commence testing directives file
describe("simple content directives: ", function() {

	var $scope, $httpBackend, intialTemplateCacheSize, jsonCache
	
	// json files to pre-load
	var jsonFiles = ['vocab'];
	
	// simple default template for testing directive template injection
	var defaultTmpl  = '<div ng-controller="testCtrl" attribute>elements</div>';

	// template files to pre-load
	var templates    = [
	                    'navHome',
	                    'navSearch',
	                    'contentHome',
	                    'contentAsianCarp',
	                    'contentInvasive',
	                    'contentSearch',
	                    
	                    'contentProjectDetail',
	                    'contentFocusArea',
	                    'contentPublications',
	                    'contentProjectLists',
	                    'glriLoading',
	                    
	                    'project-record',
	                    'pager',
	                    'pager-controls',
	                   ]

	
	// helper function for constructing test templates
	var insert = function(field, value, template) {
		if ( isDefined(value) ) {
			return template.replace(field,value)
		}
		return template
	}
	
	
	// in order to test angularjs controllers and directive the HTML must be 'compiled'
    var compileTemplate = function(scope, config, callback) {
    	// default template
        var template = isDefined(config.template) ?config.template :defaultTmpl;

        template = insert('attribute', config.attribute, template)
        template = insert('elements',  config.elements,  template)
        
        // inject the template into angular to compile
        inject(function($compile) {
            var el = $compile(template)(scope)[0]
            // angular does this when in apps but not in tests
            scope.$digest()
            callback( $(el) )
        })
    }
	

	// build the module, preserve the scope, and pre-load template HTML files
	beforeEach(function () {
		module("GLRICatalogApp")
		
		inject(function($rootScope,$httpBackend){
			$scope = $rootScope
			$httpBackend = $httpBackend
		})
		
	    // backend definition common for all tests
	    authRequestHandler = $httpBackend.when('GET', '/auth.py')
	                           .respond({userId: 'userX'}, {'A-Token': 'xxx'});
		
		inject(function($templateCache) {
			intialTemplateCacheSize = $templateCache.info().size
			
			var templateUrl  = 'templates/'
			var templatePath = 'src/main/webapp/' + templateUrl

			templates.forEach(function(template) {
				var req    = new XMLHttpRequest()
			    req.onload = function() {
			        var templateSrc = this.responseText
			    	$templateCache.put(templateUrl + template + ".html", templateSrc)
			    }
			    // Note that the relative path may be different from your unit test HTML file.
			    // Using `false` as the third parameter to open() makes the operation synchronous.
			    req.open("get", templatePath + template + ".html", false)
			    req.send()
			})
		})
		
		inject( function() {
			var jsonPath  = 'test/resources';
			jsonCache     = {};
			
			jsonFiles.forEach(function(file) {
				var req    = new XMLHttpRequest()
			    req.onload = function() {
			    	jsonCache[file] = this.responseText
			    }
			    // Note that the relative path may be different from your unit test HTML file.
			    // Using `false` as the third parameter to open() makes the operation synchronous.
			    req.open("get", jsonPath + file + ".json", false)
			    req.send()
			})
		})

	})

	
	// simple test to ensure that the templates HTML files have been pre-loaded
	// when angular makes a fetch call for a template it is already present
	it('should load directive templates' , inject(function($templateCache) {
		// initial template count
		expect( $templateCache ).toBeDefined();
		expect( intialTemplateCacheSize ).toBeDefined();
		// final template count
		expect( intialTemplateCacheSize !== $templateCache.info().size  ).toBeTruthy()
		expect( intialTemplateCacheSize + templates.length === $templateCache.info().size  ).toBeTruthy()
	}))
	
	
	// simple test to ensure that the json files have been pre-loaded
	it('should load json test data' , inject(function($templateCache) {
		// initial template count
		expect( jsonCache ).toBeDefined()
		expect( intialTemplateCacheSize !== $templateCache.info().size  ).toBeTruthy()
		expect( Object.keys(jsonCache).length ).toBe(jsonFiles.length)
	}))
	

	// ensure that the prevent-default directive prevents default and propagation
	it(' - prevent-default directive - should call event.preventDefault() and event.stopPropogation() for click events' , inject(function() {
		compileTemplate($scope, {template:'<button prevent-default>ButtonLabel</button>'}, function(el) {
			var preventDefault  = spyOn(Event.prototype, "preventDefault")
			var stopPropagation = spyOn(Event.prototype, "stopPropagation")

			el.simulate('click', {})
			
			expect(preventDefault).toHaveBeenCalled()
			expect(stopPropagation).toHaveBeenCalled()
		})
	}))


	it(' - glri-nav-home directive - should inject template content' , inject(function() {
		compileTemplate($scope, {elements:'<glri-nav-home></glri-nav-home>'}, function(el) {
			var html = el.html()
			expect( html.indexOf('id="navHome"') > 0 ).toBeTruthy()
		})
	}))
	
	
	it(' - glri-home contect directive - should inject template content' , inject(function() {
		compileTemplate($scope, {elements:'<glri-home></glri-home>'}, function(el) {
			var html = el.html()
			expect( html.indexOf('id="contentHome"') > 0 ).toBeTruthy()
		})
	}))

	
	it(' - glri-nav-search directive - should inject template content' , inject(function() {
		
		$httpBackend.when('ScienceBaseVocabService?parentId=53da7288e4b0fae13b6deb73&format=json')
		.respond(jsonCache.vocab);
		
		compileTemplate($scope, {elements:'<glri-nav-search></glri-nav-search>'}, function(el) {
			var html = el.html()
			expect( html.indexOf('id="sb-query-form"') > 0 ).toBeTruthy()
		})
	}))
	
	
	it(' - glri-search contect directive - should inject template content' , inject(function() {
		compileTemplate($scope, {elements:'<glri-search></glri-search>'}, function(el) {
			var html = el.html()
			expect( html.indexOf('id="searchResults"') > 0 ).toBeTruthy()
		})
	}))

	
	it(' - glri-asian-carp contect directive - should inject template content' , inject(function() {
		compileTemplate($scope, {elements:'<glri-asian-carp></glri-asian-carp>'}, function(el) {
			var html = el.html()
			expect( html.indexOf('id="contentAsianCarp"') > 0 ).toBeTruthy()
		})
	}))

	
	it(' - glri-search contect directive - should inject template content' , inject(function() {
		compileTemplate($scope, {elements:'<glri-invasive></glri-invasive>'}, function(el) {
			var html = el.html()
			expect( html.indexOf('id="contentInvasive"') > 0 ).toBeTruthy()
		})
	}))
	
	
})