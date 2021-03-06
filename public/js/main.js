var serverUrl = "http://localhost:3000"

function createUser(){
	var data = new Object();
	data._id = "org.couchdb.user:" + $('#username')[0].value;
	data.name = $('#username')[0].value;
	data.type = "user";
	data.roles = [];
	data.password = $('#password')[0].value;
	data.userId = uniqueId();
	data.email = $('#email')[0].value;
	data.displayName = $('#fname')[0].value;
	data.department = $('#department')[0].value;

    var request = $.ajax({
		url: serverUrl + "/createUser",
		method: "POST",
		data: JSON.stringify(data),
		headers:{
			"Content-type":"application/x-www-form-urlencoded",
			"Content-length":data.length,
			"Connection":"close"
		}
	});

	request.done(function(status) {
		console.log("user created successfully %o", status);
		$('.signupForm')[0].reset();
		if(status.isUserCreated){
			$("#successPlaceholder").removeClass("hide");
			$("#errorPlaceholder").addClass("hide");
		}		
		else {
			if(status.isDuplicateUser)
				$('#errorPlaceholder .errorText').html("Username is already in use. Choose a different one!");
			$("#errorPlaceholder").removeClass("hide");
			$("#successPlaceholder").addClass("hide");
		}
			
	});	 
	request.fail(function( jqXHR, textStatus ) {
	  console.log("user creation failed" + textStatus );
	  $('#errorPlaceholder').removeClass("hide");
	});
};

var authenticateUser = function(){
    var data = new Object();
    data.username = $('#username')[0].value;
    data.password = $('#password')[0].value;

    var request = $.ajax({
    	url : serverUrl + "/authenticateUser",
    	method: "POST",
    	data : JSON.stringify(data),
    	headers:{
			"Content-type":"application/x-www-form-urlencoded",
			"Content-length":data.length,
			"Connection":"close"
		}
    });
    request.done(function(status) {
		console.log("logged in successfully %o", status.currentUser);
		if(status.isAuthenticated){
			localStorage.setItem("loggedInUser", JSON.stringify(status.currentUser));
			window.location.href = "/static/design/home.html";
		}
		else {
			$('#errorPlaceholder').removeClass("hide");
		}
	});	 
	request.fail(function( jqXHR, textStatus ) {
	  console.log( "login failed: " + textStatus );
	});
};

var postQuestion = function(){
	var data = new Object();
	data.title = $("#title")[0].value;
	data.category = $('#categoryDropdown')[0].value;
	data.tags = $("#questionTags").selectivity('data');
	data.type = "question";
	data.question = CKEDITOR.instances.questionDesc.getData();
	data.userId = JSON.parse(localStorage.getItem("loggedInUser")).userId;;
	data.user = JSON.parse(localStorage.getItem("loggedInUser")).displayName;
	data.timeStamp = new Date();
	data.questionId = uniqueId();
	var request = $.ajax({
		url : serverUrl + "/postQuestion",
		method: "POST",
		data : JSON.stringify(data), 
		headers:{
			"Content-type":"application/x-www-form-urlencoded",
			"Content-length":data.length,
			"Connection":"close"
		}
	});

	request.done(function(status){
		console.log("question posted %o", status);
		CKEDITOR.instances.questionDesc.setData("");
		$("#questionForm")[0].reset();
		$("#questionTags").selectivity('clear');
		$("#successPlaceholder").removeClass("hide");
		window.scrollTo(100,0);
	});

	request.fail(function(status){
		console.log("question post failed %o", status);
	});
}

var loadQuestionsTable = function(){

	var request = $.ajax ({
		url: serverUrl + "/getAllQuestions",
		method: "GET",
		headers:{
			"Content-type":"application/x-www-form-urlencoded",
			"Connection":"close"
		}
	});
	request.done(function(data) {
		console.log("questions %o", data);
		var questions = [];
		for (var i=0; i< data.length; i++){
			var questionArr = [];
			var questionId = data[i].value.questionId;
			questionArr.push(questionId);
			questionArr.push(constructQuestionData(data[i].value));
			questions.push(questionArr);
		}

		console.log("questions array %o", questions);
		$('#questionsTableWrapper').empty()
		$('#questionsTableWrapper').append("<table class=\"display\" width=\"100%\" id=\"questionsDTable\"></table>");
		$('#questionsDTable').DataTable({
	    	"bLengthChange": false,
	    	"pageLength": 10,
	        data: questions, 
	        columns: [
	        	{ title : "QuestionId"}
	        ],
	        "columnDefs": [
		        {
			        "targets": [ 0 ],
			        "visible": false,
			        "searchable": false
		    	},
		        { 
			        "targets": [ 1 ],
			        "render": function (data, type, row) {
			    	    return data;
			    	}
	            }
	        ]
	    });
	});
}

