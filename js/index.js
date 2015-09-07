window.onerror = function(message, url, lineNumber) {
	//console.log("Error: "+message+" in "+url+" at line "+lineNumber);
	//alert("Error: "+message+" in "+url+" at line "+lineNumber);

}


pagesTracker = [];
pagesTracker.push('main_page');
var pushNotification;
getUsersRequest = '';
checkNewMessagesRequest = '';
newMessages = '';
refreshChat = '';



var app = { 
		
	/*
	data: {
		pictureSource : '',
		destinationType : '',
		encodingType : '',
	},
	*/
		
		
	pictureSource : '',
	destinationType : '',
	encodingType : '',	
	currentPageId : '',
	currentPageWrapper : '',
	recentScrollPos : '',
	
	action : '',
	requestUrl : '',
	requestMethod : '',
	response : '',
	responseItemsNumber : '',
	pageNumber : '',
	itemsPerPage : 30,
	container : '', 
	template : '',
	statAction : '',
	searchFuncsMainCall: '',
	sort: '',
	
	
	profileGroupTemplate : '',
	profileLineTemplate : '',
	
	userId : '',
	reportAbuseUserId : '',
	gcmDeviceId : '',
	imageId : '',
	positionSaved : false,
	logged: false,
	newMessagesCount : 0,
	contactCurrentReadMessagesNumber : 0,
	promptRegConfirmation: false,
	
		
	init: function(){

		//navigator.splashscreen.show();
		app.pictureSource = navigator.camera.PictureSourceType;
        app.destinationType = navigator.camera.DestinationType;
        app.encodingType = navigator.camera.EncodingType;


		app.ajaxSetup();
		app.chooseMainPage();

	},

	ajaxSetup: function(){
		
		var user = window.localStorage.getItem("user");
		var pass = window.localStorage.getItem("pass");
		
		if(user == '' && pass == ''){
			user = 'nouser';
			pass = 'nopass';
		}

		$.ajaxSetup({			
			dataType: 'json',
			type: 'Get',
			timeout: 50000,
			beforeSend: function(xhr){
				//alert(user + ':' + pass);
				xhr.setRequestHeader ("Authorization", "Basic " + btoa ( user + ":" + pass) );
			},		
			statusCode:{
				
				401: function(response, textStatus, xhr){
					
					app.stopLoading();
					app.showPage('login_page');
					document.removeEventListener("backbutton", app.back, false);
					app.alert(response.responseText);
					//app.alert('You entered incorrect data, please try again');
				}
		
			},
			
			error: function(response, textStatus, errorThrown){
				app.stopLoading();				
				//alert(response.status + ':' + errorThrown );
			},
			
			complete: function(response, status, jqXHR){
				app.stopLoading();
			},
		});		
	},

	alert: function(message){
    	navigator.notification.alert(
    		message,
    		function(){},
    		'Notification',
    		'Ok'
    	);
    },
	
	logout:function(){
		
		$(window).unbind('scroll');
		clearTimeout(newMessages);
		app.startLoading();
		pagesTracker = [];
		pagesTracker.push('login_page');

		if(checkNewMessagesRequest != ''){
        	checkNewMessagesRequest.abort();
        	console.log("Abort checkNewMessagesRequest");
       	}

        if(getUsersRequest != ''){
        	getUsersRequest.abort();
        	console.log("Abort getUsersRequest");
        }
		
		$.ajax({				
			url: 'http://m.dating4disabled.com/api/v5/user/logout',
			success: function(data, status){
				//alert(JSON.stringify(data));
				if(data.logout == 1){
					app.logged = false;
					app.positionSaved = false;
					window.localStorage.setItem("userId", "");
					window.localStorage.setItem("user", "");
					window.localStorage.setItem("pass", "");
					app.UIHandler();
					app.ajaxSetup();
					app.stopLoading();
				}
			}
		});
	},

	UIHandler: function(){

		document.removeEventListener("backbutton", app.back, false);

		if(app.logged === false){
			var userInput = window.localStorage.getItem("userInput");
			if(userInput != 'null')
				$('#user_input').find('input').val(userInput);
			$('.appPage').hide();
			$('.new_mes').hide();
			$("#login_page").show();
			$('#back').hide();
			$('#logout').hide();
			$('#contact').hide();
			$('#sign_up').show();
			//app.printUsers();
			app.currentPageId = 'login_page';
			app.currentPageWrapper = $('#'+app.currentPageId);
			if(app.promptRegConfirmation){
				app.promptRegConfirmation = false;
				app.alert("A confirmation mail has been sent to your e-mail. Please confirm your registration so you will be able to log in. If for some reason you don't see this email, please check your spam folder");
			}
		}
		else{
			$('.appPage').hide();
			$("#main_page").show();
			$('#back').hide();
			$('#logout').show();
			$('#sign_up').hide();
			//$('#contact').show();
			app.currentPageId = 'main_page';
			app.currentPageWrapper = $('#'+app.currentPageId);

		}
	},

	loggedUserInit: function(){
		app.searchFuncsMainCall = true;
		app.setBannerDestination();
		app.checkNewMessages();
		//app.pushNotificationInit();
		app.sendUserPosition();
	},



	startLoading: function(){
		navigator.notification.activityStart('Loading', 'Please wait...');
	},

	stopLoading: function(){
		navigator.notification.activityStop();
	},

	chooseMainPage: function(){

		pagesTracker = [];
		pagesTracker.push('main_page');

		app.startLoading();

		$.ajax({
			url: 'http://m.dating4disabled.com/api/v5/user/login',
			error: function(response){
				//alert(JSON.stringify(response));
			},
			statusCode:{
				401: function(response, status, xhr){
					app.logged = false;
					app.UIHandler();
					//alert(JSON.stringify(response));
				}
			},
			success: function(data, status){
				//alert(JSON.stringify(data));
				if(data.userId > 0){
					app.logged = true;
					window.localStorage.setItem("userId", data.userId);
					app.UIHandler();
					app.loggedUserInit();
					$(window).unbind("scroll");
					window.scrollTo(0, 0);


				}
			}
		});
	},


	setBannerDestination: function(){
		$.ajax({
			url: 'http://m.dating4disabled.com/api/v5/user/banner',
			success: function(response, status){
				app.response = response;
				//alert(JSON.stringify(app.response));
				$('#bannerLink').attr("onclick",app.response.banner.func);
				$('#bannerLink').find("img").attr("src",app.response.banner.src);
			}
		});
	},

	sendAuthData: function(){

		var user = $("#authForm .email").val();
		var pass = $("#authForm .password").val();

		window.localStorage.setItem("user",user);
		window.localStorage.setItem("pass",pass);

		$.ajax({
			url: 'http://m.dating4disabled.com/api/v5/user/login',
			beforeSend: function(xhr){
				user = window.localStorage.getItem("user");
				pass = window.localStorage.getItem("pass");
				xhr.setRequestHeader ("Authorization", "Basic " + btoa ( user + ":" + pass) );
			},
			success: function(data, status){
				if(data.userId > 0){
					app.logged = true;
					app.ajaxSetup();
					app.showPage('main_page');
					window.scrollTo(0, 0);
					$('#logout').show();
					window.localStorage.setItem("userId", data.userId);
					window.localStorage.setItem("userInput", user);
					$("#authForm .password").val("");

					//app.UIHandler();
					app.loggedUserInit();
				}
			}
		});
	},

	sendUserPosition: function(){
		if(app.positionSaved === false){
			//alert(0);
			navigator.geolocation.getCurrentPosition(app.persistUserPosition, app.userPositionError, {
			  enableHighAccuracy: true,
			  //timeout: 10000000,
			  //maximumAge: 300000
			});

		}
	},

	persistUserPosition: function(position){

		//alert(1);

		var data = {
			longitude: position.coords.longitude,
			latitude: position.coords.latitude
		};

		//alert(JSON.stringify(data));
		//return;

		$.ajax({
			url: 'http://m.dating4disabled.com/api/v5/user/location',
			type: 'Post',
			data:JSON.stringify(data),
			success: function(response){
				app.response = response;
				app.positionSaved = app.response.result;
				//alert(app.positionSaved);
				app.sortButtonsHandle();
			}
		});
	},

	userPositionError: function(error){
		alert('code: '    + error.code    + '\n' +
	          'message: ' + error.message + '\n');
	},


	printUsers: function(){
		$.ajax({
			url: 'http://m.dating4disabled.com/api/v5/users/recently_visited/2',
			success: function(data, status){
				for ( var i = 0; i < data.users.length; i++) {
					$("#udp_"+i).find(".user_photo_wrap .user_photo").attr("src",data.users[i].mainImage.url);
					$("#udp_"+i).find("span").text(data.users[i].nickName);
					$("#udp_"+i).find(".address").text(data.users[i].city);
				}
				//$(".user_data_preview").slideToggle("slow");
				$(".user_data_preview").show();
			}
		});
	},

	contact: function(){
		window.location.href = 'http://dating4disabled.com/contact.asp';
	},

	pushNotificationInit: function(){


		try{
        	pushNotification = window.plugins.pushNotification;
        	if (device.platform == 'android' || device.platform == 'Android') {
				//alert('registering android');
            	pushNotification.register(app.regSuccessGCM, app.regErrorGCM, {"senderID":"48205136182","ecb":"app.onNotificationGCM"});		// required!
			}
        }
		catch(err){
			txt="There was an error on this page.\n\n";
			txt+="Error description: " + err.message + "\n\n";
			alert(txt);
		}

	},

	// handle GCM notifications for Android
    onNotificationGCM: function(e) {
    	//console.log('EVENT -> RECEIVED:' + e.event);
        switch( e.event ){
            case 'registered':
            	//alert("registered");
			if ( e.regid.length > 0 ){
				// Your GCM push server needs to know the regID before it can push to this device
				// here is where you might want to send it the regID for later use.
				//alert("REGISTERED -> REGID:" + e.regid);
				app.gcmDeviceId = e.regid;
				app.persistGcmDeviceId();
			}
            break;

            case 'message':
            	// if this flag is set, this notification happened while we were in the foreground.
            	// you might want to play a sound to get the user's attention, throw up a dialog, etc.
            	if (e.foreground){
					// if the notification contains a soundname, play it.
					//var my_media = new Media("/android_asset/www/"+e.soundname);
					//my_media.play();

            		if(app.currentPageId == 'messenger_page'){
            			app.getMessenger();
            		}


            		app.checkNewMessages();

				}
				else
				{	// otherwise we were launched because the user touched a notification in the notification tray.

					if (e.coldstart){
						console.log('COLDSTART NOTIFICATION');
						app.getMessenger();
					}
					else{
						console.log('--BACKGROUND NOTIFICATION--');
						app.getMessenger();
					}

					//app.getMessenger();
				}
            	//console.log('MESSAGE -> MSG: ' + e.payload.message);
            	//console.log('MESSAGE -> MSGCNT: ' + e.payload.msgcnt);
            	//alert(e.payload.message);




            break;

            case 'error':
            	console.log('ERROR -> MSG:' + e.msg);
            break;

            default:
            	console.log('EVENT -> Unknown, an event was received and we do not know what it is');
            break;
        }
    },

    persistGcmDeviceId: function(){

    	$.ajax({
			url: 'http://m.dating4disabled.com/api/v5/user/gcmDeviceId',
			type: 'Post',
			data: JSON.stringify({
				gcmDeviceId: app.gcmDeviceId
			}),
			success: function(data, status){
				//alert(data.persisting);
			}
		});

    },

    tokenHandler: function(result) {
        //console.log('success:'+ result);
        // Your iOS push server needs to know the token before it can push to this device
        // here is where you might want to send it the token for later use.
    },

    regSuccessGCM: function (result) {
    	//alert('success:'+ result);
    },

    regErrorGCM: function (error) {
    	//alert('error:'+ error);
    },

	back: function(){
		$.fancybox.close();
		$(window).unbind("scroll");
		window.scrollTo(0, 0);

		pagesTracker.splice(pagesTracker.length-1,1);
		var prevPage = pagesTracker[pagesTracker.length-1];
		//alert(prevPage);

		if(typeof prevPage == "undefined" || prevPage == "main_page" || prevPage == "login_page")
			//app.showPage('main_page');
			app.chooseMainPage();
		else
			app.showPage(prevPage);

		if(app.currentPageId == 'users_list_page'){
			app.template = $('#userDataTemplate').html();
			window.scrollTo(0, app.recentScrollPos);
			app.setScrollEventHandler();
		}
		else{
			var usersListPage = pagesTracker[pagesTracker.length-2];
        	if(usersListPage != 'users_list_page')
        		app.searchFuncsMainCall = true;
        }

		app.searchFuncsMainCall = true;
		app.stopLoading();
	},

	showPage: function(page){
		app.currentPageId = page;
		app.currentPageWrapper = $('#'+app.currentPageId);
		app.container = app.currentPageWrapper.find('.content_wrap');

		if(pagesTracker.indexOf(app.currentPageId) != -1){
			pagesTracker.splice(pagesTracker.length-1,pagesTracker.indexOf(app.currentPageId));
		}

		if(pagesTracker.indexOf(app.currentPageId) == -1){
			pagesTracker.push(app.currentPageId);
		}

		$('.appPage').hide();
		app.currentPageWrapper.show();
		document.addEventListener("backbutton", app.back, false);

		if(app.currentPageId == 'main_page'){
			$('#back').hide();
			$('#sign_up').hide();

			//$('#contact').show();
		}
		else if(app.currentPageId == 'login_page'){
			$('#back').hide();
			$('#sign_up').show();
		}
		else{
			$('#back').show();
			$('#sign_up').hide();
			if(app.newMessagesCount > 0){
				$('.new_mes_count2').html(app.newMessagesCount);
				$(".new_mes").show();
			}
		}

		$(window).unbind("scroll");

	},


	sortByDistance: function(){
		app.sort = 'distance';
		app.chooseSearchFunction();
	},

	sortByEntranceTime: function(){
		app.sort = '';
		app.chooseSearchFunction();
	},

	/*
	sortButtonsHandle: function(){
		if(app.sort == ''){
			$('#sortByEntranceTime').hide();
			$('#sortByDistance').show();
		}
		else{
			$('#sortByDistance').hide();
			$('#sortByEntranceTime').show();
		}
	},
	*/

	sortButtonsHandle: function(){

		//alert(app.positionSaved);

		if(app.positionSaved === true && app.responseItemsNumber > 0){
			$('.sortButtonWrap').show();
		}
		else{
			$('.sortButtonWrap').hide();
		}

		if(app.sort == ''){
			$('#sortByEntranceTime').hide();
			$('#sortByDistance').show();
		}
		else{
			$('#sortByDistance').hide();
			$('#sortByEntranceTime').show();
		}

	},

	chooseSearchFunction: function(){

		app.searchFuncsMainCall = false;

		if(app.action == 'getOnlineNow'){
			app.getOnlineNow();
		}
		else if(app.action == 'getStatResults'){
			app.getStatUsers(app.statAction);
		}
		else if(app.action == 'getSearchResults'){
			app.search();
		}
	},


	getOnlineNow: function(){
		app.showPage('users_list_page');
		app.currentPageWrapper.find('.content_wrap').html('');
		app.template = $('#userDataTemplate').html();
		app.container = app.currentPageWrapper.find('.content_wrap');
		app.action = 'getOnlineNow';
		app.pageNumber = 1;
		app.getUsers();
	},


	getUsers: function(){
		app.startLoading();
		//alert(555);

		if(app.searchFuncsMainCall === true && app.positionSaved === true){
			app.sort = '';
			$('#sortByEntranceTime').hide();
			$('#sortByDistance').show();
		}

		if(app.action == 'getOnlineNow'){
			//app.requestUrl = 'http://m.dating4disabled.com/api/v5/users/online/'+app.itemsPerPage+'/'+app.pageNumber;
			app.requestUrl = 'http://m.dating4disabled.com/api/v5/users/online/count:'+app.itemsPerPage+'/page:'+app.pageNumber+'/sort:'+app.sort;
		}
		else if(app.action == 'getSearchResults'){
			var countryCode = $('#countries_list').val();
			var regionCode = $('.regionsList select').val();
			var ageFrom = $(".age_1 select").val();
			var ageTo = $(".age_2 select").val();
			var disabilityId = $('#health_list').val();
			var nickName = $('.nickName').val();
			var gender = $('#gender').val();
			//alert(nickName);
			app.requestUrl = 'http://m.dating4disabled.com/api/v5/users/search/gender:'+gender+'/country:'+countryCode+'/region:'+regionCode+'/age:'+ageFrom+'-'+ageTo+'/disability:'+disabilityId+'/nickName:'+nickName+'/count:'+app.itemsPerPage+'/page:'+app.pageNumber;
			//app.requestUrl = 'http://m.dating4disabled.com/api/v5/users/search/gender:'+gender+'/country:'+countryCode+'/region:'+regionCode+'/age:'+ageFrom+'-'+ageTo+'/disability:'+disabilityId+'/count:'+app.itemsPerPage+'/page:'+app.pageNumber;
		}
		else if(app.action == 'getStatResults'){
			app.requestUrl = 'http://m.dating4disabled.com/api/v5/user/statistics/'+app.statAction+'/count:'+app.itemsPerPage+'/page:'+app.pageNumber;
		}

		getUsersRequest = $.ajax({
			url: app.requestUrl,
			timeout:10000,
			//error:function(response){
				//alert(JSON.stringify(response));
			//},
			success: function(response, status){
				app.response = response;
				//alert(JSON.stringify(app.response));
				app.displayUsers();
				app.sortButtonsHandle();
			}
		});
	},


	displayUsers: function(){

		var userId = window.localStorage.getItem("userId");
		app.responseItemsNumber = app.response.users.itemsNumber;
		//alert(app.responseItemsNumber);

		if(app.responseItemsNumber > 0){

			for(var i in app.response.users.items){
				var currentTemplate = app.template;
				var user = app.response.users.items[i];

				currentTemplate = currentTemplate.replace("[USERNICK]",user.nickName);
				currentTemplate = currentTemplate.replace("[AGE]",user.age);
				currentTemplate = currentTemplate.replace("[COUNTRY]",user.country+',');
				currentTemplate = currentTemplate.replace("[CITY]",user.city);
				currentTemplate = currentTemplate.replace("[IMAGE]",user.mainImage.url);
				currentTemplate = currentTemplate.replace(/\[USERNICK\]/g,user.nickName);
				currentTemplate = currentTemplate.replace("[USER_ID]", user.id);

				var aboutUser = '';
				if(typeof(user.about) === 'string'){
					if(user.about.length > 90){
						aboutUser = user.about.substring(0,90)+'...';
					}
					else{
						aboutUser = user.about;
					}
				}
				currentTemplate = currentTemplate.replace("[ABOUT]", aboutUser);
				app.container.append(currentTemplate);
				var currentUserNode = app.container.find(".user_data:last-child");
				currentUserNode.find(".user_short_txt").attr("onclick","app.getUserProfile("+user.id+");");
				currentUserNode.find(".user_photo_wrap").attr("onclick","app.getUserProfile("+user.id+");");

				//alert(userId +':'+userId);

				if(user.id == userId)
					currentUserNode.find(".send_mes").addClass("hidden");

				if(user.isNew == 1){
					currentUserNode.find(".blue_star").show();
				}
				if(user.isPaying == 1){
					currentUserNode.find(".special3").show();
				}
				if(user.isOnline == 1){
					currentUserNode.find(".on2").show();
				}

			}

			app.stopLoading();
			app.setScrollEventHandler();

		}
		else{
			app.container.append('<div class="noResults">No Results</div>');
			$('.sortButtonWrap').hide();
		}
	},

	setScrollEventHandler: function(){
		$(window).scroll(function(){
			app.recentScrollPos = $(this).scrollTop();
			if(app.recentScrollPos >= app.container.height()-750){
				$(this).unbind("scroll");
				if(app.responseItemsNumber == app.itemsPerPage){
					app.pageNumber++;
					app.getUsers();
				}
			}
		});
	},

	getMyProfileData: function(){
		app.startLoading();

		$("#upload_image").click(function(){
			$("#statistics").hide();
			$("#uploadDiv").css({"background":"#fff"});
			$("#uploadDiv").show();

			$('#get_stat_div').show();
			$('#upload_image_div').hide();
		});

		$("#get_stat").click(function(){
			$("#statistics").show();
			$("#uploadDiv").hide();

			$('#get_stat_div').hide();
			$('#upload_image_div').show();
		});

		/*
		$("#take_a_photo").click(function(){
			app.capturePhoto(app.pictureSource.CAMERA, app.destinationType.DATA_URL);
		});

		$("#choose_from_library").click(function(){
			app.capturePhoto(app.pictureSource.PHOTOLIBRARY, app.destinationType.FILE_URI);
		});
		*/
		app.showPage('my_profile_page');
        app.container = app.currentPageWrapper.find('.myProfileWrap');
		app.container.find(".special4").hide();


		var userId = window.localStorage.getItem("userId");

		$.ajax({
			url: 'http://m.dating4disabled.com/api/v5/user/profile/'+userId,
			success: function(user, status, xhr){

				app.showPage('my_profile_page');
				app.container = app.currentPageWrapper.find('.myProfileWrap');

				app.container.find('.txt strong').html(user.nickName+', <span>'+user.age+'</span>');
				app.container.find('.txt strong').siblings('span').text(user.country+', '+user.city);
				app.container.find('.txt').append(user.about);
				app.container.find('.user_pic img').attr("src",user.mainImage.url);

				if(user.isPaying == 1){
					app.container.find(".special4").show();
				}

				var addedToFriends = user.statistics.fav;
				var contactedYou = user.statistics.contactedme;
				var contacted = user.statistics.contacted;
				var addedToBlackList = user.statistics.black;
				var addedYouToFriends = user.statistics.favedme;
				var lookedMe = user.statistics.lookedme;

				app.container.find(".stat_side").eq(1).find(".items_wrap").eq(0).find(".stat_value").text(addedToFriends);
				app.container.find(".stat_side").eq(0).find(".items_wrap").eq(1).find(".stat_value").text(contactedYou);
				app.container.find(".stat_side").eq(1).find(".items_wrap").eq(2).find(".stat_value").text(contacted);
				app.container.find(".stat_side").eq(1).find(".items_wrap").eq(1).find(".stat_value").text(addedToBlackList);
				app.container.find(".stat_side").eq(0).find(".items_wrap").eq(0).find(".stat_value").text(addedYouToFriends);
				app.container.find(".stat_side").eq(0).find(".items_wrap").eq(2).find(".stat_value").text(lookedMe);

				app.stopLoading();
			}
		});
	},

	getStatUsers: function(statAction){
		app.showPage('users_list_page');
		app.currentPageWrapper.find('.content_wrap').html('');
		app.template = $('#userDataTemplate').html();
		app.container = app.currentPageWrapper.find('.content_wrap');
		app.pageNumber = 1;
		app.action = 'getStatResults';
		app.statAction = statAction;
		app.getUsers();
	},

	getSearchForm: function(){
		//$('#search_form_page').find('#gender').css({"disabled":"disabled"});
		app.startLoading();
		app.showPage('search_form_page');
		$("#regions_wrap").hide();

		app.getCountries();
		app.getDisabilities();

		var html = '<select>';
		for(var i = 18; i <= 80; i++){
			html = html + '<option value="' + i + '"">' + i + '</option>';
		}
		html = html + '</select>';

		$(".age_1").html(html);
		$(".age_1").trigger("create");

		var html = '<select>';
		var sel = '';
		for(var i = 19; i <= 80; i++){
			if(i == 40) sel = ' selected="selected"';
			else sel = '';
			html = html + '<option value="' + i + '"' + sel + '>' + i + '</option>';
		}
		html = html + '</select>';

		$(".age_2").html(html);
		$(".age_2").trigger("create");

		app.stopLoading();

	},

	getDisabilities: function(){

    	$.ajax({
    		url: 'http://m.dating4disabled.com/api/v5/list/health',
    		success: function(list, status, xhr){
    			var html = (app.currentPageId == 'register_page') ? '' : '<option value="">All</option>';
    			for(var i in list.items){
    				var item = list.items[i];
    				html = html + '<option value="' + item.healthId + '">' + item.healthName + '</option>';
    			}

    		   var disability = app.container.find("#health_list");
    		   disability.html(html);
    		   disability.val(disability.val()).selectmenu("refresh");
    		}
    	});
    },


    getMobility: function(){

    	$.ajax({
    	   url: 'http://m.dating4disabled.com/api/v5/list/mobility',
    	   success: function(list, status, xhr){
    	       var html = (app.currentPageId == 'register_page') ? '' : '<option value="">All</option>';
    	       for(var i in list.items){
    		       var item = list.items[i];
    	           html = html + '<option value="' + item.mobilityId + '">' + item.mobilityName + '</option>';
    	       }

    		   var mobility = app.container.find("#mobility_list");
        	   mobility.html(html);
    	       mobility.val(mobility.val()).selectmenu("refresh");
    	   }
        });
    },


	getSexPreference: function(){
		$.ajax({
			url: 'http://m.dating4disabled.com/api/v5/list/sexPreference',
			success: function(list, status, xhr){
				var html = '';
				for(var i in list.items){
					var item = list.items[i];
					html = html + '<option value="' + item.sexPrefId + '">' + item.sexPrefName + '</option>';
				}
				$("#sex_preference_list").html(html);
				$("#sex_preference_list").val($("#sex_preference_list").val());
				$("#sex_preference_list").find("option[value='1']").insertBefore($("#sex_preference_list").find("option:eq(0)"));
				$("#sex_preference_list").val($("#sex_preference_list").find("option:first").val()).selectmenu("refresh");

			}

		});
	},

	getCountries: function(){
		$.ajax({
			url: 'http://m.dating4disabled.com/api/v5/list/countries',
			success: function(list, status, xhr){
			   var html = (app.currentPageId == 'register_page') ? '<option value="">Choose</option>' : '';

				for(var i in list.items){
					var item = list.items[i];
				    if(item.countryCode != '--'){
						html = html + '<option value="' + item.countryCode + '">' + item.countryName + '</option>';
					}
				}

				var countriesContainer = app.container.find("#countries_list");
				app.injectCountries(html, countriesContainer);
				app.getRegions(countriesContainer.val());
				countriesContainer.change(function(){
					app.getRegions($(this).val());
				});

				if(app.currentPageId == 'register_page'){
					app.injectCountries(html, app.container.find("#countries_list2"));
				}
			}
		});

	},

	injectCountries: function(html, container){
    	container.html(html);
    	container.trigger('create');

    	if(app.currentPageId == 'register_page'){
    		container.find("option[value='US']").insertAfter(container.find("option:eq(0)"));
            container.find("option[value='CA']").insertAfter(container.find("option:eq(1)"));
            container.find("option[value='AU']").insertAfter(container.find("option:eq(2)"));
            container.find("option[value='GB']").insertAfter(container.find("option:eq(3)"));
    	}
    	else{
    		container.find("option[value='US']").insertBefore(container.find("option:eq(0)"));
            container.find("option[value='CA']").insertBefore(container.find("option:eq(1)"));
            container.find("option[value='AU']").insertBefore(container.find("option:eq(2)"));
            container.find("option[value='GB']").insertBefore(container.find("option:eq(3)"));
    	}

    	container.val(container.find("option:first").val()).selectmenu("refresh");
    },


	getRegions: function(countryCode){
		$.ajax({
			url: 'http://m.dating4disabled.com/api/v5/list/regions/'+countryCode,
			success: function(list, status, xhr){
				//var html = '<select>';
				var html = '<select name="regionCode" id="regionCode"><option value="">Choose</option>';


				if(app.currentPageId == 'search_form_page'){
					html = html + '<option value="">All</option><option value="">Choose</option>';
				}

				app.container.find("#regions_wrap").hide();
				app.container.find(".regionsList").html('');

				app.container.find("#cities_wrap").hide();
				app.container.find(".citiesList").html('');

				if(list.itemsNumber > 0){
					for(var i in list.items){
						var item = list.items[i];
						html = html + '<option value="' + item.regionCode + '">' + item.regionName + '</option>';
					}
					html = html + '</select>';
					app.container.find(".regionsList").html(html).trigger('create');
					app.container.find("#regions_wrap").show();

					if(app.currentPageId == 'register_page'){
						app.container.find('.regionsList select').change(function(){
							app.getCities(app.container.find("#countries_list").val(),$(this).val());
						});
					}
				}
				else{
					var html = '<input type="text" name="cityName" id="cityName" />';
					app.container.find(".citiesList").html(html);
					app.container.find("#cities_wrap").show();
				}

			}
		});
	},

	getCities: function(countryCode,regionCode){
		$.ajax({
			url: 'http://m.dating4disabled.com/api/v5/list/cities/'+countryCode+'/'+regionCode,
			success: function(list, status, xhr){
				app.container.find("#cities_wrap").hide();
				if(list.itemsNumber > 0){
					var html = '<select name="cityName">';
					for(var i in list.items){
						var item = list.items[i];
						html = html + '<option value="' + item.cityName + '">' + item.cityName + '</option>';
					}
					html = html + '</select>';
					app.container.find(".citiesList").html(html).trigger('create');
					app.container.find("#cities_wrap").show();
				}
				else{
					if(countryCode != 'US'){
						var html = '<input type="text" name="cityName" id="cityName" />';
						app.container.find(".citiesList").html(html);
						app.container.find("#cities_wrap").show();
					}
				}
			}
		});
	},

	sendRegData: function(){

		if(app.formIsValid()){


			app.startLoading();

			var data = JSON.stringify(
				$('#regForm').serializeObject()
			);

			$.ajax({
				url: 'http://m.dating4disabled.com/api/v5/user',
				//url: 'http://m.dating4disabled.com/api/insert.asp',
				type: 'Post',
				data: data,
				success: function(response){
					app.response = response;
					//alert( JSON.stringify(app.response));
					if(app.response.result > 0){
						var user = app.container.find("#userEmail").val();
						var pass = app.container.find("#userPass").val();
						window.localStorage.setItem("user",user);
						window.localStorage.setItem("pass",pass);
						window.localStorage.setItem("userId", app.response.result);
						//alert(window.localStorage.getItem("user") + " " + window.localStorage.getItem("pass"));
						app.ajaxSetup();
						app.getRegStep();
					}
					else{
						app.alert(app.response.err);
					}
				}
			});


		}

	},

	getRegStep: function(){
		//$('#test_test_page').show();
		app.promptRegConfirmation = true;
		app.showPage('upload_image_page');
		app.container.find('.regInfo').text('Please check your e-mail in order to confirm your registration. You may now upload an image in JPEG format to your profile.'); // Also you may upload an image in your profile now.
		window.scrollTo(0,0);

	},

	formIsValid: function(){

		var email_pattern = new RegExp(/^[+a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/i);

		if (!(email_pattern.test(app.container.find('#userEmail').val()))) {
			app.alert('Invalid e-mail');
			//$('#userEmail').focus();
			return false;
		}

		/*
		if (app.container.find('#userEmail').val() != app.container.find('#userEmail2').val()) {
			alert("Error in retyped email");
			//$('#userEmail2').focus();
			return false;
		}
		*/
		if (app.container.find('#userPass').val().length < 4 || app.container.find('#userPass').val().length > 12) {
			app.alert("Invalid password (must be 4 to 12 characters)");
			//$('#userPass').focus();
			return false;
		}

		if (app.container.find('#userPass').val() != app.container.find('#userPass2').val()) {
			app.alert("Error in retyped password");
			//$('#userPass2').focus();
			return false;
		}

		if (app.container.find('#userNick').val().length < 3) {
			app.alert('Invalid username (must be at least 3 characters)');
			//$('#userNic').focus();
			return false;
		}

		if (!app.container.find('#userGender').val().length) {
			app.alert('Invalid Gender');
			return false;
		}

		if (!app.container.find('.sexPreferenceList select').val().length) {
			app.alert('Invalid Sexual Preference');
			return false;
		}


		if($('#d').val().length == 0 || $('#m').val().length == 0 || $('#y').val().length == 0){
			app.alert('Invalid Date Of Birth');
			return false;
		}

		if (!app.container.find('#countries_list').val().length) {
			app.alert('Invalid Country');
			return false;
		}

		if (!app.container.find('.regionsList select').val().length) {
			app.alert('Invalid State');
			return false;
		}

		if(app.container.find('#cityName').val().length < 3){
			app.alert('Invalid city (must be at least 3 characters)');
			return false;
		}

		if(app.container.find('#zipCode').val().length < 3 || app.container.find('#zipCode').val().length > 5){
			alert('Invalid Zip Code');
			return false;
		}

		if(!app.container.find('#countries_list2').val().length){
			alert('Invalid Country Of Origin');
			return false;
		}

		if(app.container.find('#firstName').val().length < 2){
			app.alert('Invalid First Name (must be at least 2 characters)');
			return false;
		}

		if(app.container.find('#lastName').val().length < 2){
			app.alert('Invalid Last Name (must be at least 2 characters)');
			return false;
		}

		if (!app.container.find('.maritalStatusList select').val().length) {
			app.alert('Invalid Marital Status');
			return false;
		}

		if (!app.container.find('.childrenList select').val().length) {
			app.alert('Invalid Children');
			return false;
		}

		if (!app.container.find('.ethnicityList select').val().length) {
			app.alert('Invalid Ethnicity');
			return false;
		}

		if (!app.container.find('.religionsList select').val().length) {
			app.alert('Invalid Religion');
			return false;
		}

		if (!app.container.find('.educationList select').val().length) {
			app.alert('Invalid Education');
			return false;
		}

		if (!app.container.find('.occupationList select').val().length) {
			app.alert('Invalid Occupation');
			return false;
		}

		if (!app.container.find('.incomeList select').val().length) {
			app.alert('Invalid Income');
			return false;
		}

		if(!app.container.find('.languageList input[type="checkbox"]:checked').size()){
			app.alert('Invalid Language');
			return false;
		}

		if (!app.container.find('.smokingList select').val().length) {
			app.alert('Invalid Smoking');
			return false;
		}

		if (!app.container.find('.drinkingList select').val().length) {
			app.alert('Invalid Drinking');
			return false;
		}

		if (!app.container.find('.bodyTypeList select').val().length) {
			app.alert('Invalid Body Style');
			return false;
		}

		if (!app.container.find('.heightList select').val().length) {
			app.alert('Invalid Height');
			return false;
		}

		if (!app.container.find('.eyesColorList select').val().length) {
			app.alert('Invalid Eyes Color');
			return false;
		}

		if (!app.container.find('.hairColorList select').val().length) {
			app.alert('Invalid Hair Color');
			return false;
		}

		if(app.container.find('#aboutMe').val().length < 10){
			app.alert('Invalid About Me (must be at least 10 characters)');
			return false;
		}

		if(app.container.find('#lookingFor').val().length < 10){
			app.alert('Invalid Looking For (must be at least 10 characters)');
			return false;
		}

		if (!app.container.find('.healthList select').val().length) {
			app.alert('Invalid Life Challenge');
			return false;
		}

		if (!app.container.find('.mobilityList select').val().length) {
			app.alert('Invalid Mobility');
			return false;
		}

		if(!app.container.find('.lookingForList input[type="checkbox"]:checked').size()){
			app.alert('Invalid Looking For');
			return false;
		}

		if(app.container.find('#confirm option:selected').val() != "1"){
			app.alert('Please check confirmation box');
			return false;
		}



		return true;
	},


	search: function(pageNumber){
		app.showPage('users_list_page');
		app.template = $('#userDataTemplate').html();
		app.container = app.currentPageWrapper.find('.content_wrap');
		app.container.html('');
		app.pageNumber = 1;
		app.action = 'getSearchResults';
		app.getUsers();
	},

	reportAbuse: function(){

    	var abuseMessage = $('#abuseMessage').val();

    	$.ajax({
    		url: 'http://m.dating4disabled.com/api/v5/user/abuse/'+app.reportAbuseUserId,
    		type: 'Post',
    		contentType: "application/json; charset=utf-8",
    		data: JSON.stringify({
    			abuseMessage: abuseMessage
    		}),
    		success: function(response, status, xhr){
    		   $('#abuseMessage').val('');
    		   app.alert('Thank you. The message has been sent');
    		   app.back();
    		}
    	});
    },

    sendMessageToAdmin: function(){

       	var userId = window.localStorage.getItem("userId");
       	var messageToAdmin = $('#messageToAdmin').val();

       	if(!messageToAdmin.length){
       		return;
       	}

       	$.ajax({
       		url: 'http://m.dating4disabled.com/api/v5/contactUs',
       		type: 'Post',
       		contentType: "application/json; charset=utf-8",
       		data: JSON.stringify({
       			userId: userId,
       			messageToAdmin: messageToAdmin,
       		}),
       		error: function(error){
       			alert(JSON.stringify(error));
       		},
       		success: function(response, status, xhr){
       		   $('#messageToAdmin').val('');
       		   app.alert('Thank you. The message has been sent');
       		   app.back();
       		}
       	});
    },



	getUserProfile: function(userId){

		if(getUsersRequest != ''){
        	getUsersRequest.abort();
        	console.log("Abort getUsersRequest");
        	app.pageNumber--;
        }

        if(userId==window.localStorage.getItem("userId")){app.getMyProfileData(); return;}
        app.ajaxSetup();
        app.startLoading();
		app.reportAbuseUserId = userId;

		$.ajax({
			url: 'http://m.dating4disabled.com/api/v5/user/profile/'+userId,
			type: 'Get',
			success: function(user, status, xhr){
				//alert(user.userId);
				$('.my-gallery').html('');

				app.showPage('user_profile_page');

				window.scrollTo(0, 0);

				var userId = window.localStorage.getItem("userId");

				var detailsContainer = app.container.find('#user_details');

				app.container.find('#pic1, #pic2, #pic3').attr("src","");
				app.container.find(".special3, .blue_star, .on5, .pic_wrap").hide();

				//app.container.find('.pic_wrap').addClass("left").removeClass("center");
				//app.container.find('#pic1').parent('a').addClass("fancybox");

				app.container.find("h1 span").text(user.nickName);
				app.container.find('#pic1').attr("src",user.mainImage.url).parent('a').attr({"href":user.mainImage.url, "rel":"images_"+user.userId});

				/*
				if(user.mainImage == "http://m.dating4disabled.com/images/no_photo_female.jpg"
				|| user.mainImage == "http://m.dating4disabled.com/images/no_photo_male.jpg"){
					app.container.find('#pic1').parent('a').removeClass("fancybox").attr("href","#");
				}
				*/

				//app.container.find('.pic_wrap').eq(0).show();

				//alert(JSON.stringify(user));

				if(user.mainImage.size.length){
					$('.noPicture').hide();
					var userPhotoTemplate = $('#userPhotoTemplate').html().replace(/\[ID\]/g,'pic1');
					$(userPhotoTemplate).appendTo('.my-gallery');
					app.container.find('#pic1').attr("src",user.mainImage.url).parent('a').attr({"href":user.mainImage.url, "data-size": user.mainImage.size});
					app.container.find('.pic_wrap').eq(0).show();
				}
				else{
					$('.noPicture img').attr("src",user.mainImage.url);
					$('.noPicture').show();
                }




				/*

				if(typeof user.otherImages[0] !== "undefined"){
					//alert(user.otherImages[0]);
					app.container
						.find('.pic_wrap').eq(1).show()
						.find("img").attr("src",user.otherImages[0])
						.parent('a')
						.attr({"href":user.otherImages[0], "rel":"images_"+user.userId});
				}else{
					app.container.find('.pic_wrap').eq(0).addClass("center").removeClass("left");
				}

				if(typeof user.otherImages[1] !== "undefined"){
					//alert(user.otherImages[1]);
					app.container.find('.pic_wrap').eq(2).show()
						.find("img").attr("src",user.otherImages[1])
						.parent('a').attr({"href":user.otherImages[1], "rel":"images_"+user.userId});
				}
				*/

				if(typeof user.otherImages[0] !== "undefined"){
					app.proccessUserPhotoHtml(user,1);
				}else{
					app.container.find('.pic_wrap').addClass("center");
                }

				if(typeof user.otherImages[1] !== "undefined"){
					app.proccessUserPhotoHtml(user,2);
				}

				initPhotoSwipeFromDOM('.my-gallery');


				if(user.isPaying == 1){
					app.container.find(".special3").show();
				}

				if(user.isNew == 1){
					app.container.find(".blue_star").show();
				}

				if(user.isOnline == 1){
					app.container.find(".on5").show();
				}

				app.profileGroupTemplate = $('#userProfileGroupTemplate').html();
				app.profileLineTemplate = $('#userProfileLineTemplate').html();

				if(user.userId != userId){
					var profileButtonsTemplate = $('#userProfileButtonsTemplate').html();
					var profileButtonsTemplate_2 = $('#userProfileButtonsTemplate_2').html();
					profileButtonsTemplate = profileButtonsTemplate.replace(/\[USERNICK\]/g,user.nickName);
					profileButtonsTemplate = profileButtonsTemplate.replace("[USER_ID]", user.userId);
				}
				else{
					var profileButtonsTemplate = '';
					var profileButtonsTemplate_2 = '';
				}


				var html = profileButtonsTemplate;

				html = html + app.getProfileGroup("General Information");
				html = html + app.getProfileLine("Nickname", user.nickName);
				html = html + app.getProfileLine("Age", user.age);
				html = html + app.getProfileLine("City", user.city);
				html = html + app.getProfileLine("Region", user.region);
				html = html + app.getProfileLine("Country", user.country);
				html = html + app.getProfileLine("Sexual Prefernce", user.sexPreference);
				html = html + app.getProfileGroup("Background");
				html = html + app.getProfileLine("Relationship Status", user.maritalStatus);
				html = html + app.getProfileLine("Children", user.children);
				html = html + app.getProfileLine("I am looking for", user.lookingFor);
				html = html + app.getProfileLine("My Ethnicity", user.ethnity);
				html = html + app.getProfileLine("My Religion", user.religion);
				html = html + app.getProfileLine("My Education", user.education);
				html = html + app.getProfileLine("Country I was born in", user.birthCountry);
				html = html + app.getProfileLine("My Annual Income", user.income);
				html = html + app.getProfileLine("Occupation", user.occupation);
				html = html + app.getProfileGroup("Physical appearance");
				html = html + app.getProfileLine("Appearance", user.appearance);
				html = html + app.getProfileLine("Body Type", user.bodyType);
				html = html + app.getProfileLine("Height", user.height);
				html = html + app.getProfileLine("Weight", user.weight);
				html = html + app.getProfileLine("Hair color", user.hairColor);
				html = html + app.getProfileLine("Hair style", user.hairLength);
				html = html + app.getProfileLine("Eye color", user.eyesColor);
				html = html + app.getProfileGroup("Personality And Interests");
				html = html + app.getProfileLine("My Hobbies", user.hobbies);
				html = html + app.getProfileLine("Drinking Habits", user.drinking);
				html = html + app.getProfileLine("Smoking Habits", user.smoking);
				html = html + app.getProfileGroup("Disability Information");
				html = html + app.getProfileLine("My Life Challenge", user.disability);
				html = html + app.getProfileLine("Mobility", user.mobility);
				html = html + profileButtonsTemplate + profileButtonsTemplate_2;

				detailsContainer.html(html).trigger('create');

				app.stopLoading();
			}
		});
	},

	proccessUserPhotoHtml: function(user,index){

    	var userPhotoTemplate = $('#userPhotoTemplate').html().replace(/\[ID\]/g,'pic' + index + 1);
    	$(userPhotoTemplate).appendTo('.my-gallery');

    	var imageSize = (user.otherImages[index-1].size.length) ? user.otherImages[index-1].size : '1x1' ;

    	console.log("SIZE of " + user.otherImages[index-1].url + ":" + imageSize);

    	app.container
    		.find('.pic_wrap')
    		.css({"float": "left"})
    		.eq(index)
    		.show()
    		.find('img')
    		.show()
    		.attr("src",user.otherImages[index-1].url)
    		.parent('a')
    		.attr({"href": user.otherImages[index-1].url, "data-size": imageSize});
    },


	getProfileGroup: function(groupName){
		var group = app.profileGroupTemplate;
		return group.replace("[GROUP_NAME]", groupName);
	},

	getProfileLine: function(lineName, lineValue){
		if(lineValue === null)
			lineValue = "";

		var line = app.profileLineTemplate;
		line = line.replace("[LINE_NAME]", lineName);
		line = line.replace("[LINE_VALUE]", lineValue);
		return line;
	},

	getMessenger: function(){
		app.startLoading();

		$.ajax({
			url: 'http://m.dating4disabled.com/api/v5/user/contacts',
			success: function(response){
				app.response = response;
				app.showPage('messenger_page');
				app.container = app.currentPageWrapper.find('.chats_wrap');
				app.container.html('');
				app.template = $('#messengerTemplate').html();

				for(var i in app.response.allChats){
					var currentTemplate = app.template;
					var chat = app.response.allChats[i];
					currentTemplate = currentTemplate.replace("[IMAGE]",chat.user.mainImage.url);
					currentTemplate = currentTemplate.replace(/\[USERNICK\]/g,chat.user.nickName);
					currentTemplate = currentTemplate.replace("[RECENT_MESSAGE]",chat.recentMessage.text);
					currentTemplate = currentTemplate.replace("[DATE]", chat.recentMessage.date);
					currentTemplate = currentTemplate.replace("[USER_ID]", chat.user.userId);

					app.container.append(currentTemplate);

					var currentUserNode = app.container.find(":last-child");
					if(chat.newMessagesCount > 0){
						currentUserNode.find(".new_mes_count").html(chat.newMessagesCount).show();
					}
				}
				app.stopLoading();
			}
		});
	},

	getChat: function(chatWith, userNick){

		app.chatWith = chatWith;
		app.startLoading();

		$.ajax({
			url: 'http://m.dating4disabled.com/api/v5/user/chat/'+app.chatWith,
			success: function(response){
				app.response = response;
				app.contactCurrentReadMessagesNumber = app.response.contactCurrentReadMessagesNumber;
				app.showPage('chat_page');
				window.scrollTo(0, 0);
				app.container = app.currentPageWrapper.find('.chat_wrap');
				app.container.html('');
				app.template = $('#chatMessageTemplate').html();
				app.currentPageWrapper.find('.content_wrap').find("h1 span").text(userNick).attr("onclick", "app.getUserProfile('"+app.chatWith+"');")
				var html = app.buildChat();
				app.container.html(html);
				app.refreshChat();
				app.stopLoading();
			}
		});
	},




	buildChat: function(){
		var html = '';
		var k = 1;
		var appendToMessage = '';
		var unreadMessages = [];

		if(app.response.chat.abilityReadingMessages == 0){
			appendToMessage = '<div style="font-size:16px;">Click here to<span onclick="app.getSubscription();" class="ui-link"> buy subscription </span>';

			if(app.response.chat.userHasFreePoints){
				appendToMessage = appendToMessage + '<br><br>or use your <span onclick="app.useFreePointToReadMessage(this,[MESSAGE_ID]);" class="ui-link">free point</span> to read this message';
			}

			appendToMessage = appendToMessage + '</div>';
		}

		for(var i in app.response.chat.items){
			var currentTemplate = app.template;
			var message = app.response.chat.items[i];

			//alert(message.text);

			if(app.chatWith == message.from){
				var messageType = "message_in";
				var messageStatusVisibility = 'hidden';
				var messageStatusImage = '';
				//message.text = message.text + appendToMessage;
				if(app.response.chat.abilityReadingMessages == 0){
					message.text = appendToMessage;
					message.text = message.text.replace("[MESSAGE_ID]", message.id);
				}
				else{
					if(message.isRead == 0){
						unreadMessages.push(message.id);
					}
				}

			}
			else{
				var messageType = "message_out";
				var messageStatusVisibility = '';
				var messageStatusImage = (message.isRead == 1) ? 'messageRead.jpg' : 'messageSaved.jpg';
				//console.log(message.text + ' => ' + messageStatusImage + ' => ' + message.isRead);
				//<div class="read_mess"><img src="images/<?=$read_mess_img?>"></div>
			}

			if(from == message.from) k--;

			if(k % 2 == 0){
				messageFloat = "right";
				info = "info_right";
			}
			else{
				messageFloat = "left";
				info = "info_left";
			}

			currentTemplate = currentTemplate.replace("[MESSAGE_ID]", message.id);
			currentTemplate = currentTemplate.replace("[MESSAGE]", message.text);
			currentTemplate = currentTemplate.replace("[DATE]", message.date);
			currentTemplate = currentTemplate.replace("[TIME]", message.time);
			currentTemplate = currentTemplate.replace("[MESSAGE_TYPE]", messageType);
			currentTemplate = currentTemplate.replace("[MESSAGE_FLOAT]", messageFloat);
			currentTemplate = currentTemplate.replace("[MESSAGE_STATUS_VISIBILITY]", messageStatusVisibility);
			currentTemplate = currentTemplate.replace("[MESSAGE_STATUS_IMAGE]", messageStatusImage);
			currentTemplate = currentTemplate.replace("[INFO]", info);

			html = html + currentTemplate;

			//console.log(html);

			var from = message.from;



			k++;
		}

		//console.log(html);


		app.setMessagesAsRead(unreadMessages);

		return html;
	},

	setMessagesAsRead: function(unreadMessages){

		//console.log(JSON.stringify({unreadMessages: unreadMessages}));

		if(unreadMessages.length == 0)
			return;


		$.ajax({
		   url: 'http://m.dating4disabled.com/api/v5/user/messenger/setMessagesAsRead',
		   error: function(response){
			   console.log(JSON.stringify(response));
		   },
		   type: 'Post',
		   contentType: "application/json; charset=utf-8",
		   data: JSON.stringify({
			   unreadMessages: unreadMessages
		   }),
		   success: function(response){
			   console.log("SUCCESS: " + JSON.stringify(response) );
		   }
	   });

	},


	useFreePointToReadMessage: function(clickedObj,messageId){
		app.startLoading();

		//console.log('http://m.dating4disabled.com/api/v5/user/chat/useFreePointToReadMessage/' + messageId);

		$.ajax({
			url: 'http://m.dating4disabled.com/api/v5/user/chat/useFreePointToReadMessage/' + messageId,
			   error: function(response){
			       console.log(JSON.stringify(response));
			   },
			success: function(response){
			   console.log($(clickedObj).parent().html());
			   $(clickedObj).parents('.message_cont').html(response.messageText);
			   app.stopLoading();
			}
		});
	},


	sendMessage: function(){

		//clearTimeout(refresh);


		refreshChat.abort();

		console.log(app.currentPageId);

		var message = $('#message').val();
		if(message.length > 0){
			$('#message').val('');
			app.startLoading();
			$.ajax({
				url: 'http://m.dating4disabled.com/api/v5/user/chat/'+app.chatWith,
				type: 'Post',
				contentType: "application/json; charset=utf-8",
				data: JSON.stringify({
					message: message
				}),
				success: function(response){
				   app.container = app.currentPageWrapper.find('.chat_wrap');
				   console.log(app.currentPageId);
				   app.stopLoading();
				   if(app.currentPageId == 'chat_page'){
						app.response = response;
						var html = app.buildChat();
						app.container.html(html);
        			    app.refreshChat();
					}


				   console.log(app.currentPageId);
				}
			});

		}
	},


	refreshChat: function(){

		if(refreshChat != ""){
			refreshChat.abort();
		}

		if(app.currentPageId == 'chat_page'){
			refreshChat = $.ajax({
				url: 'http://m.dating4disabled.com/api/v5/user/chat/'+app.chatWith+'/'+app.contactCurrentReadMessagesNumber+'/refresh',
				type: 'Get',
				error:function(error){
					  console.log(JSON.stringify(error));
				},
				complete: function(response, status, jqXHR){
				   //don't remove this "complete" function, this is overriding of global "complete".
				},
				success: function(response){

				   if(app.currentPageId == 'chat_page'){
						app.response = response;
						//console.log(JSON.stringify(app.response));
				        app.contactCurrentReadMessagesNumber = app.response.contactCurrentReadMessagesNumber;

						if(app.response.chat != false){
							var html = app.buildChat();
					        if(app.currentPageId == 'chat_page'){
							    app.container.html(html);
				            }
					     }
				         app.refreshChat();


						//refresh = setTimeout(app.refreshChat, 100);
				   }
				}
			});
		}
		else{
			//clearTimeout(refresh);
			refreshChat.abort();
		}

	},

	checkNewMessages: function(){

		if(app.currentPageId != 'login_page' && app.currentPageId != 'register_page' && app.currentPageId != 'forgot_password_page'){
			checkNewMessagesRequest = $.ajax({
				url: 'http://m.dating4disabled.com/api/v5/user/newMessagesCount',
				type: 'Get',
				complete: function(response, status, jqXHR){
					//don't remove this "complete" function, this is overriding of global "complete".
				},
				success: function(response){
					app.response = response;
					//alert(app.response.newMessagesCount);
					if(app.response.newMessagesCount > 0){
						app.newMessagesCount = app.response.newMessagesCount;
						if(app.currentPageId != 'login_page' && app.currentPageId != 'main_page' && app.currentPageId != 'register_page' && app.currentPageId != 'forgot_password_page'){
							$('.new_mes_count2').html(app.newMessagesCount);
							//$(".new_mes").show();
						}
						else{
							$(".new_mes").hide();
							if(app.currentPageId == 'main_page'){
								$('#new_mes_count').show().html(app.newMessagesCount);
							}
						}
					}
					else{
						app.newMessagesCount = 0;
						$('.new_mes').hide();
						$('#new_mes_count').hide();
					}
					newMessages = setTimeout(app.checkNewMessages, 10000);
				}
			});
		}

	},

	getSubscription: function(){
		app.showPage('subscription_page');
		$(".subscr_quest").unbind('click');
		$(".subscr_quest").click(function(){
			$(this).siblings(".subscr_text").slideToggle("slow");
			var span = $(this).find("span");
			if(span.text() == '+')
				span.text('-');
			else
				span.text('+');
		});

		$('input[type="radio"]').removeAttr("checked");

		$(".subscr").click(function(){
			$(".subscr_left").removeClass("subscr_sel");
			$(this).find("input").attr("checked","checked");
			$(this).find(".subscr_left").addClass("subscr_sel");



			setTimeout(function(){
				var product_id = $(".subscr_ch:checked").val();
				var nickName = '';
				//window.location.href = 'https://www.2checkout.com/2co/buyer/purchase?sid=1400004&quantity=1&product_id='+product_id+'&userid='+app.userId+'&usernick='+nickName;
				//alert(app.userId);
				userId = window.localStorage.getItem('userId');
				var ref = window.open('https://www.2checkout.com/2co/buyer/purchase?sid=1400004&quantity=1&product_id='+product_id+'&userid='+userId+'&usernick='+nickName, '_blank', 'location=yes');



			},100);



		});


	},

	confirmDeleteImage: function(imageId){
		app.imageId = imageId;
		navigator.notification.confirm(
				'Delete this image?',  // message
		        app.deleteImageChoice,              // callback to invoke with index of button pressed
		        'Confirmation',            // title
		        'Confirm,Cancel'          // buttonLabels
		 );
	},

	deleteImageChoice: function(buttonPressedIndex){
		if(buttonPressedIndex == 1){
			app.deleteImage();
		}
	},

	deleteImage: function(){
		app.requestUrl = 'http://m.dating4disabled.com/api/v5/user/images/delete/' + app.imageId,
		app.requestMethod = 'Post';
		app.getUserImages();
	},

	displayUserImages: function(){
		app.requestUrl = 'http://m.dating4disabled.com/api/v5/user/images';
		app.requestMethod = 'Get';
		app.getUserImages();
	},

	getUserImages: function(){
		$('.imagesButtonsWrap').hide();
		$.ajax({
			url: app.requestUrl,
			type: app.requestMethod,
			success: function(response){
				//alert(JSON.stringify(response));
				app.response = response;
				app.showPage('delete_images_page');
				app.container = app.currentPageWrapper.find('.imagesListWrap');
				app.container.html('');
				app.template = $('#editImageTemplate').html();
				window.scrollTo(0,0);

				if(app.response.images.itemsNumber < 4)
					$('.imagesButtonsWrap').show();

				for(var i in app.response.images.items){
					var currentTemplate = app.template;
					var image = app.response.images.items[i];
					currentTemplate = currentTemplate.replace("[IMAGE]", image.url);
					currentTemplate = currentTemplate.replace("[IMAGE_ID]", image.id);
					app.container.append(currentTemplate);
					var currentImageNode = app.container.find('.userImageWrap:last-child');

					if(image.isValid == 1)
						currentImageNode.find('.imageStatus').html("Approved").css({"color":"green"});
					else
						currentImageNode.find('.imageStatus').html("Not Approved Yet").css({"color":"red"});

				}

				app.container.trigger('create');
			}
		});
	},

	capturePhoto: function(sourceType, destinationType){
		// Take picture using device camera and retrieve image as base64-encoded string
		var options = {
			quality: 100,
			destinationType: app.destinationType.FILE_URI,
			sourceType: sourceType,
			encodingType: app.encodingType.JPEG,
			targetWidth: 600,
			targetHeight: 600,
			saveToPhotoAlbum: false,
			chunkedMode:true,
			correctOrientation: true
		};

		navigator.camera.getPicture(app.onPhotoDataSuccess, app.onPhotoDataFail, options);

	},

	onPhotoDataSuccess: function(imageURI) {
		/*
		$("#myNewPhoto").attr("src","data:image/jpeg;base64," + imageURI);
		$('#myNewPhoto').Jcrop({
			onChange: showPreview,
			onSelect: showPreview,
			aspectRatio: 1
		});
		*/
		app.uploadPhoto(imageURI);
	},

	onPhotoDataFail: function() {

	},

	uploadPhoto: function(imageURI){
		var user = window.localStorage.getItem("user");
		var pass = window.localStorage.getItem("pass");
		var options = new FileUploadOptions();
        options.fileKey="file";
        options.fileName=imageURI.substr(imageURI.lastIndexOf('/')+1);
        options.mimeType="image/jpeg";
        options.headers = {"Authorization": "Basic " + btoa ( user + ":" + pass)};

        var ft = new FileTransfer();
        ft.upload(
        	imageURI,
        	encodeURI("http://m.dating4disabled.com/api/v5/user/image"),
        	app.uploadSuccess,
        	app.uploadFailure,
	        options
	    );
	},

	uploadSuccess: function(r){
		//console.log("Code = " + r.responseCode);
        //console.log("Response = " + r.response);
        //console.log("Sent = " + r.bytesSent);
        //alert(r.response);
		//alert( JSON.stringify(r));
		app.response = JSON.parse(r.response);
		if(app.response.status.code == 0){
			navigator.notification.confirm(
				app.response.status.message + '. Click on "Manage Images" button to delete images',  // message
		        app.manageImagesChoice,              // callback to invoke with index of button pressed
		        'Notification',            // title
		        'Manage Images,Cancel'          // buttonLabels
		    );
		}else if(app.response.status.code == 1){
			app.alert(app.response.status.message);
		}

		if(app.currentPageId == 'delete_images_page'){
			app.displayUserImages();
		}

	},

	manageImagesChoice: function(buttonPressedIndex){
		if(buttonPressedIndex == 1){
			app.displayUserImages();
		}
	},

	uploadFailure: function(error){
		 alert("An error has occurred. Please try again.");
	},



	getEditProfile: function(){
			app.startLoading();

    		$.ajax({
    			url: 'http://m.dating4disabled.com/api/v5/user/data',
    			success: function(response){
    			   user = response.user;
    			   //alert(JSON.stringify(response));
    			   app.showPage('edit_profile_page');
    			   app.container = app.currentPageWrapper.find('.edit_wrap');
    			   app.container.html('');
    			   app.template = $('#userEditProfileTemplate').html();
    			   app.template = app.template.replace(/\[userNick\]/g,user.userNic);
    			   app.template = app.template.replace(/\[userPass\]/g,''); //user.userPass
    			   app.template = app.template.replace(/\[userEmail\]/g,user.userEmail);

    			   app.template = app.template.replace(/\[userCity\]/g,user.userCityName);

    			   if(user.userAboutMe == null)
    					user.userAboutMe='';

    			   if(user.userLookingFor == null)
    					user.userLookingFor='';

    			   app.template = app.template.replace(/\[userAboutMe\]/g,user.userAboutMe);
    			   app.template = app.template.replace(/\[userLookingFor\]/g,user.userLookingFor);
    			   //app.template = app.template.replace(/\[userfName\]/g,user.userfName);
    			   //app.template = app.template.replace(/\[userlName\]/g,user.userlName);
    			   app.template = app.template.replace(/\[Y\]/g,user.Y);
    			   app.template = app.template.replace(/\[n\]/g,user.n);
    			   app.template = app.template.replace(/\[j\]/g,user.j);


    			   app.container.html(app.template).trigger('create');
    			   app.getRegions();
    			   $('#userBirth').html(app.getBithDate()).trigger('create');



    			   //app.container.find('.userGender').html(app.getuserGender()).trigger('create');
    			},
    			error: function(err){
    			   alert(JSON.stringify(err));
    			}
    		});
    	},

    	saveProf: function (el,tag){
    		var name = '';
    		var val = '';
    		var input = $(el).parent().find(tag);
    		if(input.size()=='3'){
    			var er=false;
    			input.each(function(index){
    					   if(index!='0')val=val+'-';
    					   val=val+$(this).val();
    					   if($(this).val().length==0){
    					   alert('Birthday is incorrect');
    					   er=true;
    					   }
    					   });
    			if(er)return false;
    			name = 'userBirthday';
    		}else{
    			name = input.attr('name');
    			val = input.val();
    		}
    		//alert(name+'='+val);//return false;
    		if(name == 'userPass'){
    			if(val.length < 5){
    				alert('Password is to short');
    				return false;
    			}

    			if($('#editedUserPass2').val() !== val){
    				alert("Passwords don't match");
    				return false;
    			}

    		}
    		if((val.length < 3 && tag!='select') || (val.length==0 && tag=='select')){
    			alert($(el).parent().parent().prev().find('span').text()+'is to short');
    			return false;
    		}
    		var email_pattern = new RegExp(/^[+a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/i);
    		if (!(email_pattern.test(val))&&name=='userEmail') {
    			alert("E-mail is incorrect");
    			return false;
    		}

    		if($(el).parent().find('.userFailed').length > 0&&$(el).parent().find('.userFailed').is(":visible"))
    			return false;
    		app.startLoading();
    		//alert(name+'='+val);


    		console.log("Abort checkNewMessagesRequest");
            checkNewMessagesRequest.abort();
            clearTimeout(newMessages);



    		$.ajax({
    			   url:'http://m.dating4disabled.com/api/v5/user/data',
    			   //dataType: 'json',
    			   type: 'post',
    			   data: JSON.stringify({name:name,val:val}),
    			   contentType: "application/json; charset=utf-8",
    			   success : function(res){


    			   		checkNewMessagesRequest.abort();
                        clearTimeout(newMessages);


                        var user = app.container.find("#userNic").val();

                        //alert("USERNAME: " + user);
                        //alert("PASSWORD: " + pass);
                        window.localStorage.setItem("user",user);
                        if(name == 'userPass'){
                        	var pass = app.container.find("#editedUserPass").val();
                        	window.localStorage.setItem("pass",pass);
                        }




					   app.ajaxSetup();
					   app.checkNewMessages();

					   app.stopLoading();
					   //alert(JSON.stringify(res)); return false;

					   if(res.err == '1'){
					   //check(input.attr('id'),val);
					   alert(res.text);
					   $(el).parent().find('.input').css({'background':'red'});
					   }else if(res.res == '1'){
					   //alert(val);
					   alert('Successfully saved');
					   if(tag=='select'&&name!='userBirthday'){
					   val = $(el).parent().find('.ui-select span').eq(1).text();
					   //alert(val);
					   }
					   //if(val=='0'&&name=='userGender')val = 'אישה';
					   //if(val=='1'&&name=='userGender')val = 'גבר';

					   if(name=='userBirthday') val=val.replace(/-/g,' / ');
					   if(name=='userPass')
					   $(el).parent().next().find('input').val(val);
					   else
					   $(el).parent().next().find('div').text(val);
					   $('.save').hide();
					   $('.edit').show();
					   }
    			   },
    			   error: function(err){
					   app.stopLoading();
					   alert(JSON.stringify(err));
					   $('.save').hide();
					   $('.edit').show();
    			   }
    			   });
    	},

    	editProf: function (el){
    		var name = $(el).attr('name');
    		if(name=='edit'){
    			$('.save').hide();
    			$('.edit').show();
    			//alert($('.sf_sel_wrap .edit').size());
    			$(el).parent().hide().prev().show();
    		}else{
    			$(el).parent().hide().next('.edit').show();
    		}
    	},



	register: function(){
		window.scrollTo(0, 0);
		app.showPage('register_page');
		$('#birthDate').html(app.getBithDate()).trigger('create');
		//app.getRegions();
		$(".new_mes").hide();
		//app.getCities();
		//app.getSexPreference();
		app.getList('sexPreference');
		app.getCountries();
		app.getList('experience');
		app.getList('maritalStatus');
		app.getList('ethnicity');
		app.getChildren();
		app.getList('bodyType');
		app.getList('eyesColor');
		app.getList('hairColor');
		app.getList('hairLength');
		app.getList('smoking');
		app.getList('drinking');
		app.getList('occupation');
		app.getList('ethnicity');
		app.getList('income');
		app.getList('language', true);
		app.getList('education');
//		app.getList('economy');
		app.getList('religions');
		app.getList('lookingFor', true);
//		app.getList('interests', true);
		app.getList('health');
		app.getList('mobility');
		app.getHeight();
	},


	getList: function(entity, multiple){

		var entityContainer = [];
		entityContainer['sexPreference'] = '.sexPreferenceList';
		entityContainer['ethnicity'] = '.ethnicityList';
		entityContainer['maritalStatus'] = '.maritalStatusList';
		entityContainer['bodyType'] = '.bodyTypeList';
		entityContainer['eyesColor'] = '.eyesColorList';
		entityContainer['hairColor'] = '.hairColorList';
		entityContainer['hairLength'] = '.hairLengthList';
		entityContainer['smoking'] = '.smokingList';
		entityContainer['drinking'] = '.drinkingList';
		entityContainer['occupation'] = '.occupationList';
		entityContainer['income'] = '.incomeList';
		entityContainer['language'] = '.languageList';
		entityContainer['education'] = '.educationList';
		//entityContainer['economy'] = '.economyList';
		entityContainer['religions'] = '.religionsList';
		entityContainer['lookingFor'] = '.lookingForList';//
//		entityContainer['interests'] = '.interestsList';
		entityContainer['health'] = '.healthList';
		entityContainer['mobility'] = '.mobilityList';

		//console.log(entity);


		$.ajax({
			url: 'http://m.dating4disabled.com/api/v5/list/' + entity,
			success: function(list, status, xhr){
			   //console.log(JSON.stringify(list));
			   var html = '';
			   if(multiple){
			       html = '<fieldset data-role="controlgroup" data-type="horizontal" data-mini="true"><div class="ui-controlgroup-controls" style="width: 300px;">';
			       for(var i in list.items){
					   var item = list.items[i];
			           console.log(item[entity + 'Id'] + ' | ' + item[entity + 'Name']);
			   //console.log(list['languageId'] + ' | ' + list['languageName']);


			   html = html + '<input name="' + entity + 'Id" type="checkbox" id="check-'+ entity +'-' + item[entity + 'Id']  + '" value="' + item[entity + 'Id']  + '"><label for="check-'+ entity +'-' + item[entity + 'Id']  + '">' + item[entity + 'Name'] + '</label>';
				   }
			       html = html + '</div></fieldset><br />';
			   }
			   else{
			       html = '<select name="' + entity + 'Id" id="' + entity + 'Id"><option value="">Choose</option>';
			       for(var i in list.items){
			           var item = list.items[i];
			           html = html + '<option value="' + item[0]  + '">' + item[1] + '</option>';
			       }
			       html = html + '</select>';
			   }

			   //console.log(html);
			   //console.log('--------------------------------------------------');

			   app.container.find(entityContainer[entity]).html(html).trigger("create");
			   //console.log(entity + 'Id');
			   if(multiple){
			       app.container.find(entityContainer[entity]).find('.ui-btn').css({"border-radius":"inherit", "margin":"3px 3px"});
			       //console.log(app.container.find(entityContainer[entity]).html());
			   }
			}
		});
	},



	getHeight: function(){
		var html = '';
		html = html + '<select name="userHeight" id="userHeight"><option value="">Choose</option>';
		for (var i = 100; i <= 250; i++) {
			html = html + '<option value="' + i + '">' + i + '</option>';
		}
		html = html + '</select>';

		app.container.find('.heightList').html(html).trigger("create");
	},

	getChildren: function(){
		var html = '';
		html = html + '<select name="userChildren" id="userChildren"><option value="">Choose</option>';
		for (var i = 0; i <= 10; i++) {
			var text = (i == 0) ? 'None' : i;
			html = html + '<option value="' + i + '">' + text + '</option>';
		}
		html = html + '</select>';

		app.container.find('.childrenList').html(html).trigger("create");
	},


	getBithDate: function(){
		var html;
		html = '<div class="left">';
			html = html + '<select name="userBirthday_d" id="d">';
				html = html + '<option value="">D</option>';
				for (var i = 1; i <= 31; i++) {
					html = html + '<option value="' + i + '">' + i + '</option>';
				}
			html = html + '</select>';
		html = html + '</div>';

		html = html + '<div class="left">';
			html = html + '<select name="userBirthday_m" id="m">';
				html = html + '<option value="">M</option>';
				for (var i = 1; i <= 12; i++) {
					html = html + '<option value="' + i + '">' + i + '</option>';
				}
			html = html + '</select>';
		html = html + '</div>';

		var curYear = new Date().getFullYear();

		html = html + '<div class="left">';
			html = html + '<select name="userBirthday_y" id="y">';
				html = html + '<option value="">Y</option>';
				for (var i = curYear - 18; i >=1940 ; i--) {
					html = html + '<option value="' + i + '">' + i + '</option>';
				}
			html = html + '</select>';
		html = html + '</div>';

		return html;
	},

	resetPassword: function(){

		var email_pattern = new RegExp(/^[+a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/i);

		userEmail = app.container.find('#userEmail').val();

       	if (!(email_pattern.test(userEmail))){
       		app.alert("Invalid e-mail");
      		return false;
		}



		$.ajax({
        	url: 'http://m.dating4disabled.com/api/v5/user/passwordRecovery',
        	type: 'Post',
        	error: function(error){
        		alert(JSON.stringify(error));
        	},
        	contentType: "application/json; charset=utf-8",
            data: JSON.stringify({
            	userEmail: userEmail
            }),
        	success: function(response){
        		//alert(JSON.stringify(response));
        		app.response = response;
        		if(app.response.success){
        			app.alert("Your password was reset. Please check your e-mail");
        			app.showPage('login_page');
        		}
        		else{
        			app.alert("There is no user with the e-mail you entered.");
        		}
        	}
        });
	},
	

	
	
	dump: function(obj) {
	    var out = '';
	    for (var i in obj) {
	        out += i + ": " + obj[i] + "\n";
	    }
	    alert(out);
	}	
	
		
};


document.addEventListener("deviceready", app.init, false);

window.addEventListener('load', function() {
	new FastClick(document.body);
}, false);

function showPreview(coords)
{
	var rx = 100 / coords.w;
	var ry = 100 / coords.h;

	$('#preview').css({
		width: Math.round(rx * 500) + 'px',
		height: Math.round(ry * 370) + 'px',
		marginLeft: '-' + Math.round(rx * coords.x) + 'px',
		marginTop: '-' + Math.round(ry * coords.y) + 'px'
	});
}


$.fn.serializeObject = function()
{
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};

