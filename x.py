from collections import defaultdict
from xmlutils.xml2json import xml2json
import urllib2, json
from math import cos, pi

def sep (here, there):
    # scale lat so that one deg lat = 1 deg long
    londonRatio = cos (51.0/90.0 * pi/2.0)
    return ((here[0]-there[0])/londonRatio)**2 + (here[1] - there [1]) ** 2

def u (val):
    return val.encode('utf-8')

def loc2 (lat, long):
    dists = defaultdict (list)
    doc = xml2json (urllib2.urlopen ('http://www.tfl.gov.uk/tfl/syndication/feeds/cycle-hire/livecyclehireupdates.xml'), encoding = "utf-8")
    docjson = doc.get_json()
    print doc.get_json()
    print docjson
#    data = json.load (open ("document", "r"))
    data = json.loads (docjson)
#    print data
    print data.keys()
    stations = data [u'stations']
    print stations.keys()
    print "values", stations.values ()
    cx = (lat, long)
    markers = []
    for s in stations.values()[0]:  # xml delivers stations as a list
        print s
        loc=(float (s[u'lat']), float (s['long']))
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
        marker = {"name": u(s[u'name'].strip()), "loc": {"lat": u(s[u'lat']), "long":u(s[u'long'])}, "levels": {"available": u(s[u'nbBikes']), "free": u(s[u'nbEmptyDocks'])}}
#        markers.append (json.dumps (marker))
        markers.append (marker)
        i+=1
        if i > 10: break
#    print js
    return markers

#
if __name__ == "__main__":
    print loc2 (51.5, -0.14)

