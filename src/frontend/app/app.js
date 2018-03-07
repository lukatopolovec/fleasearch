'use strict'; 

//app.js is interface for the whole platform.
//this () brackets needs to be includedat start
(function(){

	var app = angular.module('app', ['ngRoute','ngGrid', 'restangular']); //we defined the app, with moduls and parameters for angular. In [] we put moduls we will use.
	//we have to set up app config
	app.config(['$routeProvider',

			function($routeProvider){

					//on the default url we bind KeywordController and editor as some sort of interface. If we change root destination, it's outmatically updated. Not sure why /#/ notation is put here. 
				$routeProvider.when('/',{  
					templateUrl: 'app/keywords/partials/editor.html',  
					controller: 'KeywordsController'  //this name needs to be a match inside KeywordsController.js (It's coincidance that filename is the same as controller name. It's not rule)

				});
			}]);
})();

//this defines the main entry point 
//