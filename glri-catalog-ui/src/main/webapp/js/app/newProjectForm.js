$(document).ready(function() {
	  $('.datepickers').datepicker({
		    todayBtn      : true,
		    autoclose     : true,
		    todayHighlight: true,
		    startView     : 'year',
		    format        : "yyyy-mm-dd",
	  });
	
	  $("#dmPlan").select2Buttons({noDefault: true});
	  $("#project_status").select2Buttons({noDefault: true});
	  $("#duration").select2Buttons({noDefault: true});
	  $("#entry_type").select2Buttons({noDefault: true});
	  $("#spatial").select2Buttons({noDefault: true});
});


GLRICatalogApp.controller('NewProjectCtrl', 
['$scope', '$http', 'Status', 'ScienceBase',
function($scope, $http, Status, ScienceBase) {
	$scope.contactPattern = /^[\w\s]+ [\w\d\.]+@[\w\d]+\.\w+$/;
	$scope.newProject = {};
	$scope.login = {message:"",username:"",password:""}
	
	$scope.transient= Status;
	
	var authFailed = window.authFailed = function() {
		$.cookie("JOSSO_TOKEN", null);
		$scope.login.token   = undefined;
		$scope.login.message = "Login failed, please varify your email and password.";
	}
	
	var authSuccess = function(token) {
		$scope.login.token = token
		var date = new Date();
		date.setTime(date.getTime() + (120 * 60 * 1000)); 
		$.cookie("JOSSO_TOKEN", token, { expires: date });
		$scope.newProject.username = $scope.login.username
	}
	
	$scope.authenticate = function() {
		$scope.login.message = "Authenticating...";
		
		$http.post('login',{},{params: {username:$scope.login.username, password:$scope.login.password}})
		.then(
			function(resp) {
				if ( ! resp.data || resp.data.length != 32) {
					authFailed();
				} else {
					authSuccess(resp.data)
				}
			},
			authFailed
		);
	}
	
	$scope.discard = function() {
		$scope.newProject = {};
	}

	
	var saveFailed = function(resp) {
		alert("There was a problem saving the project -> " + resp.data);
	}
	
	var scrollTo = function(el) {
		var container  = $('body')
	    var scrollToIt = $(el);
		var scrollTop = {
		    scrollTop: scrollToIt.parent().parent().offset().top-5
		}
		
		container.animate(scrollTop);
		
		return scrollTop.scrollTop
	}
	
	
	var displayMsg = function(clas,loc) {
		$("."+clas).css('top',loc+5).delay(500).fadeIn(500);
		setTimeout(function() {$("."+clas).fadeOut(500);}, 5000);
	}
	
	var checkRequiredFields = function() {
		var requiredFields = $('.form-required');
		
		for (var f=0; f<requiredFields.length; f++) {
			var field = requiredFields[f]
			var modelBinding = $(field).attr('ng-model')
			if (modelBinding !== undefined) {
				var model = modelBinding.split('.')
				var value = $scope[model[0]][model[1]]
				if (value === undefined || value.length === 0) {
					var loc = scrollTo(field);
					displayMsg("form-msg-required", loc);
					return false;
				}
			}
		}
		return true;
	}
	
	
	$scope.save = function() {
		console.log($scope.newProject);

		if ("agree" !== $scope.newProject.dmPlan) {
			var loc = scrollTo($("#dmPlan"));
			displayMsg("form-msg-agree", loc);
		} else {
			if ( ! checkRequiredFields() ) {
				return;
			}
				
			var newProject = buildNewProject($scope.newProject);
			
			console.log(newProject);
			checkToken();
			if ($scope.login.token === undefined) {
				var loc = scrollTo($('#newProjectForm'));
				return;
			}
			
			$http.post('saveProject', newProject, {params:{auth:$scope.login.token}})
			.then(
				function(resp) {
					console.log(resp.data)
					if (resp.data === undefined) {
						saveFailed({data:"no response"})
					} else if (resp.data.indexOf("Missing")) {
						saveFailed(resp)
					} else {
						$scope.transient.newProjectId = resp.data
						setTimeout(function(){$('#gotoNewProject').click()},500)
					}
				},
				saveFailed
			)
		}
	}
	
	var select2focusArea = function(){
		if ( Status.focus_areas.length > 1 ) {
			var options = "";
			for (f in Status.focus_areas) { // value=" + focus.display + "
				options += "<option>"+Status.focus_areas[f].display+"</option>"
			}
			$("#focus_area").html(options);
			$("#focus_area").select2Buttons({noDefault: true});
		} else {
			setTimeout(select2focusArea,100);
		}
	}
	setTimeout(select2focusArea,100)
	
	var checkToken = function() {
		var token = $.cookie("JOSSO_TOKEN")
		if (token !== undefined && token.length==32) {
			$scope.login.token = token
		} else {
			$scope.login.token = undefined
		}
	}
	
	checkToken();
}]);


var concatIfExists = function(label, additional) {
	if (additional && additional.length>1) {
		return label + additional;
	}
	return "";
}


var parseContact = function(contact) {
	var name  = ""
	var email = contact.match(/\S+@\S+/);
	if (email && email[0]) {
		name  = contact.replace(email[0],'').trim();
	}
	if ( name!==undefined && name.length>1 &&
			email!==undefined && email[0]!==undefined && email[0].length>=5 ) {
		return {name:name, email:email[0]}
	}
	return undefined
}


var splitComma = function(text) {
	return text.split(/\s*,\s*/);
}


