/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
//test
'use strict';

var express = require('express'); // app server
var bodyParser = require('body-parser'); // parser for post requests
var Conversation = require('watson-developer-cloud/conversation/v1'); // watson sdk
var Q = require('q');

var app = express();
var apiRes = '';


var gloDocID='';

var today = new Date();
var dd = today.getDate()+2;
var mm = today.getMonth()+1; //January is 0!

var yyyy = today.getFullYear();
if(dd<10){
    dd='0'+dd;
}
if(mm<10){
    mm='0'+mm;
}
today = dd+'/'+mm+'/'+yyyy;
console.log('today is'+today);


//startdate = "20/03/2014";
//var new_date = moment(startdate, "DD/MM/YYYY");
//new_date.add(1, 'days');
//console.log('new dat is'+new_date);




var previous_intent = '';
// Bootstrap application settings
app.use(express.static('./public')); // load UI from public folder
app.use(bodyParser.json());

//code to db send stuffs
var uuid = require('uuid');
var logs = true;
var csv = require('express-csv');
var basicAuth = require('basic-auth-connect');
var auth = basicAuth(process.env.LOG_USER, process.env.LOG_PASS);
var db;
var cloudant;



var dbCredentials = {
	dbName: 'chat_history3'
};

function initDBConnection() {
	//When running on Bluemix, this variable will be set to a json object
	//containing all the service credentials of all the bound services
	if (process.env.VCAP_SERVICES) {
		var vcapServices = JSON.parse(process.env.VCAP_SERVICES);

		// Pattern match to find the first instance of a Cloudant service in
		// VCAP_SERVICES. If you know your service key, you can access the
		// service credentials directly by using the vcapServices object.
		for (var vcapService in vcapServices) {
			if (vcapService.match(/cloudant/i)) {
				dbCredentials.url = vcapServices[vcapService][0].credentials.url;
			}
		}
	} else { //When running locally, the VCAP_SERVICES will not be set

		// When running this app locally you can get your Cloudant credentials
		// from Bluemix (VCAP_SERVICES in "cf env" output or the Environment
		// Variables section for an app in the Bluemix console dashboard).
		// Alternately you could point to a local database here instead of a
		// Bluemix service.
		// url will be in this format: https://username:password@xxxxxxxxx-bluemix.cloudant.com
		dbCredentials.url = "REPLACE ME";
	}

	cloudant = require('cloudant')(dbCredentials.url);

	// check if DB exists if not create
	cloudant.db.create(dbCredentials.dbName, function(err, res) {
		if (err) {
			console.log('Could not create new db: ' + dbCredentials.dbName + ', it might already exist.');
		}
	});

	db = cloudant.use(dbCredentials.dbName);

}

initDBConnection();
//end code to db stuffs


//code to db insert


//Endpoint which allows conversation logs to be fetched

//  app.get ( '/chats', function (req, res) {
//    db.view ( 'chats_view', 'chats_view', function (err, body) {
//      if(err){
//        console.error(err);
//        return res;
//      }
//      //download as CSV
//      var csv = [];
//      csv.push ( ['Question', 'Output', 'Dialog Counter', 'Time'] );
//
//      body.rows.forEach ( function (row) {
//
//        if ( row.value ) {
//          var doc = row.value;
//          console.log('row.value'+row.value);
//        	csv.push (doc);
//    	}
//
//      } );
//      res.csv ( csv );
//    } );
//    
//
//  } );


//








function titleCase(str) {
	str = str.toLowerCase().split(' ');

	for (var i = 0; i < str.length; i++) {
		str[i] = str[i].split('');
		str[i][0] = str[i][0].toUpperCase();
		str[i] = str[i].join('');
	}
	return str.join(' ');
}


function soapCall(){
		var soap = require('soap');
					var url = 'http://203.115.18.14/service1.asmx?wsdl';
					soap.createClient(url, function(err, client) {
						var args = {
							toDate: '',
							speciality: '',
							docName: '',
							hospitalid: '',
							gettoken: 'Hms@1234'
						};

						client.DOC990DoctorListAvailability(args, function(err, result) {
							if (err) {
								throw err;
							}
							var obj = result.DOC990DoctorListAvailabilityResult;

							console.log('obj..' + obj);
							var obj2 = JSON.parse(obj);
							console.log(obj2.DOC990DoctorListAvailabilityResult.length);
							
})
})
return drName
}



