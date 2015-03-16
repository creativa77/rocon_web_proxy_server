import os
import sys
import traceback
import base64
import tornado.httpserver
import tornado.ioloop
import tornado.web
from tornado.websocket import WebSocketHandler
from functools import partial
from tornado.web import asynchronous
import json

# Global ID seed for clients
clients_connected = 0
proxy = None
clients = []
connToClient = None

class HttpHandler(tornado.web.RequestHandler):
    @asynchronous
    def get(self):
        global proxy, connToClient

        print "Got get"
        #TODO SET HEADER
        
        self.clear()
        self.set_status(200)
        self.set_header('server','example')
        self.set_header('connection','close')
        self.set_header('pragma','no-cache')
        self.set_header('cache-control','no-cache, no-store, must-revalidate, pre-check=0, post-check=0, max-age=0')
        self.set_header('access-control-allow-origin','*')
        self.set_header('content-type','multipart/x-mixed-replace;boundary=--boundarydonotcross')
        if proxy != None:
            connToClient = self
            proxy.send_message('{"op":"video"}')

class RosbridgeProxyHandler(WebSocketHandler):
    def open(self):
        global clients_connected, authenticate, proxy, clients
        clients_connected += 1
        print "Client connected.  %d clients total." % clients_connected
        clients.append(self)

    def on_message(self, message):
        global proxy, clients, connToClient
        try:
            print "Got message: [%s]" % str(message)
            msg = json.loads(message)
            if msg['op'] == 'proxy':
                proxy = self
                print "It's a proxy!"
            elif msg['op'] == 'video':
                print "Got Video Chunk"
                if connToClient != None:
                    if not connToClient.request.connection.stream.closed():
                        decoded = base64.b64decode(msg['data'])
                        connToClient.write(decoded)
                        connToClient.flush()
                    else:
                        self.send_message('{"op":"endVideo"}')
            elif msg['op'] == 'endVideo':
                if connToClient != None:
                    connToClient.finish()
                    print "Connection Finished"
                

            if self == proxy:
                for client in clients:
                    if client != proxy:
                        client.send_message(message)
            else:
                if proxy is not None:
                    proxy.send_message(message)
        except:
            print "Unexpected error:", sys.exc_info()[0]
            traceback.print_exc()

    def on_close(self):
        global clients_connected, proxy
        clients_connected = clients_connected - 1
        print "Client disconnected. %d clients total." % clients_connected
        if self == proxy:
            proxy = None

    def send_message(self, message):
        tornado.ioloop.IOLoop.instance().add_callback(partial(self.write_message, message))

    def check_origin(self, origin):
        return True

def main():
    application = tornado.web.Application([
        (r"/(.*)",tornado.web.StaticFileHandler,{"path":"./www"}),
        (r"/video", HttpHandler),
        (r"/ws", RosbridgeProxyHandler),
    ])
    http_server = tornado.httpserver.HTTPServer(application)
    port = int(os.environ.get("PORT", 9090))
    http_server.listen(port)

    tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    main()
