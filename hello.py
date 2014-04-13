import os
from flask import Flask
import json, urllib2

app = Flask (__name__)




#print json.dumps (data ["dockStation"], sort_keys=True, indent=4)

#print u"\n".join ([ "%s, %s: %s, bikes Available %s, slots free %s" % (x [u'latitude'], x[u'longitude'], x[u'name'], x[u'bikesAvailable'], x[u'emptySlots']) for x in stations]).encode ('utf-8')

@app.route ('/')
def index ():
    return ('hello dad')

@app.route ('/stuff')
def hello ():
    data = json.load (urllib2.urlopen ('http://api.bike-stats.co.uk/service/rest/bikestats?format=json'))
    stations = data ["dockStation"]
    js = open ("parta.html").read()
#    return "stuff"
    pb = open ("partb.html").read()
    pc = open ("partc.html").read()
    i = 1
    for s in stations:
        #print s
        js += pb % tuple ([x.encode('utf-8') for x in s[u'name'].strip(), s[u'latitude'], s[u'longitude'], s[u'bikesAvailable'], s[u'emptySlots']])
        i+=1
        if i > 150: break
    js += pc
#    print js
    return js