function formatDate (input) {
      var result = new Date(input)
      console.log('first  result'+result);
    //var fmtdate = result.toISOString().split('T')[0] + ' ' + result.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
  
    var dd = result.getDate()+1;
    var mm = result.getMonth()+1; //January is 0!


    var yyyy = result.getFullYear();
    if(dd<10){
        dd='0'+dd;
    }
    if(mm<10){
        mm='0'+mm;
    }
    var results = dd+'/'+mm+'/'+yyyy;
    console.log('results ..'+results)
    return results;
				}



var DFlag='';
var val='';




// Create the service wrapper
var conversation = new Conversation({
	// If unspecified here, the CONVERSATION_USERNAME and CONVERSATION_PASSWORD env properties will be checked
	// After that, the SDK will fall back to the bluemix-provided VCAP_SERVICES environment property
	// username: '<username>',
	// password: '<password>',
	url: 'https://gateway.watsonplatform.net/conversation/api',
	version_date: '2016-10-21',
	version: 'v1'
});

// Endpoint to be call from the client side
app.post('/api/message', function(req, res) {
	apiRes = '';
	var workspace = process.env.WORKSPACE_ID || '<workspace-id>';
	if (!workspace || workspace === '<workspace-id>') {
		return res.json({
			'output': {
				'text': 'The app has not been configured with a <b>WORKSPACE_ID</b> environment variable. Please refer to the ' + '<a href="https://github.com/watson-developer-cloud/conversation-simple">README</a> documentation on how to set this variable. <br>' + 'Once a workspace has been defined the intents may be imported from ' + '<a href="https://github.com/watson-developer-cloud/conversation-simple/blob/master/training/car_workspace.json">here</a> in order to get a working application.'
			}
		});
	}
	var payload = {
		workspace_id: workspace,
		context: req.body.context || {},
		input: req.body.input || {}
	};

	//var test=JSON.parse(payload.context);
	//console.log('context.name is '+test);
	// Send the input to the conversation service
	conversation.message(payload, function(err, data) {
		if (err) {
			return res.status(err.code || 500).json(err);
		}
		var intent = data.intents[0];

		console.log('data..');
		console.log(data);



		console.log('data.entities');
		console.log(data.entites);
		console.log('data.entities[0]..');
		console.log();




		//console.log('data.entities[0].value..');
		//console.log(data.entities[0].value);
		//console.log('Inside entities part')
		//console.log(data.entities);
		//console.log(data.entities[2].value);

		if (logs) {
			var id = uuid.v4();
			//var id = payload.context.conversation_id;
			var conversation_id = payload.context.conversation_id;
			var request = payload.input.text;
			var response = data.output.text;
			var dialog_counter = data.context.system.dialog_turn_counter;
			db.insert({
				'_id': id,
				'conversation_id': conversation_id,
				'input': request,
				'output': response,
				'dialog_counter': dialog_counter,
				'request': payload,
				'response': data,
				'time': new Date()
			}, function(err, data) {

			});
		}
		var aea = '';
		if (data.entities != '') {
			console.log('data entities'+data.entities);
			aea = data.entities[0];
			
			var aeaaa = aea.entity;
			val=aea.value;
			console.log('val'+val);
		}



		if (intent != undefined) {
			//console.log('previous intents..' + previous_intent);


			if (data.intents[0].intent == 'enter_doc') {
				//String manupulation code
				var drName = payload.input.text;
				console.log('init Doctor name-');
				console.log(drName);





				var watson = require('watson-developer-cloud');

				var alchemy_language = watson.alchemy_language({
					api_key: 'a89b6ac9603357eb62d8c9f13c7e89cb33e1a0ca'
				})


				//drName.replace(/\b\w/g, function(l){ return l.toUpperCase() });

				//drName =titleCase(drName);


				//console.log('upper case values');
				console.log('before drName..' + drName);
				if (drName.indexOf('dr.') > -1) {

					drName = drName.replace('dr.', 'Dr. ');
					console.log('1' + drName);
				}
				if (drName.indexOf('Dr.') > -1) {

					drName = drName.replace('Dr.', 'Dr.');
					console.log('1' + drName);
				}
				if (drName.indexOf('dr ') > -1) {

					drName = drName.replace('dr ', 'Dr. ');
					console.log('2' + drName)
				}

				if (drName.indexOf('doctor ') > -1) {

					drName = drName.replace('doctor ', 'Dr. ');
					console.log('3' + drName)
				} else if (drName.indexOf('doc ') > -1) {

					drName=drName.replace('doc ','Dr. ');
					console.log('4' + drName)
				}else if(drName.indexOf('Doc ') > -1) {

					drName=drName.replace('Doc ','Dr. ');
					console.log('5' + drName)
			}




				var parameters = {
					text: drName

				};

				alchemy_language.entities(parameters, function(err, response) {
					if (err)
						console.log('error:', err);
					else {
						console.log('alchemy api inside');
						console.log('response length for loop counter' + response.entities.length)
							//console.log(response.entities[0].text);
						if (response.entities.length != 0) {
							for (var i = 0; i < response.entities.length; i++) {
								if ((response.entities[i].type == 'Person') && (response.entities[i].text != '')) {
									console.log(response.entities[i].text);
									drName = response.entities[i].text;
									console.log('works')
								}
							}
						}



						//drName=response.entities[0].text;
					}









					//drName = drNameFull.substr(n, t);
					console.log('before removing dr part' + drName);
					//String manupulation code
					//var deferred = Q.defer();
					//var internalThis = this;
					if (drName.substr(0, 4) === "Dr. ") {
						drName = drName.substr(4);
					} else if (drName.substr(0, 3) === "Dr ") {
						drName = drName.substr(3);
					} else if (drName.substr(0, 7) === "Doctor ") {
						drName = drName.substr(7);
					} else if (drName.substr(0, 3) === "dr ") {
						drName = drName.substr(3);
					} else if (drName.substr(0, 4) === "dr. ") {
						drName = drName.substr(4);
					}


					console.log('after removign dr part ' + drName);

					var ae = '';
//					if (data.entities != '') {
//						console.log('if this runs it works');
//						ae = data.entities[0];
//						ae = ae.value;
//						console.log('ae ..' + ae);
//					}

					var aea = '';
					var datte=today;
					if (data.entities != '') {
					console.log('data entities'+data.entities);
					aea = data.entities[0];
					
					
					var aeaaa = aea.entity;
					datte=aea.value;
					
					datte=formatDate (datte);
					
					console.log('value.. '+datte);
					}
					
					console.log('todate.. '+datte);
					console.log('speciality.. '+ae);
					console.log('docName.. '+drName.replace(/\s/g, ''));
					
					var soap = require('soap');
					var url = 'http://203.115.18.14/service1.asmx?wsdl';
					soap.createClient(url, function(err, client) {
						var args = {
							toDate: datte,
							speciality: ae,
							docName: drName,
							hospitalid: '',
							gettoken: 'Hms@1234'
						};

						client.DOC990DoctorListAvailability(args, function(err, result) {
							if (err) {
								throw err;
							}
							var obj = result.DOC990DoctorListAvailabilityResult;

							console.log('obj..' + obj);
							var obj2 = JSON.parse(obj);
							console.log(obj2.DOC990DoctorListAvailabilityResult.length);
							if (obj2.DOC990DoctorListAvailabilityResult.length > 1) {
								var str = '<table style="font-family:sans-serif;font-size:0.9rem"><tr><th>DocName</th><th>Date</th><th>Spec</th><th>Location</th></tr>';
								for (var i = 0; i < obj2.DOC990DoctorListAvailabilityResult.length; i++) {
									var DocId = obj2.DOC990DoctorListAvailabilityResult[i].DocId;

									var DocName = obj2.DOC990DoctorListAvailabilityResult[i].DocName;
									//var Date=((obj2.DOC990DoctorListAvailabilityResult[i].Date).replace("\/","")).replace("\/","");
									//var availDate = obj2.DOC990DoctorListAvailabilityResult[i].Date.substr(obj2.DOC990DoctorListAvailabilityResult[i].Date.indexOf("(") + 1, 13);
									var availDate = obj2.DOC990DoctorListAvailabilityResult[i].Date.substr(obj2.DOC990DoctorListAvailabilityResult[i].Date.indexOf("(") + 1, 13);
									var d = new Date();
									d.setTime(availDate);
									var fmtdate = d.toISOString().split('T')[0] + ' ' + d.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
									fmtdate=fmtdate.substr(0,10);
									var Spec = obj2.DOC990DoctorListAvailabilityResult[i].Specialisation;
									//var Hospital = obj2.DOC990DoctorListAvailabilityResult[i].Hospital;
									var Hospital = (obj2.DOC990DoctorListAvailabilityResult[i].Hospital).substr((obj2.DOC990DoctorListAvailabilityResult[i].Hospital).indexOf("-") + 1, 15);

									str = str + '<tr><td>' + DocName + '</td><td>' + fmtdate + '</td><td>' + Spec + '</td><td>' + Hospital + '</td></tr>';

								}
								str = str + '</table>' + '<br> Enter the Full Name of the relevant Doctor from above to check availability </br>';
								//str=["Following are the list of doctors"+str];
								//str='testing tts working or not';

								//str=JSON.parse("[" + str + "]");
								//var str=JSON.stringify(result);
								var str2 = [str];
								console.log('result..' + str);
								//previous_intent = data.intents[0].intent;
								return res.json(updateMessage(payload, data, str2))
							} else if (obj2.DOC990DoctorListAvailabilityResult.length == 1) {
								var DocId = obj2.DOC990DoctorListAvailabilityResult[0].DocId;
								gloDocID=DocId;
								console.log('DocId');
								DFlag='sasas';
								//var DocName = obj2.DOC990DoctorListAvailabilityResult[0].DocName;
								//var availDate = obj2.DOC990DoctorListAvailabilityResult[0].Date.substr(obj2.DOC990DoctorListAvailabilityResult[0].Date.indexOf("(") + 1, 13);
								//var d = new Date();
								//d.setTime(availDate);
								//var fmtdate = d.toISOString().split('T')[0] + ' ' + d.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
								//var Hospital = (obj2.DOC990DoctorListAvailabilityResult[0].Hospital).substr((obj2.DOC990DoctorListAvailabilityResult[0].Hospital).indexOf("-") + 1, 15);

								//str = 'Yes, ' + DocName + ' is visiting Hemas Hospital ' + Hospital + ' and the next available session is at ' + fmtdate + ' and your appointment number is #, would you like to make the appointment now ?';

								var stra = '';


								console.log('Date 2nd API is'+datte)

								//2nd api call
								soap.createClient(url, function(err, client) {
									var args = {
										toDate: datte,
										DocID: DocId,
										gettoken: 'Hms@1234'
									};

									//									client.DOC990DoctorListChanelling(args, function(err, result) {
									//										if (err) {
									//											throw err;
									//										}
									//										//console.log(result.DOC990DoctorListChanellingResult)
									//										var obj = result.DOC990DoctorListChanellingResult;
									//
									//										//console.log('obj..' + obj);
									//										var obj2 = JSON.parse(obj);
									//
									//										var DId = obj2.DOC990DoctorListChanellingResult[0].DocId;
									//
									//										var DocName = obj2.DOC990DoctorListChanellingResult[0].DocName;
									//										var availDate = obj2.DOC990DoctorListChanellingResult[0].Date.substr(obj2.DOC990DoctorListChanellingResult[0].Date.indexOf("(") + 1, 13);
									//										var d = new Date();
									//										d.setTime(availDate);
									//										var fmtdate = d.toISOString().split('T')[0] + ' ' + d.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
									//										var finDate = fmtdate.substr(0, 10);
									//										var Spec = obj2.DOC990DoctorListChanellingResult[0].Specialisation;
									//										var appNo = obj2.DOC990DoctorListChanellingResult[0].CurrentAppNumber;
									//										var time = obj2.DOC990DoctorListChanellingResult[0].Time;
									//										var Hospital = (obj2.DOC990DoctorListChanellingResult[0].Hospital).substr((obj2.DOC990DoctorListChanellingResult[0].Hospital).indexOf("-") + 1, 15);
									//
									//
									//										stra = 'Yes, ' + DocName + ' is visiting Hemas Hospitals ' + Hospital + ' and the next available session is on ' + finDate + ' from ' + time + ' and your appointment number will be ' + appNo + ', would you like to make the appointment now ?';
									//										console.log('str ..' + stra);
									//										var str2 = [stra];
									client.DOC990DoctorListChanelling(args, function(err, result) {
										if (err) {
											throw err;
										}
										//console.log(result.DOC990DoctorListChanellingResult)
										var obj = result.DOC990DoctorListChanellingResult;
										console.log(result.DOC990DoctorListChanellingResult);
										console.log('obj..' + obj);
										var obj2 = JSON.parse(obj);

										console.log('result is.. ' + obj2.DOC990DoctorListChanellingResult);
										var str ='';
										str = '<table style="font-family:sans-serif;font-size:0.9rem"><tr><th>DocName</th><th>Date</th><th>Time</th><th>Location</th></tr>';
										var DId
										for (var i = 0; i < obj2.DOC990DoctorListChanellingResult.length; i++) {
											DId = obj2.DOC990DoctorListChanellingResult[i].DocId;

											var DocName = obj2.DOC990DoctorListChanellingResult[i].DocName;
											var availDate = obj2.DOC990DoctorListChanellingResult[i].Date.substr(obj2.DOC990DoctorListChanellingResult[i].Date.indexOf("(") + 1, 13);
											var d = new Date();
											d.setTime(availDate);
											var fmtdate = d.toISOString().split('T')[0] + ' ' + d.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
											console.log('test date..' + fmtdate);
											var finDate = fmtdate.substr(0, 10);

//											function formatDate(input) {
//												var datePart = input.match(/\d+/g),
//													year = datePart[0].substring(0, 4), // get only two digits
//													month = datePart[1],
//													day = datePart[2];
//
//												return day + '/' + month + '/' + year;
//											}
//
//											console.log(formatDate(finDate));
//											finDate = formatDate(finDate);




											var Spec = obj2.DOC990DoctorListChanellingResult[i].Specialisation;
											var appNo = obj2.DOC990DoctorListChanellingResult[i].CurrentAppNumber;
											var time = obj2.DOC990DoctorListChanellingResult[i].Time;
											var Hospital = (obj2.DOC990DoctorListChanellingResult[i].Hospital).substr((obj2.DOC990DoctorListChanellingResult[i].Hospital).indexOf("-") + 1, 15);

											str = str + '<tr><td>' + DocName + '</td><td>' + finDate + '</td><td>' + time + '</td><td>' + Hospital + '</td></tr>';

										}
										str = str + '</table>' + '<br> Above are the sessions available for upcoming dates<br> </br>Enter the date you like to make the Appointment. You can either say "today/tomorrow" or provide the date in YYYY-MM-DD format. </br>';
										console.log(str);
										var str2 = [str];





										return res.json(updateMessage(payload, data, str2))


									});
								});









							} else if (obj2.DOC990DoctorListAvailabilityResult.length == 0) {

								str = '<br> The entered doctor isnt available on given date.</br>';
								//str=JSON.parse("[" + str + "]");
								//var str=JSON.stringify(result);
								//console.log('result..' + str);
								//previous_intent = data.intents[0].intent;
								var str2 = [str];
								return res.json(updateMessage(payload, data, str2))

							}

						});
					});
				});
				
			}else if (aeaaa == 'sys-date' && DFlag !=''){
					
				
				console.log('Dflag..' + DFlag);
				console.log('val is  .. ' + val);
				console.log('things should happen here');
			
				console.log('new val is..');
				console.log('new val is..'+formatDate (val));
				val=formatDate (val);
				//cpied prt
				
								var str = '';
								console.log('global doc id '+gloDocID);
								//2nd api call
								var soap = require('soap');
								var url = 'http://203.115.18.14/service1.asmx?wsdl';
								soap.createClient(url, function(err, client) {
									var args = {
										toDate: val,
										DocID: gloDocID,
										gettoken: 'Hms@1234'
									};

									//									client.DOC990DoctorListChanelling(args, function(err, result) {
									//										if (err) {
									//											throw err;
									//										}
									//										//console.log(result.DOC990DoctorListChanellingResult)
									//										var obj = result.DOC990DoctorListChanellingResult;
									//
									//										//console.log('obj..' + obj);
									//										var obj2 = JSON.parse(obj);
									//
									//										var DId = obj2.DOC990DoctorListChanellingResult[0].DocId;
									//
									//										var DocName = obj2.DOC990DoctorListChanellingResult[0].DocName;
									//										var availDate = obj2.DOC990DoctorListChanellingResult[0].Date.substr(obj2.DOC990DoctorListChanellingResult[0].Date.indexOf("(") + 1, 13);
									//										var d = new Date();
									//										d.setTime(availDate);
									//										var fmtdate = d.toISOString().split('T')[0] + ' ' + d.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
									//										var finDate = fmtdate.substr(0, 10);
									//										var Spec = obj2.DOC990DoctorListChanellingResult[0].Specialisation;
									//										var appNo = obj2.DOC990DoctorListChanellingResult[0].CurrentAppNumber;
									//										var time = obj2.DOC990DoctorListChanellingResult[0].Time;
									//										var Hospital = (obj2.DOC990DoctorListChanellingResult[0].Hospital).substr((obj2.DOC990DoctorListChanellingResult[0].Hospital).indexOf("-") + 1, 15);
									//
									//
									//										stra = 'Yes, ' + DocName + ' is visiting Hemas Hospitals ' + Hospital + ' and the next available session is on ' + finDate + ' from ' + time + ' and your appointment number will be ' + appNo + ', would you like to make the appointment now ?';
									//										console.log('str ..' + stra);
									//										var str2 = [stra];
									client.DOC990DoctorListChanelling(args, function(err, result) {
										if (err) {
											throw err;
										}
										//console.log(result.DOC990DoctorListChanellingResult)
										var obj = result.DOC990DoctorListChanellingResult;
										console.log(result.DOC990DoctorListChanellingResult);
										console.log('obj..' + obj);
										var obj2 = JSON.parse(obj);

										console.log('result is.. ' + obj2.DOC990DoctorListChanellingResult);
										//var str = '<table style="font-family:sans-serif;font-size:0.9rem"><tr><th>DocName</th><th>Date</th><th>Time</th><th>Location</th><th>Appointment Number</th></tr>';
										//var DId
																					var availDate = obj2.DOC990DoctorListChanellingResult[0].Date.substr(obj2.DOC990DoctorListChanellingResult[0].Date.indexOf("(") + 1, 13);
											var d = new Date();
											d.setTime(availDate);
											var fmtdate = d.toISOString().split('T')[0] + ' ' + d.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
											console.log('test date..' + fmtdate);
											var finDate = fmtdate.substr(0, 10);

											function formatDate(input) {
												var datePart = input.match(/\d+/g),
													year = datePart[0].substring(0, 4), // get only two digits
													month = datePart[1],
													day = datePart[2];

												return day + '/' + month + '/' + year;
											}

											console.log(formatDate(finDate));
											finDate = formatDate(finDate);
										
											if(finDate!='30/12/2016'){
												
											var DId = obj2.DOC990DoctorListChanellingResult[0].DocId;

											var DocName = obj2.DOC990DoctorListChanellingResult[0].DocName;
											var availDate = obj2.DOC990DoctorListChanellingResult[0].Date.substr(obj2.DOC990DoctorListChanellingResult[0].Date.indexOf("(") + 1, 13);
											var d = new Date();
											d.setTime(availDate);
											var fmtdate = d.toISOString().split('T')[0] + ' ' + d.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
											console.log('test date..' + fmtdate);
											var finDate = fmtdate.substr(0, 10);

											function formatDate(input) {
												var datePart = input.match(/\d+/g),
													year = datePart[0].substring(0, 4), // get only two digits
													month = datePart[1],
													day = datePart[2];

												return day + '/' + month + '/' + year;
											}

											console.log(formatDate(finDate));
											finDate = formatDate(finDate);




											var Spec = obj2.DOC990DoctorListChanellingResult[0].Specialisation;
											var appNo = obj2.DOC990DoctorListChanellingResult[0].CurrentAppNumber;
											var time = obj2.DOC990DoctorListChanellingResult[0].Time;
											var Hospital = (obj2.DOC990DoctorListChanellingResult[0].Hospital).substr((obj2.DOC990DoctorListChanellingResult[0].Hospital).indexOf("-") + 1, 15);
											
											str =  DocName + ' is visiting Hemas Hospitals ' + Hospital + ' and the next available session is on ' + finDate + ' from ' + time + ' and your appointment number will be C' + appNo + ', would you like to make the appointment now ?';
										

											
											//str = str + '<tr><td>' + DocName + '</td><td>' + finDate + '</td><td>' + time + '</td><td>' + Hospital + '</td><td>' + appNo + '</td></tr>';

										
										//str = str + '<br> Confirm Appointment? </br>';
										console.log(str);
										var str2 = [str];
										//var str='this goes into intent';
										//var str2=[str];
										DFlag='';
										return res.json(updateMessage(payload, data, str2));
									}else{
										str='Sorry. There is no session availabe for the mentioned date. Enter the doctors name to find the available sessions'
										console.log(str);
										
										var str2 = [str];
										//var str='this goes into intent';
										//var str2=[str];
										DFlag='';
										return res.json(updateMessage(payload, data, str2));
										
									}

				
			});
		});


				
				//
				
				
				
				
				
				
			

					
				
				
			} else if (previous_intent == 'dont_know') {
				//String manupulation code
				var spec = payload.input.text;
				console.log(spec);
				var soap = require('soap');
				var url = 'http://203.115.18.14/service1.asmx?wsdl';
				
				
				soap.createClient(url, function(err, client) {
					var args = {
						toDate: today,
						speciality: spec,
						docName: '',
						hospitalid: '',
						gettoken: 'Hms@1234'
					};

					client.DOC990DoctorListAvailability(args, function(err, result) {
						if (err) {
							throw err;
						}
						var obj = result.DOC990DoctorListAvailabilityResult;

						console.log('obj..' + obj);
						var obj2 = JSON.parse(obj);
						if (obj2.DOC990DoctorListAvailabilityResult.length > 1) {
							var str = '<table style="font-family:sans-serif;font-size:0.9rem"><tr><th>DocName</th><th>Date</th><th>Spec</th><th>Location</th></tr>';
							for (var i = 0; i < obj2.DOC990DoctorListAvailabilityResult.length; i++) {
								var DocId = obj2.DOC990DoctorListAvailabilityResult[i].DocId;
								var DocName = obj2.DOC990DoctorListAvailabilityResult[i].DocName;
								//var Date=((obj2.DOC990DoctorListAvailabilityResult[i].Date).replace("\/","")).replace("\/","");
								//var availDate = obj2.DOC990DoctorListAvailabilityResult[i].Date.substr(obj2.DOC990DoctorListAvailabilityResult[i].Date.indexOf("(") + 1, 13);
								var availDate = obj2.DOC990DoctorListAvailabilityResult[i].Date.substr(obj2.DOC990DoctorListAvailabilityResult[i].Date.indexOf("(") + 1, 13);
								var d = new Date();
								d.setTime(availDate);
								var fmtdate = d.toISOString().split('T')[0] + ' ' + d.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");

								var Spec = obj2.DOC990DoctorListAvailabilityResult[i].Specialisation;
								//var Hospital = obj2.DOC990DoctorListAvailabilityResult[i].Hospital;
								var Hospital = (obj2.DOC990DoctorListAvailabilityResult[i].Hospital).substr((obj2.DOC990DoctorListAvailabilityResult[i].Hospital).indexOf("-") + 1, 15);

								str = str + '<tr><td>' + DocName + '</td><td>' + fmtdate + '</td><td>' + Spec + '</td><td>' + Hospital + '</td></tr>';

							}
							str = str + '</table>' + '<br> Enter the Full Name of the relevant Doctor from above to check availability </br> ';

							var str2 = [str];
							//var str=JSON.stringify(result);
							console.log('result..' + str);
							previous_intent = data.intents[0].intent;
							return res.json(updateMessage(payload, data, str2))
						} else if (obj2.DOC990DoctorListAvailabilityResult.length == 1) {	
							var DocId = obj2.DOC990DoctorListAvailabilityResult[0].DocId;
							previous_intent = data.intents[0].intent;
							
							//second api call
							soap.createClient(url, function(err, client) {
									var args = {
										toDate: today,
										DocID: DocId,
										gettoken: 'Hms@1234'
									};

									client.DOC990DoctorListChanelling(args, function(err, result) {
										if (err) {
											throw err;
										}
										//console.log(result.DOC990DoctorListChanellingResult)
										var obj = result.DOC990DoctorListChanellingResult;

										//console.log('obj..' + obj);
										var obj2 = JSON.parse(obj);

										var DId = obj2.DOC990DoctorListChanellingResult[0].DocId;

										var DocName = obj2.DOC990DoctorListChanellingResult[0].DocName;
										var availDate = obj2.DOC990DoctorListChanellingResult[0].Date.substr(obj2.DOC990DoctorListChanellingResult[0].Date.indexOf("(") + 1, 13);
										var d = new Date();
										d.setTime(availDate);
										var fmtdate = d.toISOString().split('T')[0] + ' ' + d.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
										var finDate = fmtdate.substr(0, 10);
										var Spec = obj2.DOC990DoctorListChanellingResult[0].Specialisation;
										var appNo = obj2.DOC990DoctorListChanellingResult[0].CurrentAppNumber;
										var time = obj2.DOC990DoctorListChanellingResult[0].Time;
										var Hospital = (obj2.DOC990DoctorListChanellingResult[0].Hospital).substr((obj2.DOC990DoctorListChanellingResult[0].Hospital).indexOf("-") + 1, 15);


										stra = 'Yes, ' + DocName + ' is visiting Hemas Hospitals ' + Hospital + ' and the next available session is on ' + finDate + ' from ' + time + ' and your appointment number will be C' + appNo + ', would you like to make the appointment now ?';
										console.log('str ..' + stra);
										var str2 = [stra];

										return res.json(updateMessage(payload, data, str2))
							
							
							
							
							});
							});
							
							
						

							
							
							//return res.json(updateMessage(payload, data, str2))

						} else if (obj2.DOC990DoctorListAvailabilityResult.length == 0) {

							str = ' The entered speciality isnt available in our records. You may enter a valid speciality';

							//var str=JSON.stringify(result);
							//console.log('result..' + str);
							var str2 = [str];
							//previous_intent = 'dont_know';
							return res.json(updateMessage(payload, data, str2))

						}

					});
				});
			} else {
				previous_intent = data.intents[0].intent;
				return res.json(updateMessage(payload, data, null));
			}


		} else

			return res.json(updateMessage(payload, data, null));


	});

});



