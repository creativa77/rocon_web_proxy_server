/**
  * @fileOverview Web version of rocon remocon
  * @author Janghee Cho [roycho111@naver.com]
  * @copyright Yujin Robot 2014.
*/

var ros = new ROSLIB.Ros();
var gListConcerts = [];
var gFinalUrl;
var gFinalHash;

var gUrl;
var gCookieCount;

var defaultUrl;


//Remocon profile
var gPublishers = {}
var gRunningInteractions = [];
var gRoconVersion = 'acdc'; //todo make rocon/version.js fot obtaining
var gRemoconUUID = uuid().replace(/-/g,'');
var gRemoconName = 'web_remocon_' + gRemoconUUID;
var gRemoconRoconURI = 'rocon:/*/' + gRemoconName + '/*/' + getBrowser();
var gRemoconPlatformInfo = {
    'uri' : gRemoconRoconURI,
    'version' : gRoconVersion,
    'icon': {'resource_name': '',
              'format': '',
              'data': []
             }
};

var proxy_name;

// Starts here
$(document).ready(function () {
  init();
  listItemSelect();
  userLogin();
  getBrowser();

  var host = document.location.host;
  defaultUrl = "ws://" + host + "/ws"
  gUrl = defaultUrl;
  ros.connect(defaultUrl);
});


/**
  * Initialize ros publishers for sending data
  *
  * @function initPublisher
*/

function initPublisher(){
  gPublishers['remocon_status'] = new ROSLIB.Topic({
        ros : ros,
        name : "remocons/" + gRemoconName,
        messageType : 'rocon_interaction_msgs/RemoconStatus',
        latch :true
    });
}


/**
  * Initialize lists, set ROS callbacks, read cookies.
  *
  * @function init
*/
function init() {
  $("#userlogin").hide();
  $("#continue").hide();
  setROSCallbacks();
  initList();
}

/**
  * Receive and set ROS callbacks
  *
  * @function setROSCallbacks
*/
function setROSCallbacks() {
  ros.on('error', function(error) {
    // throw exception for error
    console.log('Connection refused. Is the master running?');
    alert('Connection refused. Is the master running?');

    $("#userlogin").show();
    $("#loginBtn").show();
    initList();
  });

  ros.on('connection', function() {
    console.log('Connection made!');
    initList();
    getConcerts();
  });

  ros.on('close', function() {
    console.log('Connection closed.');
    initList();
  });
}


/**
  * Call Service for displaying available concerts
  *
  * @function getConcerts
*/
function getConcerts() {
  var uri = "http://" + document.location.host + "/proxy_list";
  $.ajax({
      url: uri
    }).then(function(obj){
      data = JSON.parse(obj)
      for (var i = 0; i < data.concerts.length; i++) {
         console.log('adding concert')
         gListConcerts.push(data.concerts[i]);
      }
      displayConcerts();
    });
}

/**
  * Display the concerts list to the screen
  *
  * @function displayConcerts
*/
function displayConcerts() {
  for (var i = 0; i < gListConcerts.length; i++) {
    $("#concert_listgroup").append('<a href="#" id="concertlist_' + i + '" class="list-group-item"><strong>' + gListConcerts[i].name + '</strong></a>');
  }
}


/**
  * Event function when item in role list and interaction list is clicked
  *
  * @function listItemSelect
*/
function listItemSelect() {
  // role list
  $("#concert_listgroup").on("click", "a", function (e) {
    e.preventDefault();

    var listCount = $("#concert_listgroup").children().length;
    for (var i = 0; i < listCount; i++) {
      $("#concert_listgroup").children(i).attr('class', 'list-group-item');
    }
    $(this).toggleClass('list-group-item list-group-item active');

    var index = $(this).attr('id').charAt($(this).attr('id').length - 1);
    
    proxy_name = gListConcerts[index].name;
    if (gListConcerts[index].enable_authentication == true) {
      $("#userlogin").show();
      $("#continue").hide();
    } else {
      $("#userlogin").hide();
      $("#continue").show();
    }
  });

}

function userLogin() {
  $("#loginBtn").click(function () {
    login();
   });

  $("#continueBtn").click(function (){
    continueToRemocon();
   });
  }

function login() {
  var user_name = $("#user").val();
  var user_pass = $("#pass").val();

  ros.once('login',function(message){
      afterLogin(message);
  });
  ros.callOnConnection({
    op: 'auth',
    user: user_name,
    pass: user_pass,
    proxy_name: proxy_name,
    });
}

function afterLogin(message) {
  if (message.login_result == true){
    console.log('Login!! Redirect to index');
    user = $("#user").val();
    var url = "./index.html?username=" + user;
    window.location.replace(url);
  }else{
    alert("Wrong user or password.")
    console.log("Wrong user or password.");
  }
}

function continueToRemocon(){
  window.location.replace("./index.html");
}

/**
  * Initialize all lists
  *
  * @function initList
*/
function initList() {
    initConcertList();
}

/**
  * Initialize role list
  *
  * @function initRoleList
*/
function initConcertList() {
    gListConcerts = [];
    $("#concert_listgroup").children().remove();
}



/**
  * Wrapper function for Service.callService
  *
  * @function callService
  *
  * @param {ROSLIB.Ros} ros - handled ros
  * @param {string} serviceName - service's name
  * @param {string} serviceType - service's type
  * @param {ROSLIB.ServiceRequest} request - request
  * @param {callBack} callback for request response
*/
function callService(ros, serviceName, serviceType, request, callBack) {
  var service = new ROSLIB.Service({
    ros : ros,
    name : serviceName,
    serviceType : serviceType
  });

  // get response
  try {
    service.callService(request, function(result){
    callBack(result);
    }, 
    function(error) {
      alert(error);
      console.log(error);
    });
  } catch (e) {
      console.log(message);
      alert(e.message);
  } 
}

/**
  * Get browser name
  *
  * @function getBrowser
  *
  * @returns {string} current browser's name
*/
function getBrowser() {
  var agt = navigator.userAgent.toLowerCase();
  if (agt.indexOf("chrome") != -1) return 'chrome';
  if (agt.indexOf("crios") != -1) return 'chrome'; // for ios
  if (agt.indexOf("opera") != -1) return 'opera';
  if (agt.indexOf("firefox") != -1) return 'firefox';
  if (agt.indexOf("safari") != -1) return 'safari';
  if (agt.indexOf("msie") != -1) return 'internet_explorer';
  
}

