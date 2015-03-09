import os
import sys
import traceback
import tornado.httpserver
import tornado.ioloop
import tornado.web
from tornado.websocket import WebSocketHandler
from functools import partial
import json

# Global ID seed for clients
clients_connected = 0
proxy = None
clients = []

class HttpHandler(tornado.web.RequestHandler):
    def get(self):
        self.write("Hello world")

class RosbridgeProxyHandler(WebSocketHandler):
    def open(self):
        global clients_connected, authenticate, proxy, clients
        clients_connected += 1
        print "Client connected.  %d clients total." % clients_connected
        clients.append(self)

    def on_message(self, message):
        global proxy, clients
        try:
            print "Got message: [%s]" % str(message)
            msg = json.loads(message)
            if msg['op'] == 'proxy':
                proxy = self
                print "It's a proxy!"

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
        (r"/video", HttpHandler),
        (r"/", RosbridgeProxyHandler),
    ])
    http_server = tornado.httpserver.HTTPServer(application)
    port = int(os.environ.get("PORT", 9090))
    http_server.listen(port)

    tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    main()
