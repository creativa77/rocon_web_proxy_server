/*
   Dongwook Lee

   Waypoint Visualizor
 */

REGIONVIZ.Waypoint = function(options) {
  var that = this;

  options = options || {};
  that.rootObject = options.rootObject;
  that.ros = options.ros;
  var map_origin = options.map_origin;
  that.color = options.color || createjs.Graphics.getRGB(0,255,0,0.8);
  that.topicName = options.topicName || 'waypoint_list';
  that.topicType = options.topicType || 'yocs_msgs/WaypointList'; 
  that.waypoints = {};
  that.waypoint_viz = {}
  that.texts = {};

  var stage;
  if (that.rootObject instanceof createjs.Stage) {
    stage = that.rootObject;
  } else {
    stage = that.rootObject.getStage();
  }

  that.sub_waypoint = new ROSLIB.Topic({
    ros: that.ros,
    name : that.topicName, 
    messageType : that.topicType,
  });

  that.sub_waypoint.subscribe(function(msg) {
    // removing markers that are gone.
    for(w in that.waypoints) {
      var wp = that.waypoints[w];
      var flag = false;

      for(ww in msg.waypoints){
        if(msg.waypoints[ww].name == wp.name)  
          flag = true;  
      }

      if(!flag)
      {
        that.rootObject.removeChild(that.waypoint_viz[wp.name]);
        that.rootObject.removeChild(that.texts[wp.name]);
        delete that.waypoint_viz[wp.name];
        delete that.texts[wp.name];
      }
    }

    // adding new markers
    for(w in msg.waypoints)
    {
      var wp = msg.waypoints[w];
      var x = wp.pose.position.x - map_origin.position.x;
      var y = -(wp.pose.position.y - map_origin.position.y);
      var o = wp.pose.orientation;

      if(!(wp.name in that.waypoints)) {
        var waypoint = createWaypoint(x,y,o);
        var text = createText(x,y,wp.name);
        that.waypoint_viz[wp.name] = waypoint;
        that.texts[wp.name] = text;
        that.rootObject.addChild(waypoint);
        that.rootObject.addChild(text);
      }
      else {
        that.waypoint_viz[wp.name].x = x;
        that.waypoint_viz[wp.name].y = y;
        that.waypoint_viz[wp.name].rotation = getRotation(o);
        that.texts[wp.name].x = x;
        that.texts[wp.name].y = y;
      }
    }
    that.waypoints = msg.waypoints;
  });

  var createWaypoint = function(x,y,orientation) {
    var m = new ROS2D.NavigationArrow({
      size : 20,
      strokeSize : 1,
      fillColor : that.color,
      pulse : false
    });

    m.x = x;
    m.y = y;

    m.rotation = getRotation(orientation); 
    m.scaleX = 1.0 / stage.scaleX;
    m.scaleY = 1.0 / stage.scaleY;

    return m;
  }

  var createText = function(x,y,text)                                 
  {
    var text_object = new createjs.Text(text,"20px Arial","#000000");
    text_object.x = x;
    text_object.y = y;
    text_object.scaleX = 1 / stage.scaleX;
    text_object.scaleY = 1 / stage.scaleY;
    text_object.textBaseline = "center";
    return text_object;
  }

  var getRotation = function(orientation) {
    var quaternion = new ROSLIB.Quaternion(orientation);    
    var yaw = stage.rosQuaternionToGlobalTheta(quaternion); //return degree
    return yaw;
  }
};


REGIONVIZ.Waypoint.prototype.__proto__ = EventEmitter2.prototype;
