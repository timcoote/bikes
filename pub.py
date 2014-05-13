import subprocess, random
import pika, os, urlparse

url_str = os.environ.get ("CLOUDAMQP_URL", "amqp://guest:guest@localhost//")
print url_str
url = urlparse.urlparse (url_str)
print url.__str__()

connection = pika.BlockingConnection (pika.ConnectionParameters (host="localhost"))
#connection = pika.BlockingConnection (pika.ConnectionParameters (host=url.hostname, virtual_host=url.path [1:],
#                      credentials = pika.PlainCredentials (url.username, url.password)))

channel = connection.channel ()

channel.queue_declare (queue="pv", durable=True)

#done=False
#while not done:
#   try:
#      msg = subprocess.check_output (["sudo", "/home/tim/pvi/aurora-1.7.8d/aurora", "-a", "2", "-c", "-T", "-d", "0", "-e", "/dev/ttyUSB0"])
#      done = True
#   except subprocess.CalledProcessError as e:
#      print "failed", e
#
for i in range (1,2000):
#    msg = "temperature is: %f" % random.randint(15,25)
    msg = "Current output is " + subprocess.check_output (["ssh", "tim@172.17.1.5", "cat", "pvi/aurora-1.7.8d/output", "|", "tail", "-1", "|", "awk", "'{print $7}'"]) + " W"
    print msg

    channel.basic_publish (exchange = "", routing_key = "pv", body = msg)

print " [x] Sent 'hello world'"

connection.close ()