//tts
const TextToSpeechV1 = require('watson-developer-cloud/text-to-speech/v1');
const textToSpeech = new TextToSpeechV1({
	// If unspecified here, the TEXT_TO_SPEECH_USERNAME and
	// TEXT_TO_SPEECH_PASSWORD env properties will be checked
	// After that, the SDK will fall back to the bluemix-provided VCAP_SERVICES environment property
	username: '9ac79e45-6592-4d00-90f8-d2477d65b5b3',
	password: 'Do0Ot3GqZgYC',
});


/************************************************
 * Text-to-Speech services
 ************************************************/

/**
 * Pipe the synthesize method
 */
app.get('/api/synthesize', (req, res, next) => {
	const transcript = textToSpeech.synthesize(req.query);
	transcript.on('response', (response) => {
		if (req.query.download) {
			if (req.query.accept && req.query.accept === 'audio/wav') {
				response.headers['content-disposition'] = 'attachment; filename=transcript.wav';
			} else {
				response.headers['content-disposition'] = 'attachment; filename=transcript.ogg';
			}
		}
	});
	transcript.on('error', next);
	transcript.pipe(res);
});

// Return the list of voices
app.get('/api/voices', (req, res, next) => {
	textToSpeech.voices(null, (error, voices) => {
		if (error) {
			return next(error);
		}
		res.json(voices);
	});
});









