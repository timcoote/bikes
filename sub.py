import pika, os, urllib.parse, time

inbound_url_str = os.environ.get ("CLOUDAMQP_URL", "amqp://guest:guest@localhost//")
inbound_url = urllib.parse.urlparse (inbound_url_str)
print (inbound_url_str)

outbound_url_str = ("amqp://guest:guest@localhost//")
outbound_url = urllib.parse.urlparse (outbound_url_str)

in_connection = pika.BlockingConnection (pika.ConnectionParameters (host=inbound_url.hostname, virtual_host=inbound_url.path [1:],
                      credentials = pika.PlainCredentials (inbound_url.username, inbound_url.password)))

out_connection = pika.BlockingConnection (pika.ConnectionParameters (host=outbound_url.hostname, virtual_host=outbound_url.path [1:],
                      credentials = pika.PlainCredentials (outbound_url.username, outbound_url.password)))

in_channel = in_connection.channel ()
out_channel = out_connection.channel ()

in_channel.queue_declare (queue="pv", durable=True)
out_channel.queue_declare (queue="pv", durable=True)


def callback (ch, method, properties, body):
    print ("[y] %s Received %r" % (time.strftime ("%M %S", time.localtime()), body,))
    # is this needed for remote:  out_channel.basic_publish (exchange = "", routing_key = "pv", body = body)

#in_channel.basic_consume (callback, queue="pv", no_ack=True)
in_channel.basic_consume ('pv', callback, auto_ack=True)

print ("waiting...")

in_channel.start_consuming ()


#publish (exchange = "", routing_key = "pv", body = "1234 hello world")
#
#print " [x] Sent 'hello world'"
#
#connection.close ()
#

#
#print url_str
#url = urlparse.urlparse (url_str)
#print url.__str__()
#
##connection = pika.BlockingConnection (pika.ConnectionParameters (host="localhost"))
#connection = pika.BlockingConnection (pika.ConnectionParameters (host=url.hostname, virtual_host=url.path [1:],
#                      credentials = pika.PlainCredentials (url.username, url.password)))
#
#channel = connection.channel ()
#
#channel.queue_declare (queue="pv", durable=True)
#
##done=False
##while not done:
##   try:
##      msg = subprocess.check_output (["sudo", "/home/tim/pvi/aurora-1.7.8d/aurora", "-a", "2", "-c", "-T", "-d", "0", "-e", "/dev/ttyUSB0"])
##      done = True
##   except subprocess.CalledProcessError as e:
##      print "failed", e
##
#for i in range (1,2000):
#    msg = "temperature is: %f" % random.randint(15,25)
#    time.sleep (2)
##    msg = "Current output is " + subprocess.check_output (["ssh", "mercury", "ssh", "tim@172.17.1.5", "cat", "pvi/aurora-1.7.8d/output", "|", "tail", "-1", "|", "awk", "'{print $1, $10, $15}'"])
#    print msg
#
#    channel.basic_publish (exchange = "", routing_key = "pv", body = msg)
#
#print " [x] Sent 'hello world'"
#
#connection.close ()
#
#
