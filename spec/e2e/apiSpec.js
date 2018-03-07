'use strict';
var request = require('request');
var dbSession = require('../../src/backend/dbSession.js');
var Server = require('../../src/backend/server.js').Server; //importamo server

var resetDatabase = require('../resetDatabase.js');
var async = require('async');



//to je za Jasmine test framework

describe('The API', function (){


var server; //očitno moremo definirat cel server

beforeEach(function(done){
server = Server('8081'); //testing framework bo imel različni port
server.listen(function(err){
	resetDatabase(dbSession, function(){ //ko je fertik to vrne
		console.log("pobrisana baza");
		done(err);

	});

});

});

 //pomeni da za vsak server ? 
 afterEach(function (done){
 	server.close(function(){
 		resetDatabase(dbSession, function(){
 			done();
 		});

 	});

 });


 it('should respond to a Get request at /api/keywords', function(done){

 	var expected = {
 		"_items":[
 		{'id':1, 'value':'Aubergine', 'categoryID':1},
 		{'id':2, 'value':'Onion', 'categoryID':1},
 		{'id':3, 'value':'Knife', 'categoryID':2}
 		]};


 		async.series(
 			[
			//vstavimo nov podatke
			function(callback){
					resetDatabase(dbSession,callback); //resetanje očitno deluje, kar je kul
				},
				function(callback){
					dbSession.insert(
						'keyword',
						{'value':'Aubergine', 'categoryID':1},
						function(err) { callback(err)});					
				},

				function(callback){
					dbSession.insert(
						'keyword', {'value':'Onion', 'categoryID':1},
						function(err){callback(err)});
				},
				function(callback){
					dbSession.insert(
						'keyword', {'value':'Knife', 'categoryID':2},
						function(err){callback(err)});
				}

				],
				//preberemo podatke
				function(err, results){
					request.get({
						'url':'http://localhost:8081/api/keywords/',
						'json':true
					},
					//naredimo če je vredu
					function(err, res,body) {
						expect(res.statusCode).toBe(200);
						expect(body).toEqual(expected);
						done();
					});
				});

 	});




 it('should respond to a get request at /api/keywords/categories/',function(done){

 	var expected = {
 		"_items":[
 		{'id':1, 'name':'Vegatable'},
 		{'id':2, 'name': 'Utility'}
 		]};

 		async.series(
 			[

 			function(callback){
 				resetDatabase(dbSession, callback);
 			},

 			function(callback){
 				dbSession.insert('category', {'name':'Vegatable'},
 					function(err){ callback(err) });
 			},
 			function(callback){
 				dbSession.insert(
 					'category',
 					{'name':'Utility'},
 					function(err){ callback(err) });
 			},



 			],
 			function(err,results){
 				if(err) throw(err);
 				request.get(
 				{
 					'url':'http://localhost:8081/api/keywords/categories/',
 					'json':true

 				},
 				function(err,res,body){
 					expect(res.statusCode).toBe(200);
 					expect(body).toEqual(expected);
 					done();

 				}

 				);

 			}
 			);


 	});


 it('should create a new keyword when receiving a POST request at /api/keywords',function(done){

 	var expected = {
 		"_items":[
 		{'id':1, 'value':'Aubergine', 'categoryID':1},
 		{'id':2,'value':'Onion','categoryID':1}]
 	};

 	var body = {
 		'value':'Onion',
 		'categoryID':1
 	};

 	async.series(

 		[
 		function(callback){
 			dbSession.insert(
 				'category',
 				{'name':'Vegatable'},
 				function(err) {callback(err)});
 		},
 		function(callback){
 			dbSession.insert(
 				'keyword',
 				{'value':'Aubergine', 'categoryID':1},
 				function(err) {callback(err)});					
 		}
 		],

 		function(err,results){
 			if(err)throw(err);

		request.post(
		{

 			'url':'http://localhost:8081/api/keywords/:id',
 			'body':body,
 			'json':true
 		},
 		function(err,res,body){
 			if(err) throw(err);
 			expect(res.statusCode).toBe(200);
 			request.get(
 			{
 				'url':'http://localhost:8081/api/keywords/',
 				'json' : true

 			},
 			function(err,res,body){
 				expect(res.statusCode).toBe(200);
 				expect(body).toEqual(expected);
 				done();
 			}

 			);
 		}

 		);

 		});	
 });

});