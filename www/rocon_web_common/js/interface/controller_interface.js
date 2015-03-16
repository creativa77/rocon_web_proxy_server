/*
  Controller Interface
  
  Dependency
  - rocon_web_common/www/js/ros/robotwebtools/roslib.js
*/

ControllerInterface = function(options){
  var that = this;
  options = options || {};
  that.ros = options.ros;
  that.maxLinearVelocity = options.maxLinearVelocity || 2.0;
  that.maxAngularVelocity = (options.maxAngularVelocity || 90) * Math.PI / 180;
  that.remapingRules = options.remapingRules || {};
  that.cmdVelTopicName = options.cmdVelTopicName || 'cmd_vel';
  that.cmdVelTopicType = options.cmdVelTopicType || 'geometry_msgs/Twist';
  
  var pubCmdVel = new ROSLIB.Topic({
    ros: that.ros,
    name : that.cmdVelTopicName,
    messageType : that.cmdVelTopicType,
  });

  that.unpublishTopic = function(){
    if(pubCmdVel !== undefined){
      pubCmdVel.unadvertise();
      pubCmdVel = undefined;
    }
  }

  that.setcmdVelTopic = function(msg){
    that.unpublishTopic();
    var remappings = msg.response.remappings;
    var cmdvelTopicName = that.cmdVelTopicName;
    if(remappings.length !== 0){
      remappings.forEach(function(item){
        if (item['remap_from'] == that.cmdVelTopicName){
            cmdvelTopicName = item['remap_to']
        }
      });
    }
    pubCmdVel = new ROSLIB.Topic({
      ros: that.ros,
      name : cmdvelTopicName,
      messageType : that.cmdVelTopicType,
    });
  }

  that.forward = function(){   
    publishCmdVel(that.maxLinearVelocity, 0);
  }
  that.backward = function(){
    publishCmdVel(-that.maxLinearVelocity, 0);
  }
  that.turnRight = function(){
    publishCmdVel(0, -that.maxAngularVelocity);
  }
  that.turnLeft = function(){
    publishCmdVel(0, that.maxAngularVelocity);
  }
  that.stop = function(){
    publishCmdVel(0, 0);
  }
  that.cmdVel = function(linear, angular){
    publishCmdVel(linear, angular);
  }

  var publishCmdVel = function(linear, angular){
    var cmdVel = new ROSLIB.Message({
      linear : {
        x : linear,
        y : 0,
        z : 0
      },
      angular : {
        x : 0,
        y : 0,
        z : angular
      }});
    pubCmdVel.publish(cmdVel);
  }

  var handleKey = function(keyCode, keyDown){
    // used to check for changes in speed
    // check which key was pressed
    if(keyDown === true){
      switch (keyCode) {
        case 65: // turn left
          that.turnLeft();
          break;
        case 87: // up
          that.forward();
          break;
        case 68: // turn right
          that.turnRight();
          break;
        case 83: // down
          that.backward();
          break;
        default:
          break;
      }
    }
    else{
      that.stop();
    }
  };

  // handle the key
  var body = document.getElementsByTagName('body')[0];
  body.addEventListener('keydown', function(e) {
    handleKey(e.keyCode, true);
  }, false);
  body.addEventListener('keyup', function(e) {
    handleKey(e.keyCode, false);
  }, false);
};

ControllerInterface.prototype.__proto__ = EventEmitter2.prototype;