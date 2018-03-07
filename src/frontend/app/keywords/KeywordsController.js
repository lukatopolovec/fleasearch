'use strict';
// controller is intermidiate between html index and javascript functions

(function(){ 

	var app = angular.module('app'); //we get app as module

	app.controller("KeywordsController", function($scope, RepositoryFactory){ 
		 //RepositoryFactory is connections between this controller and REST apis. In previous example we would need two; one for categories and one for keywords
		 var StudentRepository = new RepositoryFactory({
		 	endpoint:'getstudents', //inicializing new RepositoryFactory instance and providing endpoints 
		 	retrieveItems: function(data){  //This is a callback function that returns the data
		 		 		return data._items; //a list of students, mentors and theses names is return here. 
		 	}	
		 });

	// //readAll funtion is executed before the upper retrieveItems functions. Probably because it's a callback. 
	StudentRepository.readAll().then(function(studentDetailsList){ 
		$scope.keywords = studentDetailsList;
	

	});
	//this is grid settings section

	$scope.keywordsGridOptions = {
		data:'keywords', //this makes the grid use the data in $scope.keywords
		enableCellSelection: false,
		enableCellEdit: true,
		keepLastSelect: false,
		enableRowSelection: false,
		multiSelect:false,
		enableSorting:true,
		enableColumnResize:true,
		enableColumnReordering:true,

		showFilter:false,
		rowHeight:'40',
		columnDefs:[
		{
			field:'id',
			displayName:'ID',
			enableCellEdit:false,
			width: '40px'
		},
		{
			field:'student',
			displayName:'Students',
			width: '130px'

		},
		{
		field:'titletheses', 
		displayName:'Theses title'
	},
	{
		field:'mentor',
		displayName:'Mentor'
	},
	{
		field:'dateadded',
		displayName:'Date added'
	},
	{
		field:'',
		displayName: 'Operations',
		cellTemplate: 'app/keywords/partials/operationsGridCell.html',
		enableCellEdit: false,
		sortable:false
	}
	]

};

//Create keyword function
$scope.createKeyword = function(newKeyword){
	

	$scope.$broadcast('ngGridEventEndCellEdit'); 

	if(newKeyword.value.length>0){
		KeywordsRepository.createOne(newKeyword).then(function(){
			KeywordsRepository.readAll().then(function(keywords){
				$scope.keywords = keywords;

			});

		});


	}
};


$scope.exampleFunction = function(message){

	alert("Example of calling function: "+message);
};


$scope.updateKeyword = function(keyword){



/*
	event listener bus
	$rootScope.$broadcast("hi");
	$rootScope.$on("hi", function(){
    
*/


	$scope.$broadcast('ngGridEventEndCellEdit'); 
	KeywordsRepository.updateOne(keyword);
};



$scope.deleteKeyword = function(keyword){
	$scope.$broadcast('ngGridEventEndCellEdit'); //ng is modul. This function is the same for update/create/delete
	KeywordsRepository.deleteOne(keyword).then(function(){ //first it executes on function, after that another
		KeywordsRepository.readAll().then(function(keywords){
			$scope.keywords = keywords;
		});

	});
};


// to have a clean behaviour for grid

 $scope.stopEditingKeywordCategory = function(){
 	$scope.$broadcast('ngGridEventEndCellEdit');
 };

 $scope.$on('ngGridEventRows', function(newRows){
 	$scope.$broadcast('ngGridEventEndCellEdit');

 });

});


})();