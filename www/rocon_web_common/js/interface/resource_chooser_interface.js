/*
  Resource Chooser Interface
  
  Dependency
  - rocon_web_common/www/js/ros/robotwebtools/roslib.js
*/

ResourceChooserInterface = function(options){
  var that = this;
  options = options || {};
  that.ros = options.ros;
  that.captureTimeout = options.captureTimeout || 15.0;
  that.availableResourceTopicName = options.availableResourceTopicName || 'available_resource';
  that.availableResourceTopicType = options.availableResourceTopicType || 'rocon_std_msgs/StringArray';
  that.captureResourcePairName = options.captureResourcePairName || 'capture_resource';
  that.captureResourcePairType = options.captureResourcePairType || 'concert_service_msgs/CaptureResourcePair';
  that.refreshListCallbacks = options.refreshListCallbacks || [];

  var pairCaptureResource;
  var resourceList = [];
  var servicePairMsgQ = [];
  var capturedResource = '';
  var pairCaptureResource = new ServicePairClient({
    ros: that.ros,
    name: that.captureResourcePairName,
    ServicePairSpec: captureResourcePairType
  });

  var subAvailableTeleop = new ROSLIB.Topic({
    ros: that.ros,
    name : that.availableResourceTopicName,
    messageType : that.availableResourceTopicType,
  });

  subAvailableTeleop.subscribe(function(msg){
    var newResource = diff(msg.strings, resourceList);
    var goneResource = diff(resourceList, msg.strings);
    if(newResource.length !== 0 || goneResource.length !== 0){
        resourceList = msg.strings;
        for(var i = 0; i < that.refreshListCallbacks.length; i ++ ){
          that.refreshListCallbacks[i](resourceList);
        }
    }
  });
  
  var diff = function(src, target){
    var diffs = [];
    for (s in src){
      if(!(s in target)){
        diffs.push(s);
      }
    }
    return diffs;
  }

  that.captureResource = function(roconUri){
    var msg = {
        rocon_uri: roconUri,
        release: false
    };
    var srvPairMsg = {}
    var msgId = pairCaptureResource.request(msg, that.captureTimeout, resourceCapturedCallback, resourceErrorCallback)
    srvPairMsg[msgId] = roconUri
    servicePairMsgQ.push(srvPairMsg);
  }

  that.releaseResource = function(roconUri){
    var msg = {
        rocon_uri: roconUri,
        release: true
    };

    var srvPairMsg = {}
    var msgId = pairCaptureResource.request(msg, that.captureTimeout, resourceReleasedCallback, resourceErrorCallback)
    srvPairMsg[msgId] = roconUri
    servicePairMsgQ.push(srvPairMsg);
  }
  
  that.releaseAllResource = function(){
    var keys = Object.keys(capturedResource);
    for(k in keys){
      var msg = {
        rocon_uri: capturedResource[keys[k]],
        release: true
      };
      pairCaptureResource.request(msg, that.captureTimeout, resourceReleasedCallback, resourceErrorCallback);
    }
  };
  
  var resourceCapturedCallback = function(msgId, msg){
    
    servicePairMsgQ.forEach(function(srvPairMsg){
      var keys = Object.keys(srvPairMsg);
      for( key in keys){
        if (keys[key] === msgId){
          capturedResource = servicePairMsgQ.pop(servicePairMsgQ.indexOf(srvPairMsg));
        }
        break;
      }
    });

    if(that.captureResourceCallbacks !== undefined){
      for(var i = 0; i < that.captureResourceCallbacks.length; i ++ ){
          that.captureResourceCallbacks[i](msg);
      }  
    }
  }

  var resourceReleasedCallback = function(msgId, msg){

    servicePairMsgQ.forEach(function(srvPairMsg){
      var keys = Object.keys(srvPairMsg);
      for( key in keys){
        if (keys[key] === msgId){
          servicePairMsgQ.pop(servicePairMsgQ.indexOf(srvPairMsg));
          capturedResource = '';
        }
        break;
      }
    });
    
    if (that.releaseResourceCallbacks !== undefined){
      for(var i = 0; i < that.releaseResourceCallbacks.length; i++ ){
          that.releaseResourceCallbacks[i](msg);
      }  
    }
  }

  var resourceErrorCallback = function(msgId, msg){
    
    servicePairMsgQ.forEach(function(srvPairMsg){
      var keys = Object.keys(srvPairMsg);
      for( key in keys){
        if (keys[key] === msgId){
          servicePairMsgQ.pop(servicePairMsgQ.indexOf(srvPairMsg));
          capturedResource = '';
        }
        break;
      }
    });
    
    if(that.resourceErrorCallbacks !== undefined){
      for(var i = 0; i < that.resourceErrorCallbacks.length; i++ ){
          that.resourceErrorCallbacks[i](msg);
      }  
    }
  }

  that.regRefreshListCallbacks = function(callbacks){
    if (that.refreshListCallbacks === undefined){
      that.refreshListCallbacks = [];
    }
    callbacks.forEach(function(callback){that.refreshListCallbacks.push(callback)});
    that.refreshListCallbacks = callbacks;
  }

  that.regResourceErrorCallbacks = function(callbacks){
    if (that.resourceErrorCallbacks === undefined){
      that.resourceErrorCallbacks = [];
    }
    callbacks.forEach(function(callback){that.resourceErrorCallbacks.push(callback)});
  }
  
  that.regCaptureResourceCallbacks = function(callbacks){
    if (that.captureResourceCallbacks === undefined){
      that.captureResourceCallbacks = [];
    }
    callbacks.forEach(function(callback){that.captureResourceCallbacks.push(callback)});
  }

  that.regReleaseResourceCallbacks = function(callbacks){
    if (that.releaseResourceCallbacks === undefined){
      that.releaseResourceCallbacks = [];
    }
    callbacks.forEach(function(callback){that.releaseResourceCallbacks.push(callback)});
  }
};

ResourceChooserInterface.prototype.__proto__ = EventEmitter2.prototype;
