/*
  Video Streamer UI

  Dependency
  - rocon_web_common/www/js/interface/video_streamer_interface.js
  - rocon_web_common/www/js/wpi_rails/mjpegcanvas.js
*/
VideoStreamerUI = function(options){
  var that = this;
  options = options || {};
  that.divID = options.divID;
  that.host = options.host || 'localhost';
  that.port  = options.port || 8080;
  that.width = options.width || $('#' + that.divID).width();
  that.height = options.height || $('#' + that.divID).height();
  that.videoStreamerInterface = options.videoStreamerInterface || new VideoStreamerInterface();
  
  that.initVideoCanvas = function(){
    //Register change stream callback
    that.videoStreamerInterface.regChangeStreamCallback(reloadVideoCanvas);
    // Create the main viewer.
    // 1. event handling about disconnection with web video server
    // 2. apply with, height 
    that.viewer = new MJPEGCANVAS.Viewer({
      divID : that.divID,
      host : that.host,
      port : that.port,
      width : that.width, 
      height : that.height, 
      topic : that.videoStreamerInterface.imageStreamTopicName,
      interval : 200
    });
  }

  var reloadVideoCanvas = function(topic){
    if(that.viewer !== undefined){
      that.viewer.changeStream(topic);
    }
    else{
      that.initVideoCanvas();
    }
  }
}

VideoStreamerUI.prototype.__proto__ = EventEmitter2.prototype;