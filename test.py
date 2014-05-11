import pika

connection = pika.BlockingConnection (pika.ConnectionParameters ('pluto'))

channel = connection.channel ()

channel.queue_declare (queue="pv")

def callback (ch, method, properties, body):
    print "[y] Received %r" % (body,)

channel.basic_consume (callback, queue="pv", no_ack=True)

print "waiting..."

channel.start_consuming ()