var constructQuestionData = function(data){
	console.log("constructQuestionData %o", data);

	// construct tags markup 
	var tagStr = "";
	for(var i=0; i< data.tags.length;i++){
		tagStr += '<a href="#" class="post-tag js-gps-track" title="" rel="tag">'+ data.tags[i].text + '</a>';
	}

	// calculate time difference 
	var timeStamp = getTimeDiff(new Date(data.timeStamp));

	// question markup for dataTable
	var questionStr = '<div class="left pr20">' +
		                    '<div class="quesTitle"><a class="link clblue" onclick=openQuestionView(' + data.questionId +')>' + data.title +'</a></div>'+
		                    '<div class="post-taglist">' + tagStr + '</div>' + 
		                    '</div>'+
			    			'<div class="right action-links">' + 
			    			'<div class="post-signature owner" style="display:inline-block">' + 
		                    '<div class="user-info ">' + 
		                    '<div class="user-action-time">' + 
		                    'asked <span title="2016-02-22 14:02:45Z" class="relativetime">'+ timeStamp + '</span>' + 
		                    '</div>' + 
		                    '<div class="user-gravatar32">' + 
		                    '<a href="#"><div class="gravatar-wrapper-32"><img src="https://www.gravatar.com/avatar/335a9ae9364e36c131fb599feaf0e540?s=32&amp;d=identicon&amp;r=PG&amp;f=1" alt="" width="32" height="32"></div></a>' +
		                    '</div>' +
		                    '<div class="user-details">' + 
		                    '<a href="#">'+ data.user +'</a>' +  
		                    '</div>' + 
		                    '</div></div>'
							'</div>';
	return questionStr;
}

var constructAnswerData = function(data){
	console.log("constructAnswerData %o", data);

	// calculate time difference 
	var timeStamp = getTimeDiff(new Date(data.timeStamp));

	// question markup for dataTable

	var voteStr = '<div class="vote">'+
	              '<a class="vote-up-off" onclick=updateAnswerVote('+ data.answerId + ',' + true +')>up vote</a>'+
	              '<span id="votes'+ data.answerId+'" class="vote-count-post ">'+ data.votes +'</span>'+
	              '<a class="vote-down-off" onclick=updateAnswerVote('+ data.answerId  + ',' + false +')>down vote</a></div>';

	var answerStr = '<div class="left pr20 answerBlock">' + voteStr +

		                    '<div class="answerText">' + data.answer +'</div>'+
		                    '</div>'+
			    			'<div class="right action-links">' + 
			    			'<div class="post-signature-answer owner" style="display:inline-block">' + 
		                    '<div class="user-info ">' + 
		                    '<div class="user-action-time">' + 
		                    'answered <span title="2016-02-22 14:02:45Z" class="relativetime">'+ timeStamp + '</span>' + 
		                    '</div>' + 
		                    '<div class="user-gravatar32">' + 
		                    '<a href="#"><div class="gravatar-wrapper-32"><img src="https://www.gravatar.com/avatar/335a9ae9364e36c131fb599feaf0e540?s=32&amp;d=identicon&amp;r=PG&amp;f=1" alt="" width="32" height="32"></div></a>' +
		                    '</div>' +
		                    '<div class="user-details">' + 
		                    '<a href="#">'+ data.user +'</a>' +  
		                    '</div>' + 
		                    '</div></div>'
							'</div>';
	return answerStr;
}

