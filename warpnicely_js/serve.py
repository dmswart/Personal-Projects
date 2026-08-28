#!/usr/bin/env python3
"""Static server for local testing on Windows.

`python -m http.server` looks up MIME types from the Windows registry, which
often maps `.js` to `text/plain`. That breaks `importScripts()` in Web
Workers (and can break module scripts). This script forces the correct type
and disables caching so browsers don't keep serving a stale bad response.

Usage:
    python serve.py [port]   (default port 8080)
"""
import mimetypes
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler

mimetypes.add_type('text/javascript', '.js')
mimetypes.add_type('text/css', '.css')


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    HTTPServer(('', port), NoCacheHandler).serve_forever()
