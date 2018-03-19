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

	AWS.config.loadFromPath('awsconfig.json');
	var xmlFileName = "bolha&nepremicnine.xml";
	var s3 = new AWS.S3();
	var projectToken = "tVuHUUNHZrTO";

	var casZacetek = 0; 
	var vmesniCas = 0; 

	var j = schedule.scheduleJob('06 * * * *', function(){

	
		console.log("ParseHub job started - it takes some time to get result: "+ Date.now());

				runParseEvent(projectToken, function(parseHubJobValues){
					console.log(parseHubJobValues.run_token + ":date" + parseHubJobValues.start_time) ;

						setTimeout(function () { 
							console.log('Parse hub - read results - setTimeout'); 

							getDataFromBolhaWebPage(parseHubJobValues.run_token);

						}, 1000*60*5);  

				 });


	});

	// getDataFromBolhaWebPage("t53cKRgR6XCz");

function uploadXMLtoBucket(xml)
{
		var params = {
		Key: xmlFileName,
		Bucket:"nodelukacrawlers",
		Body: xml,
		ACL:"public-read",
	}

	s3.putObject(params, function(err,data){
		if(err){
			    console.log(err);
		}
		else {
			console.log("Uspesno shranjeno na S3 bucketu");
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

	function runParseEvent(TokenProject, callback){

	//we need api key and project
	var opts = {
		uri: 'https://www.parsehub.com/api/v2/projects/'+TokenProject+'/run?api_key=twAgSfGzzLtgax_mVwPvSfX8',
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
 	
 		
 		
 		if(typeof body.nepremicnine !== 'undefined' && body.nepremicnine !== null)
 		{
 		
			 		
 			writeThesesInDB(body.nepremicnine,res);
		}
		else 
		{
			console.log("Parsehub returned empty values");
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

	console.dir(thesesJson);
 	thesesJson.forEach(function(item, index){ 	
 		//we check if the item is already added to db
 	
 		dbSession.fetchAll('SELECT * FROM bolha WHERE url = ?', item.url, function (err, results) {
 			if (results.length<=0)
 			{ 				
 				//this item doesn't exist yet, we add it to the database
 				if(typeof item.Opis !== 'undefined')
 				{
 					item.naslov = item.naslov + " " + item.Opis;
 				}


					dbSession.query('INSERT into bolha (name,url,cena,url_slike) VALUES (?,?,?,?);',[item.naslov,item.url ,item.Cena,item.url_slike], function(err,results){  		  					
  		  					if(err){
  		  						console.log("There was an error adding to the database:"+err);
  		  					} else{
  		  						console.log("We've added new realestate to the database"+item.name);  		
  		  						numberOfNepremicninAdded++; 
  		  						jsonToRSS.push([item.naslov,"",item.url ,item.Cena,item.url_slike]);	  	 //we add it to the json.

  		  					}
  		  					inProgress++;
  		  						//if this was the last item, export to json
		  						if(inProgress==Object.keys(thesesJson).length){
		  							//call callback end of query  		  						
		  							exportNewThesisToRSS(jsonToRSS);
		  							console.log("Zadnja postaja v primeru da smo za konec dodali nepremicnino v postajo");
		  						}
		  					});				 
 				
  		  		} 
  		  		else {
  		  				inProgress++;
  		  						//if this was the last item, export to json
		  						if(inProgress==Object.keys(thesesJson).length){
		  							//call callback end of query  		  						
		  							exportNewThesisToRSS(jsonToRSS);
		  							console.log("Zadnja postaja da nismo dodali nepremicnine");
		  						}else {
		  								console.log("Nepremicnina je ze dodana v sistem, jo preskoci.");
		  						}		  		
  		  		} 		  		
  		  });	 
  		

 	}); 	 		
 
}

 function exportNewThesisToRSS(listOfNewBolha)
 {
 	var date = new Date();
 	console.log("New realestates:");
 	console.dir(listOfNewBolha);
 	if(listOfNewBolha.length>0){
  		console.log("Number of new realestates:"+listOfNewBolha.length); 	
  		console.log("S3 Adress:"+"https://s3-eu-west-1.amazonaws.com/nodelukacrawlers/"+xmlFileName);

 		let feed = new Feed({
 			title: 'Nove nepremicnine v Mariboru iz bolhe',
 			link: 'https://s3-eu-west-1.amazonaws.com/nodelukacrawlers/'+xmlFileName,
 			updated : date

 		});

 		listOfNewBolha.forEach(function(item)	{
		//sort by price - price

		var price;
	
		if(typeof item[3] == 'undefined')
		{
			item[3] = "";
		}

		price = item[3].replace('.','');
		price = price.replace('.','');		
		price = price.replace('€','');
		price = price.replace('/ m2','');
		price = price.replace('/m2','');
		price = price.replace('/mesec','');

		if(price!=="Najamem" && price!==null) //first filter
		{
					

			var intValue = parseInt(price);

			if(intValue>5000 && intValue<2300000 || price=="Po dogovoru" ) //price filter
			{

				//maribor filter
				if(item[0].indexOf("Maribo") > -1 || item[0].indexOf("MB") > -1|| item[0].indexOf("Tabor") > -1|| item[0].indexOf("Melje") > -1|| item[0].indexOf("Tezno") > -1) {
				console.log("Vsebina MAribor:"+item[0] + " Cena je:" +price);

					//console.log("original price:"+item[3]); 	
				//price filter
				//console.log("parsed price:"+price); 	
				feed.addItem({
					title : item[3]+";"+ item[0],
					link : item[2],
					guid : item[2],
					date: date				

				});	
			}
		}		
	}
});


 		console.log("Transported to RSS and ready to be uploaded to S3 bucket");	
		uploadXMLtoBucket(feed.rss2());	
			
 	}

 }


 return server;
};




module.exports = {'Server':Server};