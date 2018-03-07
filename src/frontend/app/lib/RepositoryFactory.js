'use strict';

(function(){
	var app = angular.module('app');


	//module.factory ('factoryName', function)
	//if $q is removed, the RepositoryFactory_function is still called, but doesn't work correctly.
	//everything in [] brackets are arguments
	//q$ has to be with ''
	app.factory('RepositoryFactory',['Restangular','$q', RepositoryFactory_function]); //we add factory RepositoryFactoryFunction here so that controller can call her also.
  // $q = A service that helps you run functions asynchronously. From angular documentations
//defer means put for later time and is wrapper
function RepositoryFactory_function(Restangular,$q){ 
	Restangular.setBaseUrl('/api/');

	var Repository = function(options){
		this.endpoint = options.endpoint;
		this.retrieveItems = options.retrieveItems;
	};

	//this repository calls function that triggers get request. 
	Repository.prototype.readAll = function(){
		var self = this; //keywords/categories
		var deferred = $q.defer(); //deferred ? deferred ( promise:promise)=
		//case sensitive, take notice
		Restangular.all(self.endpoint + '/').doGET().then(function(data){
			var items = self.retrieveItems(data);
			//alert("First part"); //this alert would be triggered first
			deferred.resolve(items);
		});
		
		//alert("second part"); //this alert would be triggered second. After the premis is executed and function doGet gets value, only then the other part is called. 
		return deferred.promise; //we reutnr the premise
	};


	// //adding new function example
	// Repository.prototype.createOne = function(newItem){
	// 	var self = this;
	// 	var deferred = $q.defer();
	// 	console.log("createOne:"+self.endpoint )
	// 	Restangular.one(self.endpoint + '/1','').post('', newItem).then(function(response){
	// 		deferred.resolve(response);

	// 	});
	// 	return deferred.promise;
	// };



	return Repository;
}

})();
