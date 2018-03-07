'use strict';

var async = require('async');
var env = require('../src/backend/env');
var dbOptions = require('../database.json')[env];


var resetDatabase = function(dbSession, callback){

	if(dbOptions.driver === 'sqlite3'){
		async.series(
			[
			function(callback){
				console.log("odstranjeno: keyword");
				dbSession.remove('keyword','1', function(err){
					callback(err);

				});
			},

			function(callback){
				console.log("odstranjeno: category");
				dbSession.remove('category','1',function(err){
					callback(err);
				});
			},

			function(callback){
				console.log("odstranjeno: sqlite_sequence");
				dbSession.remove('sqlite_sequence','1',function(err){
					callback(err);
				});
			}

			],
			function (err, results){
				callback(err);
			}
			);
	}

		if(dbOptions.driver === 'mysql'){
		async.series(
			[
			function(callback){
				console.log("odstranjeno: keyword");   //truncate pomeni da vse pobriše
				dbSession.remove('TRUNCATE keyword',[], function(err){
					callback(err);

				});
			},

			function(callback){
				console.log("odstranjeno: category");
				dbSession.remove('TRUNCATE category',[],function(err){
					callback(err);
				});
			}

			],
			function (err, results){
				callback(err);
			}
			);
	}


	
};
module.exports = resetDatabase;

