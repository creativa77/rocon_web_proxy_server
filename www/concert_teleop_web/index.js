l/*
  Concert Teleop
  
  Dependency
    <!-- jQuery -->
    /rocon_web_common/js/thirdparty/jquery/jquery.js
    <!-- Bootstrap -->
    /rocon_web_common/js/thirdparty/bootstrap/bootstrap.j/rocon_web_common/js/thirdparty/bootstrap/bootstrap-button.js
    <!-- ROS -->
    /rocon_web_common/js/thirdparty/eventemitter2/eventemitter2.js
    /rocon_web_common/js/ros/robotwebtools/roslib.js
    <!-- UTILS -->
    /rocon_web_common/js/thirdparty/uuid.js
    <!-- ROCON -->
    /rocon_web_common/js/rocon/interactions.js
    /rocon_web_common/js/rocon/service_pair_client.js
    <!-- Modal -->
    /rocon_web_common/js/ui/modal.js
    <!-- Video Steamer-->
    /rocon_web_common/js/wpi_rails/mjpegcanvas.js
    /rocon_web_common/js/interface/video_streamer_interface.js
    /rocon_web_common/js/ui/video_streamer_ui.js
    <!-- Controller -->
    /rocon_web_common/js/interface/controller_interface.js
    /rocon_web_common/js/ui/controller_ui.js
    <!-- ResourceChooser -->
    /rocon_web_common/js/interface/resource_chooser_interface.js
    /rocon_web_common/js/ui/resource_chooser_ui.js
*/

var ros = new ROSLIB.Ros();

//var defaultUrL = rocon_interactions.rosbridge_uri;
var defaultUrl = rocon_interactions.rosbridge_uri;
var videoSteamerHost = rocon_interactions.parameters['video_steamer_host'];
var videoSteamerPort = rocon_interactions.parameters['video_steamer_port'];

var captureTimeoutName = 'capture_timeout';
var captureTimeout = 45.0;

if (rocon_interactions.parameters.hasOwnProperty(captureTimeoutName)){
  captureTimeout = rocon_interactions.parameters[captureTimeoutName];
}

//var videoSteamTopicName = "/camera/rgb/image_color";
var videoSteamTopicName = "image";
var videoSteamTopicType = "sensor_msgs/Image";

var controllerTopicName = 'cmd_vel';
var controllerTopicType = 'geometry_msgs/Twist';

var availableResourceTopicName = 'available_teleops';
var availableResourceTopicType = 'rocon_std_msgs/StringArray';

var captureResourcePairName = 'capture_teleop';
var captureResourcePairType = 'concert_service_msgs/CaptureResourcePair';

if (rocon_interactions.remappings.hasOwnProperty(videoSteamTopicName)){
  videoSteamTopicName = rocon_interactions.remappings[videoSteamTopicName];
}
if (rocon_interactions.remappings.hasOwnProperty(controllerTopicName)){
  controllerTopicName = rocon_interactions.remappings[controllerTopicName];
}
if (rocon_interactions.remappings.hasOwnProperty(availableResourceTopicName)){
  availableResourceTopicName = rocon_interactions.remappings[availableResourceTopicName];
}
if (rocon_interactions.remappings.hasOwnProperty(captureResourcePairName)){
  captureResourcePairName = rocon_interactions.remappings[captureResourcePairName];
}

var vsInterface;
var vsUI;
var cInterface;
var cUI;
var rcInterface;
var rcUI;

$().ready(function(e) {
  initHeader();  
});

window.onbeforeunload = function(e){
  if (rcInterface !== undefined){
    rcInterface.releaseAllResource();
  }
  return null;
}

function initHeader()
{  
  settingROSCallbacks();
  ros.connect(defaultUrl);
  $('#focusedInput').val(''+ defaultUrl);
}

function initUI(){
  loadVideoStreamer();
  loadController();
  loadResourceChooser();

  if(cInterface !== undefined && rcInterface !== undefined){
    rcInterface.regCaptureResourceCallbacks([cInterface.setcmdVelTopic]);
    rcInterface.regReleaseResourceCallbacks([cInterface.unpublishTopic]);
  }
  if(vsInterface !== undefined && rcInterface !== undefined){
    rcInterface.regCaptureResourceCallbacks([vsInterface.changeVideoStreamTopic]);
  }
}

function loadVideoStreamer() {
  vsInterface = new VideoStreamerInterface({
    ros: ros,
    imageStreamTopicName: videoSteamTopicName,
    imageStreamTopicType: videoSteamTopicType
  });
  vsUI = new VideoStreamerUI({
    divID : 'video_streamer',
    width : 640,
    height: 480,
    host : videoSteamerHost,
    port  : videoSteamerPort,
    videoStreamerInterface : vsInterface,
  });
  vsUI.initVideoCanvas();
}

function loadController(){
  cInterface = new ControllerInterface({
    ros: ros,
    cmdVelTopicName: controllerTopicName,
    cmdVelTopicType: controllerTopicType
  });
  cUI = new ControllerUI({
    divID : 'contoller',
    controllerInterface : cInterface,
  });
  cUI.initContolloer();
}

function loadResourceChooser(){
  rcInterface = new ResourceChooserInterface({
    ros: ros,
    availableResourceTopicName: availableResourceTopicName,
    availableResourceTopicType: availableResourceTopicType,
    captureResourcePairName: captureResourcePairName,
    captureResourcePairType: captureResourcePairType,
    captureTimeout: captureTimeout,
  });

  rdUI = new ResourceChooserUI({
    divID : 'resource_chooser',
    resourceChooserInterface : rcInterface,
  });
  rdUI.initResourceChooser();

}

function settingROSCallbacks()
{
  ros.on('connection',function() {
    console.log("Connected");
    // subscribe to order list                                                       
    $('#focusedInput').val('Connected');
    $('#focusedInput').attr('disabled',true);
    //loadVideoStreamer();
    //loadController();
    initUI();
    }
  );
  ros.on('error',function(e) {
    console.log("Error!",e);
  }
  );                                               
  ros.on('close',function() {
    console.log("Connection Close!");
    $('#focusedInput').val('Disconnected');
  }
  );
}
