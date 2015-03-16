/*
  Modal
  
  Dependency
  - rocon_web_common/www/js/thirdparty/bootstrap/bootstrap.js
  - rocon_web_common/www/js/thirdparty/bootstrap/bootstrap-button.js
*/
Modal = function(options){
  var that = this;
  options = options || {};
  that.divId = options.divId || 'modal';

  //init modal
  var modal_content = '<div class="modal fade %(divId)"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button><h2 class="modal-title %(divId)-title"></h2></div><div class="modal-body"><h4 class="%(divId)-body"></h4></div><div class="modal-footer"><button type="button" class="btn btn-default" data-dismiss="modal">Close</button></div></div></div></div>'
  that.initModal = function(){
    $('body').append(modal_content.replace(/\%\(divId\)/g,that.divId));
  }
  
  that.show = function(title, body){
    $('.' + that.divId +'-title').html(title);
    $('.' + that.divId +'-body').html(body);
    $('.' + that.divId).modal('show');
  }
  that.hide = function(){
    $('.' + that.divId).modal('hide');
  }
}