function initializeSelectivityForQuestionTags(){

	var request = $.ajax ({
		url: serverUrl + "/getAllTags",
		method: "GET",
		headers:{
			"Content-type":"application/x-www-form-urlencoded",
			"Connection":"close"
		}
	});
	request.done(function(data) {
		console.log("tags %o", data.length);
		var items = [];
		for(i=0;i<data.length;i++){
			var item = {
				id: data[i].key, 
				text: data[i].value
			};
			items.push(item);
		}
		console.log("items %o", items.length);
		$('#questionTags').selectivity({
			items: items,
			multiple: true,
		   	placeholder: 'Tags',
		   	createTokenItem: function(token){
		   	 	console.log('create token item called %o',token);
		   	 	$('.selectivity-multiple-input').val("");
		   	 	var itemArray = $('#questionTags').selectivity('data');
		   	 	// When there are no categories in the system
		   	 	if(itemArray == ""){
		   	 		console.log('added session cat if');
		   	 		$('#questionTagsForm #tags').val(token);
	   	 			var tagId = addTag(token);
			   	 	var pluginItem = {
						id: tagId,
						text: token
					};
					// Refresh the selectivty since new session category has been added to the system
					initializeSelectivityForQuestionTags();
					return pluginItem;
		   	 	}
		   	 	// Session categories are available : Some are already selected
		   	 	else{
		   	 		// Get the item text values from itemArray
		   	 		var itemTexts = [];
		   	 		for(i in itemArray){
		   	 			itemTexts.push(itemArray[i].text);
		   	 		}
		   	 		// Check if the token is already selected/avaialble in the system
		   	 		if(itemTexts.indexOf(token)!=-1){
		   	 			// Don't add, clear the input field
		   	 			return null;
		   	 		} else {
		   	 			// Add it to JCR
		   	 			$('#questionTagsForm #tags').val(token);
		   	 			var tagId = addTag(token);
				   	 	var pluginItem = {
							id: tagId,
							text: token
						};
						// Refresh the selectivty since new session category has been added to the system
						initializeSelectivityForQuestionTags();
						return pluginItem;
		   	 		}
		   	 	}
		   	 	
		   	}
		});
	});	
}

function getTags() {
	var request = $.ajax ({
		url: serverUrl + "/getAllTags",
		method: "GET",
		headers:{
			"Content-type":"application/x-www-form-urlencoded",
			"Connection":"close"
		}
	});
	request.done(function(data) {
		console.log("tags %o", data.length);
		//constructSelectivityDataForTags(data);
	    return data;
	});	 
	request.fail(function( jqXHR, textStatus ) {
	  console.log("getting tags failed" + textStatus);
	});
}

function constructSelectivityDataForTags(tags){
	var pluginItems = [];
	for(i=0;i<5;i++){
		var pluginItem = {
			id: i, 
			text: "tags" + i
		};
		pluginItems.push(pluginItem);
	}
	return pluginItems;
}

function addTag(tagName) {
  	var tagId = uniqueId();
  	var data = new Object();
  	data.tagId = tagId;
  	data.type = "tag";
  	data.tagName = tagName;

  	var request = $.ajax({
		url: "http://localhost:3000/createTag",
		method: "POST",
		data: JSON.stringify(data),
		headers:{
			"Content-type":"application/x-www-form-urlencoded",
			"Content-length":data.length,
			"Connection":"close"
		}
	});
	request.done(function(status) {
		console.log("tag created successfully %o", status);
	});	 
	request.fail(function( jqXHR, textStatus ) {
	  console.log("tag creation failed" + textStatus);
	});
	return tagId;
}

/* Generates Unique Id*/
function uniqueId() {
	var i = new Date().getTime();
	i = i & 0xffff; 
	return i;
}

function getTimeDiff(datetime){
    var datetime = typeof datetime !== 'undefined' ? datetime : "2014-01-01 01:02:03.123456";
    var datetime = new Date( datetime ).getTime();
    var now = new Date().getTime();
    if( isNaN(datetime)){
        return "";
    }
	console.log( datetime + " " + now);
    if (datetime < now) {
        var milisec_diff = now - datetime;
    }else{
        var milisec_diff = datetime - now;
    }
    var days = Math.floor(milisec_diff / 1000 / 60 / (60 * 24));
    var date_diff = new Date( milisec_diff );
    var dateStr = "";
    if (days > 0)
    	dateStr = days + " days ago";
    else if (date_diff.getHours() > 0)
    	dateStr = date_diff.getHours() + " hours ago";
    else if(date_diff.getMinutes() > 0)
    	dateStr = date_diff.getMinutes() + " minutes ago";
    else 
    	dateStr = date_diff.getSeconds() + " seconds ago";
    return dateStr;
}

