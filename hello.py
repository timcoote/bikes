import os
from collections import defaultdict
from flask import Flask
import json, urllib2

app = Flask (__name__)

#print json.dumps (data ["dockStation"], sort_keys=True, indent=4)

#print u"\n".join ([ "%s, %s: %s, bikes Available %s, slots free %s" % (x [u'latitude'], x[u'longitude'], x[u'name'], x[u'bikesAvailable'], x[u'emptySlots']) for x in stations]).encode ('utf-8')

def sep (here, there):
    return (here[0]-there[0])**2 + (here[1] - there [1]) ** 2

@app.route ('/')
def index ():
    return ('hello dad')

@app.route ('/stuff')
def hello ():
    return loc1 (51.50741, -0.12725)

@app.route ('/loc/<float:lat>/<float:long>')
def location (lat, long):
    return loc1 (lat, long)

@app.route ('/bikes/<float:lat>/<float:long>')
def stns (lat, long):
    return loc (lat, long)

def loc1 (lat, long):
    js = open ("parta.html").read()
    return js + loc (lat, long) + open ("partc.html").read ()

def loc (lat, long):
    data = json.load (urllib2.urlopen ('http://api.bike-stats.co.uk/service/rest/bikestats?format=json'))
    stations = data ["dockStation"]
    cx = (lat, long)
    dists = defaultdict (list)
    for s in stations:
        loc=(float (s[u'latitude']), float (s['longitude']))
        dist = sep (cx, loc)
    #    print loc, s[u'name'].encode ('utf-8'), dist
        dists [dist].append (s)
    js = ""
    pb = open ("partb.html").read()
    pc = open ("partc.html").read()
    i = 1
#    print "here come the dists", dists
    for (d, sr) in sorted(dists.items (), key = lambda x: x[0], reverse = False):
#        print d, sr
        s = sr [0]
        js += pb % tuple ([x.encode('utf-8') for x in s[u'name'].strip(), s[u'latitude'], s[u'longitude'], s[u'bikesAvailable'], s[u'emptySlots']])
        i+=1
        if i > 150: break
#    print js
    return js

#
if __name__ == "__main__":
    print hello()