/**
 * Updates the response text using the intent confidence
 * @param  {Object} input The request to the Conversation service
 * @param  {Object} response The response from the Conversation service
 * @return {Object}          The response with the updated message
 */
function updateMessage(input, response, apitext) {
	var responseText = null;

	if (!response.output) {
		if (apitext != null) {
			response.output.text = apitext;
			return response;
		} else response.output = {};
	} else {
		if (apitext != null) {
			response.output.text = apitext;
			return response;
		} else
			return response;
	}
	if (response.intents && response.intents[0]) {
		var intent = response.intents[0];
		// Depending on the confidence of the response the app can return different messages.
		// The confidence will vary depending on how well the system is trained. The service will always try to assign
		// a class/intent to the input. If the confidence is low, then it suggests the service is unsure of the
		// user's intent . In these cases it is usually best to return a disambiguation message
		// ('I did not understand your intent, please rephrase your question', etc..)

		if (intent.confidence >= 0.75) {
			responseText = 'I understood your intent was ' + intent.intent;
			console.log('intent name:' + intent.intent);

		} else if (intent.confidence >= 0.5) {
			responseText = 'I think your intent was ' + intent.intent;


		} else {
			responseText = 'I did not understand your intent';
		}
	}

	response.output.text = responseText;

	return response;
}






