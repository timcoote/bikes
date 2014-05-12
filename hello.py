import os, subprocess
from collections import defaultdict
from flask import Flask, Response, url_for, send_from_directory
import json, urllib2
from math import cos, pi

app = Flask (__name__, static_folder='static', static_url_path='')

#print json.dumps (data ["dockStation"], sort_keys=True, indent=4)

#print u"\n".join ([ "%s, %s: %s, bikes Available %s, slots free %s" % (x [u'latitude'], x[u'longitude'], x[u'name'], x[u'bikesAvailable'], x[u'emptySlots']) for x in stations]).encode ('utf-8')

dists = defaultdict (list)

def sep (here, there):
# scale lat so that one deg lat = 1 deg long
    londonRatio = cos (51.0/90.0 * pi/2.0)
    return ((here[0]-there[0])/londonRatio)**2 + (here[1] - there [1]) ** 2


@app.route ('/bogomips')
def bogomips ():
    ret = subprocess.check_output (["grep","bogomips", "/proc/cpuinfo"] )
    return (ret)

@app.route ('/socket')
def serveSocket ():
    return (open ('y.html').read())

@app.route ('/static/<string:fil>')
def serveStatic (fil):
    return send_from_directory ('static', filename=fil)

#@app.route ('/static/promise.js')
#def servePromise ():
#    return send_from_directory ('static', filename='promise.js')

#@app.route ('/static/blah.html')
# just spit out a map that was made before
#def stuff1 ():
#    return url_for ('static', filename='blah.html')
#    return send_from_directory ('static', filename='blah.html')

@app.route ('/')
def index ():
    return ('hello dad')

@app.route ('/test')
def tester ():
    return (open ('x.html').read())
    
@app.route ('/stuff')
def hello ():
    return loc1 (51.50741, -0.12725)

@app.route ('/loc/<string:lat>/<string:long>')
def location (lat, long):
#    return Response (json.dumps (loc2 (51.50741, -0.12725)), mimetype='application/json')
    return Response (json.dumps (loc2 (float(lat), float(long))), mimetype='application/json')

@app.route ('/bikes/<float:lat>/<float:long>')
def stns (lat, long):
    return loc (lat, long)

@app.route ('/json')
def retjson ():
    return Response('{"s": "hello"}', mimetype='application/json')

def loc1 (lat, long):
    js = open ("parta.html").read()
    return js + loc (lat, long) + open ("partc.html").read ()

def loc (lat, long):
    dists = defaultdict (list)
    data = json.load (urllib2.urlopen ('http://bike-stats.appspot.com/service/rest/bikestats?format=json'))
    stations = data ["dockStation"]
    cx = (lat, long)
    for s in stations:
        loc=(float (s[u'latitude']), float (s['longitude']))
        dist = sep (cx, loc)
    #    print loc, s[u'name'].encode ('utf-8'), dist
        dists [dist].append (s)
    js = ""
    pb = open ("partb.html").read()
    i = 1
#    print "here come the dists", dists
    for (d, sr) in sorted(dists.items (), key = lambda x: x[0], reverse = False):
#        print d, sr
        s = sr [0]
        js += pb % tuple ([x.encode('utf-8') for x in s[u'name'].strip(), s[u'latitude'], s[u'longitude'], s[u'bikesAvailable'], s[u'emptySlots']])
        i+=1
        if i > 10: break
#    print js
    return js

def u (val):
    return val.encode('utf-8')

def loc2 (lat, long):
    dists = defaultdict (list)
    data = json.load (urllib2.urlopen ('http://bike-stats.appspot.com/service/rest/bikestats?format=json'))
    stations = data ["dockStation"]
    cx = (lat, long)
    markers = []
    for s in stations:
        loc=(float (s[u'latitude']), float (s['longitude']))
        dist = sep (cx, loc)
    #    print loc, s[u'name'].encode ('utf-8'), dist
        dists [dist].append (s)
    js = ""
    pb = open ("partb.html").read()
    i = 1
#    print "here come the dists", dists
    for (d, sr) in sorted(dists.items (), key = lambda x: x[0], reverse = False):
#        print d, sr
        s = sr [0]
        marker = {"name": u(s[u'name'].strip()), "loc": {"lat": u(s[u'latitude']), "long":u(s[u'longitude'])}, "levels": {"available": u(s[u'bikesAvailable']), "free": u(s[u'emptySlots'])}}
#        markers.append (json.dumps (marker))
        markers.append (marker)
        i+=1
        if i > 10: break
#    print js
    return markers

#
if __name__ == "__main__":
#    print loc2 (51.5, -0.14)
    app.debug = True
    app.run ()

