var ros = new ROSLIB.Ros();
var defaultUrL = rocon_interactions.rosbridge_uri;

var viewer;
var format = 'svg';
var engine = 'dot';

//set sub
var dotgraph_string_sub = '';
var dotgraph_string_sub_topic_name = '/concert/conductor/graph_string';
var dotgraph_string_sub_topic_type = 'std_msgs/String';

var dotgraph_string = null;

$().ready(function(e) {

  initHeader();
  initViewer();
});

function initHeader()
{
  settingROSCallbacks();
  ros.connect(defaultUrL);
  $('#focusedInput').val(''+defaultUrL);
}

function initViewer() {
  viewer = createViewer();
}

function createViewer() {
  
  var view = document.getElementById('view');
  view.innerHTML = "No Data received";
}

function settingROSCallbacks()                      
{
  ros.on('connection',function() {
    console.log("Connected");
    // subscribe to order list                                                       
    $('#focusedInput').val('Connected');
    $('#focusedInput').attr('disabled',true);
    settingSubscriber();
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

function settingSubscriber()
{
  dotgraph_string_sub_topic = new ROSLIB.Topic({
    ros: ros,
    name: dotgraph_string_sub_topic_name,
    messageType: dotgraph_string_sub_topic_type
  }); 
  dotgraph_string_sub_topic.subscribe(processConductorGraph);
}

function processConductorGraph(msg)
{
  console.log("Here");
  dotgraph_string = msg.data;
  updateViewer();
}

function updateViewer()
{
  var view = document.getElementById('view');

  if(dotgraph_string != null) {
    drawDotGraph(view, dotgraph_string);
  }
}

function drawDotGraph(view, data)
{
  var v = getViz(data);  
  view.innerHTML = v;
}

function getViz(data)
{
  var result;
  try {
    result = Viz(data, format, engine);
    if(format === "svg")
      return result;
    else
      return inspect(result);
  }catch(e) {
    return inspect(e.toString());
  }
}

function inspect(s) {
  return "<pre>" + s.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;") + "</pre>"
}
