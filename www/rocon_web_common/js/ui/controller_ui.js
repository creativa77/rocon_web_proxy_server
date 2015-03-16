/*
  Controller UI

  Dependency
  - rocon_web_common/www/js/interface/controller_intergace.js
*/
ControllerUI = function(options){
  var that = this;
  options = options || {};
  that.controllerInterface = options.controllerInterface || new ControllerInterface();

  //init ui
  //mapping ui item with interface function
  that.initContolloer = function(){
  }
}

ControllerUI.prototype.__proto__ = EventEmitter2.prototype;