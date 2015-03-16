/*
  Resource Chooser UI

  Dependency
  - rocon_web_common/www/js/interface/resource_chooser_interface.js
  - rocon_web_common/www/js/ui/modal.js
*/
ResourceChooserUI = function(options){
  var that = this;
  options = options || {};
  that.resourceChooserInterface = options.resourceChooserInterface || new ResourceChooserInterface();
  
  var currentSelectedResource = {'name':'','item':null};
  var capturedResource = {'name':'','item':null};
  var rcModal = new Modal({
    divId: 'resource-chooser-modal'
  });

  //init ui
  //mapping ui item with interface function
  that.initResourceChooser = function(){
    rcModal.initModal();

    that.resourceChooserInterface.regRefreshListCallbacks([updateResourceList]);
    that.resourceChooserInterface.regCaptureResourceCallbacks([updateCaptureResource]);
    that.resourceChooserInterface.regReleaseResourceCallbacks([updateReleaseResource]);
    that.resourceChooserInterface.regResourceErrorCallbacks([updateCaptureErrorResource]);
    
    $('.teleop-resource-capture').click(function(e){
        if(capturedResource['name'].length === 0){
          that.resourceChooserInterface.captureResource(currentSelectedResource['name']);
          $('.teleop-resource-capture').prop('disabled', true);
          $('.teleop-resource-release').prop('disabled', true);
          message = 'Captureing [' + currentSelectedResource['name'] + ']\n Wait for a moment..';
        }
        else{
          message = 'Error: Already captured resource: [' + capturedResource['name'] + ']';
        }
        rcModal.show('Capture',message);
        
    });

    $('.teleop-resource-release').click(function(e){
        var message = '';
        if(capturedResource['name'].length !== 0){
            that.resourceChooserInterface.releaseResource(capturedResource['name']);
            capturedResource['item'].innerText = capturedResource['name'];
            capturedResource = {'name':'','item':null};
            message = 'Releasing: [' + currentSelectedResource['name'] + ']';
        }
        else{
            message = 'Error: None captured resource: ['+ capturedResource['name'] + ']';
        }
        rcModal.show('Release',message);
    });
  }

  var updateCaptureResource = function(msg){
    capturedResource['name'] = currentSelectedResource['name'];
    capturedResource['item'] = currentSelectedResource['item'];
    $('.teleop-resource-release').prop('disabled', false);
    rcModal.show('Success', 'Captured: ' + capturedResource['name']);
    capturedResource['item'].innerText = capturedResource['item'].innerText + ' (Captured)'
  }

  var updateReleaseResource = function(msg){
    $('.teleop-resource-capture').prop('disabled', false);
    $('.teleop-resource-release').prop('disabled', false);
    rcModal.show('Success', 'Released');
  }

  var updateCaptureErrorResource = function(msg){
    $('.teleop-resource-capture').prop('disabled', false);
    $('.teleop-resource-release').prop('disabled', false);
    rcModal.show('Error', JSON.stringify(msg));
  }

  var updateResourceList = function(resourceList){
    $('.teleop-resource-list').html('<li class="nav-header">Resource List</li>');
    for(resource in resourceList){        
        resourceItem = '<li class="teleop-resource-item"><a href="#">' + resourceList[resource] + '</a></li>';
        $('.teleop-resource-list').append(resourceItem);
    }
    $('.teleop-resource-item').click(function(e){
        currentSelectedResource['item'] = e.currentTarget.children[0];
        currentSelectedResource['name'] = currentSelectedResource['item'].innerText.replace(/[^A-Za-z0-9\/\:_]/g, '');
    })
  }
}

ResourceChooserUI.prototype.__proto__ = EventEmitter2.prototype;