from collections import defaultdict
from bs4 import BeautifulSoup as bs
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
    doc = urllib2.urlopen ('http://www.tfl.gov.uk/tfl/syndication/feeds/cycle-hire/livecyclehireupdates.xml').read ()
    soup = bs (doc)

    cx = (lat, long)
    markers = []
    for s in soup.find_all ("station"):
        print ("found station %s" % s)
        print s.find_all ("lat")
        loc=(float (s.find_all ("lat")[0].text), float (s.find_all ("long")[0].text))
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
        marker = {"name": u(s.find_all("name")[0].text.strip()), "loc": {"lat": u(s.find_all("lat")[0].text), "long":u(s.find_all("long")[0].text)}, "levels": {"available": u(s.find_all("nbbikes")[0].text), "free": u(s.find_all("nbemptydocks")[0].text)}}
#        markers.append (json.dumps (marker))
        markers.append (marker)
        i+=1
        if i > 10: break
#    print js
    return markers

#
if __name__ == "__main__":
    print loc2 (51.5, -0.14)