var CONTACT_PRINCIPAL = "Principal Investigator"
var CONTACT_CHIEF     = "Associate Project Chief"
var CONTACT_ORG       = "Cooperator/Partner"
var CONTACT_TEAM      = "Contact"

var createContact = function(type, contact) {
	var contact = parseContact(contact)
	
	if (contact === undefined) {
		return ""
	}
	
	contact.active = true
	contact.type = type
	contact.contactType= "person"
	if (CONTACT_ORG === type) {
		contact.contactType= "organization"
	}
	
	return angular.toJson(contact)
}

var concatContacts = function(type, contacts) {
	var contacts = splitComma(contacts)
	
	var jsonContacts = ""
	for (var c=0; c<contacts.length; c++) {
		jsonContacts += createContact(type, contacts[c])
	}
	return jsonContacts + (jsonContacts==="" ?"" :",")
}

var VOCAB_FOCUS    = "category/Great%20Lakes%20Restoration%20Initiative/GLRIFocusArea"
var VOCAB_KEYWORD  = "GLRI/keyword"
var VOCAB_SIGL     = "category/Great%20Lakes%20Restoration%20Initiative/SiGLProjectObjective"
var VOCAB_TEMPLATE = "category/Great%20Lakes%20Restoration%20Initiative/GLRITemplates"
var VOCAB_WATER    = "category/Great%20Lakes%20Restoration%20Initiative/GLRIWaterFeature"

	
var createTag = function(scheme, name) {
	var tag =
		'{'+
		    '"type": "Label",'+
		    '"scheme": "https://www.sciencebase.gov/vocab/'+scheme+'",'+
		    '"name": "'+name+'"'+
		'},'
	return tag;
}
var concatTagsComma = function(scheme, tags) {
	tags = splitComma(tags)
	
	var commaTags = ""
	for (var tag=0; tag<tags.length; tag++) {
		commaTags += createTag(scheme, tags[tag].trim())
	}
	return commaTags
}
var concatTagsSelect = function(scheme, tags) {
	var selectTags = ""
	for (var tag=0; tag<tags.length; tag++) {
		selectTags += createTag(scheme, tags[tag].display)
	}
	return selectTags
}


var buildNewProject = function(data) {
	
	var body = "";
	body += concatIfExists("<h4>Description of Work<\/h4> ", data.work);
	body += concatIfExists("<h4>Goals &amp; Objectives<\/h4> ", data.objectives);
	body += concatIfExists("<h4>Relevance &amp; Impact<\/h4> ", data.impact);
	body += concatIfExists("<h4>Planned Products<\/h4> ", data.product);
	
	var principal = concatContacts(CONTACT_PRINCIPAL,data.principal);
	var chief     = concatContacts(CONTACT_CHIEF,data.chief);
	var orgs      = concatContacts(CONTACT_ORG,data.organizations ||""); // optional
	var contacts  = concatContacts(CONTACT_TEAM,data.contacts ||""); // optional
	var allContacts = principal + chief + orgs + contacts
	if ( allContacts.endsWith(',') ) {
		allContacts = allContacts.substr(0,allContacts.length-1);
	}
	
	var focus     = concatTagsComma(VOCAB_FOCUS,data.focusArea);
	var keywords  = concatTagsComma(VOCAB_KEYWORD,data.keywords);
	var spatial   = concatTagsComma(VOCAB_KEYWORD,data.spatial);
	var entryType = concatTagsComma(VOCAB_KEYWORD,data.entryType);
	var duration  = concatTagsComma(VOCAB_KEYWORD,data.duration);
	
	var sigl      = concatTagsSelect(VOCAB_SIGL,data.SiGL);
	var water     = concatTagsSelect(VOCAB_WATER,data.water);
	var templates = concatTagsSelect(VOCAB_TEMPLATE,data.templates);

	var newProject =
	'{'+
	    '"title": "' +data.title+ '",'+
	    '"summary": "",'+
	    '"body": "' +body+ '",'+
	    '"purpose": "' +data.purpose+ '",'+
	    '"parentId": "52e6a0a0e4b012954a1a238a",'+
	    '"contacts": [' + allContacts + '],'+
	    '"browseCategories": ["Project"],'+
	    '"tags": [' + focus+ keywords + sigl + water + templates + spatial + entryType + duration +
	       '{"name": "Great Lakes Restoration Initiative"},'+
	       '{"type": "Creater","name": "'+ data.username +'"}'+
	    '],'+
	    '"dates": ['+
	        '{'+
	            '"type": "Start",'+
	            '"dateString": "'+data.startDate+'",'+
	            '"label": "Project Start Date"'+
	        '},'+
	        '{'+
	            '"type": "End",'+
	            '"dateString": "'+data.endDate+'",'+
	            '"label": "Project End Date"'+
	        '}'+
	    '],'+
	    '"facets": ['+
	        '{'+
	            '"projectStatus": "'+data.status+'",'+
	            '"projectProducts": [],'+
	            '"parts": [],'+
	            '"className": "gov.sciencebase.catalog.item.facet.ProjectFacet"'+
	        '}'+
	    '],'+
	    '"previewImage": {'+
	        '"thumbnail": {'+
	            '"uri": "'+data.image+'",'+
	            '"title": "Thumbnail"'+
	        '},'+
	        '"small": {'+
	            '"uri": "'+data.image+'",'+
	            '"title": "Thumbnail"'+
	        '},'+
	        '"from": "webLinks"'+
	    '}'+
    '}'
	
	return newProject
}
