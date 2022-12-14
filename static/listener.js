// Use SockJS
//Stomp.WebSocketClass = SockJS;

var ws = new SockJS ('http://127.0.0.1:15674/stomp');
//var ws = new SockJS ('amqp://bbszqpfp:zP35CsFKb_va50nYvxG7652kC0zFl32r@lemur.cloudamqp.com/bbszqpfp');
//var ws = new SockJS ('ws://bbszqpfp:zP35CsFKb_va50nYvxG7652kC0zFl32r@lemur.cloudamqp.com/bbszqpfp:61614/stomp'); // fails with no xor
//var ws = new SockJS ('http://peaceful-earth-7435.herokuapp.com:61614/stomp');

var client = Stomp.over(ws);

// Connection parameters
var mq_username = "guest",
    mq_password = "guest",
    mq_vhost    = "/",
    mq_url      = 'http://peaceful-earth-7435.heroku.com:15674/stomp',

    // The queue we will read. The /topic/ queues are temporary
    // queues that will be created when the client connects, and
    // removed when the client disconnects. They will receive
    // all messages published in the "amq.topic" exchange, with the
    // given routing key, in this case "mymessages"
    mq_queue    = "/queue/pv";

// This is where we print incomoing messages
var output;

// This will be called upon successful connection
function on_connect() {
  output.innerHTML += 'Connected to RabbitMQ-Web-Stomp<br />';
  console.log(client);
  client.subscribe(mq_queue, on_message);
}

// This will be called upon a connection error
function on_connect_error(err) {
  output.innerHTML += err + 'Connection has failed!<br />';
}

// This will be called upon arrival of a message
function on_message(m) {
  console.log('message received'); 
  console.log(m);
  var currentTime = new Date();
  output.innerHTML = '<b> ' + currentTime.getSeconds() + ' secs, ' + m.body + '</b><br />';
}


// Create a client
//var client = Stomp.client(mq_url);
client.connect ('guest', 'guest', on_connect, on_connect_error);

window.onload = function () {
  // Fetch output panel
  output = document.getElementById("output");

  // Connect
  client.connect(
    mq_username,
    mq_password,
    on_connect,
    on_connect_error,
    mq_vhost
  );
}

