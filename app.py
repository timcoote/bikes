import logging
from bs4 import BeautifulSoup as bs
import os, subprocess
from collections import defaultdict
from flask import Flask, Response, url_for, send_from_directory
import json
from math import cos, pi
import requests

app = Flask (__name__, static_folder='static', static_url_path='')

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
    return send_from_directory ('static', fil)

#@app.route ('/static/promise.js')
#def servePromise ():
#    return send_from_directory ('static', filename='promise.js')

#@app.route ('/static/blah.html')
# just spit out a map that was made before
#def stuff1 ():
#    return url_for ('static', filename='blah.html')
#    return send_from_directory ('static', filename='blah.html')

@app.route ('/test')
def index ():
    return ('hello dad')

@app.route ('/')
def tester ():
    return open ('x.html').read().replace("#MAP_KEY#", os.environ['MAP_KEY'])
    
@app.route ('/stuff')
def hello ():
    return loc1 (51.50741, -0.12725)

@app.route ('/loc/<string:lat>/<string:long>')
def location (lat, long):
    return Response (json.dumps (loc3 (float(lat), float(long))), mimetype='application/json')


@app.route ('/json')
def retjson ():
#    return Response('{"s": "hello"}', mimetype='application/json')
    return Response(json.dumps (loc3 (51.5, -0.1)), mimetype='application/json')

def loc1 (lat, long):
    js = open ("parta.html").read().replace("#MAP_KEY#", os.environ['MAP_KEY'])
    return js + loc (lat, long) + open ("partc.html").read ()


def mk_station (indata: dict):
    print (f"{indata.items()=}")
    assert indata['placeType'] == 'BikePoint'
    stn = {}
    stn['name'] = indata['commonName']
    stn['lat'] = indata['lat']
    stn['long'] = indata['lon']
    stn['levels'] = {}

    for n, prop in enumerate (indata['additionalProperties']):
        if n == 0:
            modified = prop['modified']
        assert prop['$type'] == 'Tfl.Api.Presentation.Entities.AdditionalProperties, Tfl.Api.Presentation.Entities'
        assert prop['category'] == 'Description'
        assert prop['sourceSystemKey'] == 'BikePoints'
        assert modified == prop['modified']

        match prop['key']:
            case 'NbStandardBikes':
                stn['levels']['available'] = int(prop['value'])
            case 'NbEmptyDocks':
                stn['levels']['free'] = int (prop['value'])
            case _:
                pass

    return stn

# indata.keys()=dict_keys(['$type', 'id', 'url', 'commonName', 'placeType', 'additionalProperties', 'children', 'childrenUrls', 'lat', 'lon'])

def mk_stations (inst: str):
    data = json.loads (inst)
    print (f"{data[0]=}")
    stns = [mk_station (d) for d in data]

    return stns


def loc3 (lat, long):
    dists = defaultdict (list)
    try:
       #doc = requests.get ('https://tfl.gov.uk/tfl/syndication/feeds/cycle-hire/livecyclehireupdates.xml').text
       doc = requests.get ('https://api.tfl.gov.uk/BikePoint/').text
    except Exception as e:
       print ("here's the problem %s" % e)
       return

    stations = mk_stations (doc)

    soup = bs (doc, 'html.parser')
#    print ("soup %s *** endof doc" % "1")
    cx = (lat, long)
    markers = []
    #for s in soup.find_all ("station"):
    for s in stations:
#        print ("found station %s" % s)
        #loc=(float (s.find_all ("lat")[0].text), float (s.find_all ("long")[0].text))
        loc = (s['lat'], s['long'])
#        print ("{} ".format (loc))
        dist = sep (cx, loc)
#        print (loc, s[u'name'].encode ('utf-8'), dist)
#        print (loc, dist, s.__class__)
#        print (loc, s, dist)
        dists [dist].append (s)
    i = 1
#    print ("here come the dists", dists)
    for (d, sr) in sorted(dists.items (), key = lambda x: x[0], reverse = False):
#        print (d, sr)
        s = sr [0]
#        marker = {"name": u(s.find_all("name")[0].text.strip()), "loc": {"lat": u(s.find_all("lat")[0].text), "long":u(s.find_all("long")[0].text)}, "levels": {"available": u(s.find_all("nbbikes")[0].text), "free": u(s.find_all("nbemptydocks")[0].text)}}
        #marker = {"name": s.find_all("name")[0].text.strip(), "loc": {"lat": s.find_all("lat")[0].text, "long":s.find_all("long")[0].text}, "levels": {"available": s.find_all("nbbikes")[0].text, "free": s.find_all("nbemptydocks")[0].text}}
        marker = {"name": s["name"], "loc": {"lat": s["lat"], "long": s['long']}, "levels": s['levels']}
#        markers.append (json.dumps (marker))
        markers.append (marker)
        i+=1
        if i > 10: break
    return markers


#
if __name__ == "__main__":
    print (loc3 (51.5, -0.14))
    app.debug = True
#    app.run (port=4999)
    app.run ()

