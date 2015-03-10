ROCON Web Proxy Server
======================

This is a server-side component that works with rosbridge_suite to
provide access from ROS Web clients to ROS systems that lie behind
a firewall.

It is a stand-alone service, it doens't have any ROS dependencies.
It is set-up to run directly on Heroku or manually on any other system
that supports python 2.7 and pip

## Quick start

### Running on a server or development computer:

    git clone git@github.com:creativa77/rocon_web_proxy_server.git
    cd rocon_web_proxy_server
    sudo pip install -r requirements.txt
    python main.py

Pre-requisites:

 - git
 - python 2.7
 - pip

### Running on Heroku

 - Sign-up or log-in to [Heroku.com](https://id.heroku.com/login)
 - Install the [Heroku toolbelt](https://toolbelt.heroku.com/)

#### Deploy to Heroku:

    git clone git@github.com:creativa77/rocon_web_proxy_server.git
    cd rocon_web_proxy_server
    heroku create
    git push heroku master

## Connecting the rest of the pieces

After the Proxy Server is running, you can connect your ROS system and
clients to it.

On the ROS side, add the
[rosbridge_websocket_client](https://github.com/creativa77/rosbridge_suite/tree/rocon-web-proxy/rosbridge_server/scripts) node, setting
the *url* param to the WebSocket location of the proxy server.

On your Web clients, configure roslibjs *url* to point to the same
WebSocket URL.

**NOTE**: By default, the Web Proxy Server will start on port 9090 when
run manualy and in the default port 80 when running on Heroku
