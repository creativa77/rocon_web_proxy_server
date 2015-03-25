import os
import sys
import traceback
import time
import datetime
import base64
import tornado.httpserver
import tornado.ioloop
import tornado.web
from tornado.websocket import WebSocketHandler
from tornado.web import asynchronous
import json
import random

# Global ID seed for clients
clients_connected = 0
proxies = []
clients = []


class HttpHandler(tornado.web.RequestHandler):
    @asynchronous
    def get(self):
        global proxies

        args = {}
        args['topic'] = self.get_argument('topic')
        args['height'] = self.get_argument('height','480')
        args['width'] = self.get_argument('width','640')
        
        #TODO Get proxy_id
        #proxy_id = self.get_argument('proxy')
        ip = self.request.remote_ip
        proxy_id = 3

        self.clear()
        self.set_status(200)
        self.set_header('server', 'example')
        self.set_header('connection', 'close')
        self.set_header('pragma', 'no-cache')
        self.set_header('cache-control', 'no-cache, no-store, must-revalidate,'
                        'pre-check=0, post-check=0, max-age=0')
        self.set_header('access-control-allow-origin', '*')
        self.set_header('content-type', 'multipart/x-mixed-replace;boundary='
                        '--boundarydonotcross')
        for proxy in proxies:
            if proxy.name == int(proxy_id):
                message = json.dumps({"op":"videoStart", "url_params" : args})
                clients.append(Client(proxy,self,True))
                proxy.conn.write_message(message)


class RosbridgeProxyHandler(WebSocketHandler):
    def __init__(self, application, request, **kwargs):
        tornado.websocket.WebSocketHandler.__init__(self, application, request, **kwargs)
        self.io_loop = tornado.ioloop.IOLoop.instance()
        self.ping_interval = int(os.environ.get("PING_INTERVAL", 5))

    def open(self):
        global clients_connected, authenticate, clients
        clients_connected += 1
        print self.request.remote_ip
        print "Client connected.  %d clients total." % clients_connected
        self.io_loop.add_timeout(datetime.timedelta(seconds=self.ping_interval), self.send_ping)

    def send_ping(self):
        try:
            self.ping("a")
        except Exception as ex:
            print "-- Failed to send ping! %s" % ex

    def on_pong(self, data):
        self.io_loop.add_timeout(datetime.timedelta(seconds=self.ping_interval), self.send_ping)


    def on_message(self, message):
        global proxies, clients
        try:
            msg = json.loads(message)
            if msg['op'] == 'proxy':
                proxy = Proxy(self)
                proxies.append(proxy)
                print "It's a proxy!"
                print "Proxy ID = ", proxy.name
            #TODO beware when auth is included.
            elif msg['op'] == 'auth': #In the authorization is included the proxy id
                for proxy in proxies:
                    if msg['proxy_id'] == proxy.name: # if the proxy_id is found, the Client is created and binded to a proxy
                        client = Client(proxy,self)
                        clients.append(client)
                        proxy.clients.append(client)
                        print "Client binded to proxy = ", proxy.name
                        break
            elif msg['op'] == 'videoData':
                try:
                    for client in clients:
                        if client.video == True:
                            if not client.conn.request.connection.stream.closed():
                                decoded = base64.b64decode(msg['data'])
                                client.conn.write(decoded)
                                client.conn.flush()
                            else:
                                print "Navigator closed"
                                self.write_message('{"op":"endVideo"}')
                                clients.remove(client)
                except Exception as e:
                    print e
            elif msg['op'] == 'endVideo':
                if connToClient is not None:
                    connToClient.finish()
                    print "Connection Finished"

            for proxy in proxies:
                if self == proxy.conn:
                    for client in proxy.clients:
                        client.write_message(message)
                    break
            for client in clients:
                if client.conn == self:
                    client.proxy.write_message(message)
                    break
        except:
            print "Unexpected error:", sys.exc_info()[0]
            traceback.print_exc()

    def on_close(self):
        global clients_connected, proxies, clients
        clients_connected = clients_connected - 1
        print "Client disconnected. %d clients total." % clients_connected
        for client in clients:
            if client.conn == self:
                clients.remove(client)
                print "client removed"
                break
        for proxy in proxies:
            if proxy.conn == self:
                proxies.remove(proxy)
                print "proxy removed"
                break
        for proxy in proxies:
            for client in proxy.clients:
                if client.conn == self:
                    clients.remove(client)
                    break


    def check_origin(self, origin):
        return True

class Proxy():
    name = 1
    clients = []
    def __init__(self,proxyConn):
        self.conn = proxyConn
        self.name = Proxy.name
        Proxy.name += 1

class Client():
    name = 1
    def __init__(self,proxy,conn,video=False):
        self.proxy = proxy
        self.conn = conn
        self.name = Client.name
        self.video = video
        Client.name += 1


def main():
    application = tornado.web.Application([
        (r"/stream", HttpHandler),
        (r"/ws", RosbridgeProxyHandler),
        (r"/(.*)", tornado.web.StaticFileHandler, {"path": "./www"}),
    ])
    http_server = tornado.httpserver.HTTPServer(application)
    port = int(os.environ.get("PORT", 9090))
    http_server.listen(port)

    print "ROCON Web Proxy Server started on port %d" % port

    tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    main()