function openQuestionView(questionId){
	localStorage.setItem("currentQuestionId", questionId);
	window.location.href = "/static/design/questionView.html"
}

var loadQuestionData = function(){
	var request = $.ajax ({
		url: serverUrl + "/getQuestionData?questionId="+localStorage.getItem("currentQuestionId"),
		method: "GET",
		headers:{
			"Content-type":"application/x-www-form-urlencoded",
			"Connection":"close"
		}
	});
	request.done(function(data) {
		console.log("current question", data);
		$("#questionTitle").text(data.value.title);
		$("#questionDesc").html(jQuery.parseHTML(data.value.question));

		var tagStr = "";
		for(var i=0; i< data.value.tags.length;i++){
			tagStr += '<a href="#" class="post-tag js-gps-track" title="" rel="tag">'+ data.value.tags[i].text + '</a>';
		}

		$("#questionTags").html(tagStr);
		$("#timeStamp").text(getTimeDiff(new Date(data.value.timeStamp)));
		$("#userName").text(data.value.user);

	});	 
	request.fail(function( jqXHR, textStatus ) {
	  console.log("getting tags failed" + textStatus);
	});
}

var postAnswer = function(){
	var data = new Object();
	data.type = "answer";
	data.answer = CKEDITOR.instances.questionAnswer.getData();
	data.userId = JSON.parse(localStorage.getItem("loggedInUser")).userId;;
	data.user = JSON.parse(localStorage.getItem("loggedInUser")).displayName;
	data.timeStamp = new Date();
	data.questionId = localStorage.getItem("currentQuestionId");
	data.answerId = uniqueId();
	data.votes = 0;
	var request = $.ajax({
		url : serverUrl + "/postAnswer",
		method: "POST",
		data : JSON.stringify(data), 
		headers:{
			"Content-type":"application/x-www-form-urlencoded",
			"Content-length":data.length,
			"Connection":"close"
		}
	});

	request.done(function(status){
		console.log("answer posted %o", status);
		CKEDITOR.instances.questionAnswer.setData("");	
		$("#successPlaceholder").removeClass("hide");
		window.scrollTo(100,0);
		loadAnswersTable();
	});

	request.fail(function(status){
		console.log("answer post failed %o", status);
		$("#errorPlaceholder").removeClass("hide");
		window.scrollTo(100,0);
	});
}

var loadAnswersTable = function(){
	var request = $.ajax ({
		url: serverUrl + "/getQuestionAnswers?questionId="+localStorage.getItem("currentQuestionId"),
		method: "GET",
		headers:{
			"Content-type":"application/x-www-form-urlencoded",
			"Connection":"close"
		}
	});
	request.done(function(data) {
		console.log("questions %o", data);
		var answers = [];
		for (var i=0; i< data.length; i++){
			var answerArr = [];
			answerArr.push(data[i].value.answerId);
			answerArr.push(constructAnswerData(data[i].value));
			answers.push(answerArr);
		}

		$('#answersTableWrapper').empty()
		$('#answersTableWrapper').append("<table class=\"display\" width=\"100%\" id=\"answersDTable\"></table>");
		$('#answersDTable').DataTable({
	    	"bLengthChange": false,
	    	"pageLength": 10,
	        data: answers, 
	        columns: [
	        	{ title : "answerId"}
	        ],
	        "columnDefs": [
		        {
			        "targets": [ 0 ],
			        "visible": false,
			        "searchable": false
		    	},
		        { 
			        "targets": [ 1 ],
			        "render": function (data, type, row) {
			    	    return data;
			    	}
	            }
	        ]
	    });
	});
}

var updateAnswerVote = function(answerId, isIncVote){
	console.log("%o" , answerId, isIncVote);
	var request = $.ajax ({
		url: serverUrl + "/updateAnswerVotes?answerId=" + answerId + "&isIncVote=" + isIncVote,
		method: "GET",
		headers:{
			"Content-type":"application/x-www-form-urlencoded",
			"Connection":"close"
		}
	});
	request.done(function(data) {
		$("#votes"+answerId).text(data.updatedVoteCount);
	});
}