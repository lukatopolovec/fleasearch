'use strict';
var Percolator = require('percolator').Percolator; //easy to generate API
const https = require('https');
var request = require('request');
var dbSession = require('../../src/backend/dbSession.js');
var cheerio = require('cheerio');
var express = require('express');
var Moment = require('moment');
var schedule = require('node-schedule');
var fs = require('fs');
var jstoxml = require('jstoxml');
const Feed = require('feed')
var AWS = require("aws-sdk");

var Server = function(port){  //defining server for export
	var server = Percolator({'port':port, 'autoLink':false, 'staticDir':__dirname+'/../frontend'}); 
	var s3 = new AWS.S3({'region':'eu-west-1'});

	var rule = new schedule.RecurrenceRule();
	rule.seconds = [0,new schedule.Range(41,20,30,40,50)]; //how frequently should we start a new run job on parsehub. Every 3 minute
	//rule.seconds = 5; //vsako minuto

	var casZacetek = 0; 
	var vmesniCas = 0; 
	//var j = schedule.scheduleJob(rule, function(){
	var j = schedule.scheduleJob('55 * * * *', function(){

	
		console.log("ParseHub job started - it takes some time to get result: "+ Date.now());

				runParseEvent(function(parseHubJobValues){
					console.log(parseHubJobValues.run_token + ":date" + parseHubJobValues.start_time) ;

						setTimeout(function () { 
							console.log('Parse hub - read results - setTimeout'); 

							getDataFromBolhaWebPage(parseHubJobValues.run_token);

						}, 1000*60*2);  

				 });


	});

	

	//getDataFromBolhaWebPage(parseHubJobValues.run_token);
	// getDataFromBolhaWebPage("tPqkdthtx5YK");



function uploadXMLtoBucket(xml)
{
		var params = {
		Key: "rssbolhafeed_new.xml",
		Bucket:"nodelukacrawlers",
		Body: xml,
		ACL:"public-read",
	}

	s3.putObject(params, function(err,data){
		if(err){
			    console.log(err);
		}
		else {
			console.log("Uspesno shranjeno na AWS");
		}

	});			
}



	server.route('/api/getstudents',{


		GET:function(req,res){
			console.log("smo v apiju get students");
			dbSession.fetchAll('Select id, student, titletheses, mentor, dateadded FROM student', function(err, rows){
				if(err)
				{
					console.log(err);
					res.status.internalServerError(err);
				} else
				{
					res.collection(rows).send();
				}
			});			
		}

	});


	server.route('/luka',{
			GET:function(req,res){
			console.log("smo v apiju get students");
		}
	});

	function runParseEvent(callback){

	//we need api key and project
	var opts = {
		uri: 'https://www.parsehub.com/api/v2/projects/tD0rUmnohUTf/run?api_key=twAgSfGzzLtgax_mVwPvSfX8',
		gzip: true,
		json:true
	}

	request.post(opts, function (err, res, body) {
	 		// now body and res.body both will contain decoded content.	 		
	 		var parseHubJobValues = {'run_token': body.run_token, 'start_time': body.start_time}
	 		callback(parseHubJobValues);

	 	}).on('error',(e)=>{
	 		console.error(e);
	 	});

	 }




	 function getDataFromBolhaWebPage(lastRunToken)
	 {
	 	console.log("smo v getDataFromBolhaWebPage:"+lastRunToken);

	 	var opts = {
	 		uri: 'https://www.parsehub.com/api/v2/runs/'+lastRunToken+'/data?api_key=twAgSfGzzLtgax_mVwPvSfX8',
	 		gzip: true,
	 		json:true
	 	}

	 	request(opts, function (err, res, body) {
 		// now body and res.body both will contain decoded content.
 		//writeThesesInDB(body.zadnjeDiplome,res);
 		console.log("pred funkcijo");
 		if(!body.seznam_nepremicnin||body.seznam_nepremicnin.length>0)
 		{
 			console.log("ni prazno" + body);
 			writeThesesInDB(body.seznam_nepremicnin,res);
		}

 	}).on('error',(e)=>{
 		console.error(e);
 	});
 }


 function writeThesesInDB(thesesJson,res)
 {
 	console.log("smo v writeThesesInDB");
 	var inProgress = 0;
	var numberOfNepremicninAdded = 0;
	var jsonToRSS = [];


 	thesesJson.forEach(function(item, index){ 	
 		//we check if the item is already added to db

 		console.log("For each:"+item.url);

 		dbSession.fetchAll('SELECT * FROM bolha WHERE url = ?', item.url, function (err, results) {
 			if (results.length<=0)
 			{

 				
 				//this item doesn't exist yet (that's good)
 				
					dbSession.query('INSERT into bolha (name,url,cena,url_slike) VALUES (?,?,?,?);',
		  				[item.name,item.url ,item.cena,item.url_slike], function(err,results){  		  					
  		  					if(err){
  		  						console.log("Napaka pri dodajanju nepremicnine:"+err);
  		  					} else{
  		  						console.log("Nova nepremicnina dodana v seznam:"+item.name);  		
  		  						numberOfNepremicninAdded++;
  		  						jsonToRSS.push([item.name,"",item.url ,item.cena,item.url_slike]);	  	


  		  					}
  		  					inProgress++;
  		  						//if this was the last item, export to json
		  						if(inProgress==Object.keys(thesesJson).length){
		  							//call callback end of query  		  						
		  							exportNewThesisToRSS(jsonToRSS);
		  							console.log("konec");
		  						}
		  					});				 
  		  		} 
  		  		else {
  		  				inProgress++;
  		  						//if this was the last item, export to json
		  						if(inProgress==Object.keys(thesesJson).length){
		  							//call callback end of query  		  						
		  							exportNewThesisToRSS(jsonToRSS);
		  							console.log("konec2");
		  						}
		  			console.log("kriticna napaka");
  		  		} 		  		
  		  });	 
  		

 	}); 	 		
 
}

 function exportNewThesisToRSS(listOfNewBolha)
 {
 	var date = new Date();
 	console.log("export theses");
 	console.dir(listOfNewBolha);
 	if(listOfNewBolha.length>0){
  		console.log("Dodali smo nove diplome - funkcija:"+listOfNewBolha.length);
 	

 		let feed = new Feed({
 			title: 'Nove nepremicnine v Mariboru iz bolhe',
 			link: 'https://s3-eu-west-1.amazonaws.com/nodelukacrawlers/rssbolhafeed_new.xml',
 			updated : date

 		});

 		listOfNewBolha.forEach(function(item)	{
 			feed.addItem({
 				title : item[3]+";"+ item[0],
 				link : item[2],
 				guid : item[2],
 				date: date				

 			});
 		});
 		console.log("ZAKLJUCEK ");	 		
		//console.log(feed.rss2());

		uploadXMLtoBucket(feed.rss2());
		
			
 	}

 }





 return server;
};




module.exports = {'Server':Server};