//mail the guys
//Endpoint which allows conversation logs to be fetched
app.post('/api/chats', function(req, res) {
	//var context=req.body.context || {};
	console.log('body: ' + JSON.stringify(req.body));
	console.log('conversation_id : ' + req.body.context.conversation_id);
	conv_id = 'conversation_id:' + req.body.context.conversation_id;
	//console.log('id : '+conv_id);
	db.search('indConv', 'indConv', {
		q: conv_id,
		sort: 'dialog_counter'
	}, function(err, doc) {
		var chat_hist = '';
		if (!err) {

			for (var i = 0; i < doc.rows.length; i++) {
				console.log('User input: %s', doc.rows[i].fields.input);
				console.log('Watson output: %s', doc.rows[i].fields.output);
				console.log('Time : %s', doc.rows[i].fields.time);
				console.log('Conter : %s', doc.rows[i].fields.dialog_counter);
				chat_hist = chat_hist + '<br>' + '<b>Time : </b>' + doc.rows[i].fields.time + '</br><b>User input : </b>' + doc.rows[i].fields.input + '<br>' + '<b>Watson response : </b>' + doc.rows[i].fields.output + '</br><br></br>';
			}

			console.log('chat_hist' + chat_hist);
			// Use Smtp Protocol to send Email
			//var smtpTransport = mailer.createTransport('smtps://chamif1974%40gmail.com:kelle123@smtp.gmail.com');;
			var smtpTransport = mailer.createTransport("SMTP", {
				service: "Gmail",
				auth: {
					user: "alphagamer977gmail.com",
					pass: "Athifs97"
				}
			});
			//text: "Node.js New world for me"
			//html: "<b>Node.js New world for me</b>"
			var mail = {
				from: "Milroy Fernando <chamif1974@gmail.com>",
				to: "mfernand@lk.ibm.com",
				subject: "Send Email Using Watson Virtual Chat",
				text: chat_hist,
				html: chat_hist
			}

			smtpTransport.sendMail(mail, function(error, response) {
				if (error) {
					console.log(error);
				} else {
					console.log("Message sent: " + response.message);
				}

				//smtpTransport.close();
			});
		} else {
			console.log('error..' + err);
		}
	});


});

//end mail part

module.exports = app;