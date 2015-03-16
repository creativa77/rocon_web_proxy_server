/*
  Service pair Client

  Dependency
  - rocon_web_common/www/js/thirdparty/uuid.js
*/

NonBlockingRequestHandler = function(options){
    var that = this;
    options = options || {};
    that.key = options.key  //# uuid hexstring key (the request_handlers key)
    that.timer = options.timer
    that.callback = options.callback
    that.errorCallback = options.errorCallback
    var response;
}

ServicePairClient = function(options){
  var that = this;
  options = options || {};
  that.ros = options.ros;
  that.name = options.name || '';
  that.ServicePairSpec = options.ServicePairSpec;

  var requestHandlers = {}

  that.subscriber = new ROSLIB.Topic({
    ros: that.ros,
    name : that.name + '/response',
    messageType : that.ServicePairSpec + 'Response',
  });

  that.subscriber.subscribe(function(msg) {
    var key = uuid.unparse(uniqueId(atob(msg.id.uuid)));
    if(requestHandlers.hasOwnProperty(key)){
        var reqHandler = requestHandlers[key];
        delete requestHandlers[key];
        clearTimeout(reqHandler.timer);
        reqHandler.callback(key, msg);
    }
  });

  that.publisher = new ROSLIB.Topic({
    ros: that.ros,
    name : that.name + '/request',
    messageType : that.ServicePairSpec + 'Request',
  });
  
  var timeoutCallback = function(key){
    console.log('servicePairClient timer callback: ', key);
    if(requestHandlers.hasOwnProperty(key)){
        var reqHandler = requestHandlers[key];
        delete requestHandlers[key];
        clearTimeout(reqHandler.timer);
        reqHandler.errorCallback(key, 'timeout');
    }
  }

  var uniqueId = function(val){
    var id = []
    for(k in val){
        id.push(val.charCodeAt(k));
    }
    return id;
  }

  that.request = function(msg, timeout, callback, errorCallback){
    that.callback = callback;
    that.errorCallback = errorCallback;
    var key = uuid();
    var pair_request_msg = {
      request : msg,
      id : {'uuid': uuid.parse(key)},
    };

    var timeout_mil = timeout * 1000; // timeout is in sec. Change it to mili second.
    console.log(timeout_mil);
    requestHandlers[key] = new NonBlockingRequestHandler({
      key : key,
      timer : (function(id){return setTimeout(function(){timeoutCallback(id)},timeout_mil); })(key),
      callback : callback,
      errorCallback : errorCallback,
    })
    that.publisher.publish(pair_request_msg);
    return key;
  }
}

ServicePairClient.prototype.__proto__ = EventEmitter2.prototype;
