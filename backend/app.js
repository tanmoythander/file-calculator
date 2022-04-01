/* eslint-disable no-console */
/////////////// PLUGINS START ///////////////
var debug = require('debug')('express:server');
var http = require('http');
var socket_io = require('socket.io');
var express = require('express');
var path = require('path');
var cors = require('cors');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
// delay plugin
var delay = require('delay');
/////////////// PLUGINS END ///////////////

// initialize mongoose schemas
require('./models/queries'); // TODO

// include the route modules
var query = require('./routes/query');

// Require mongoose
var mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;
var dbOptions = {
	keepAlive: 200,
	useNewUrlParser: true,
	useCreateIndex: true,
	useUnifiedTopology: true,
	useFindAndModify: false
};

// Connect to mongoDB
var reconnectTries = 0;
var trialDelay = 1;

// mongoose connection callback
mongoose.connection.on('open', function () {
	mongoose.connection.db.admin().serverStatus(function (err, info) {
		if (err) {
			console.log(err);
		} else if (info) {
			// Send log on console
			console.log('MongoDB Server Version: ' + info.version);
			// execute init function
			require('./components/init')(info);
		}
	});
});
/////////////// Scheduler Ends ///////////////

// Now attempt to connect to database
dbConnect(dbOptions);

// CORS Config
var whitelist = [
	'http://localhost:3040', // DEV Support
	undefined // POSTMAN Support
];
var corsOptions = {
	origin: function (origin, callback) {
		if (whitelist.indexOf(origin) !== -1) {
			callback(null, true);
		} else {
			var err = new Error(origin + ' is not allowed to access');
			err.status = 200;
			callback(err);
		}
	}
};

// start express app
// every API request gets started from here
var app = express();

// Enable HTTPS on Bluemix
// app.enable('trust proxy');

/*
app.use(function (req, res, next) {
	if (req.secure || process.env.PRODUCTION === undefined) {
		next();
	} else {
		console.log('redirecting to https');
		res.redirect('https://' + req.headers.host + req.url);
	}
});
*/

// view engine setup
//app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(cors(corsOptions));
app.use(logger('dev'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(
	express.urlencoded({
		extended: false
	})
);
app.use(
	express.json({
		limit: '5mb'
	})
);

// Register the main routes TODO
app.use('/query', query);

// catch 404 and forward to error handler
// eslint-disable-next-line no-unused-vars
app.use(function (req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	// eslint-disable-next-line no-unused-vars
	app.use(function (err, req, res, next) {
		res.status(err.status || 500);
		res.send({
			state: 'failure',
			message: err.message,
			error: err
		});
	});
}

// production error handler
// no stacktraces leaked to user
// eslint-disable-next-line no-unused-vars
app.use(function (err, req, res, next) {
	res.status(err.status || 500);
	res.send({
		state: 'failure',
		message: err.message,
		error: err
	});
});

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3030');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);


// Create io instance
var io = socket_io(server, {
	cors: {
		origin: whitelist,
		methods: ['GET', 'POST']
	},
	transports: ['websocket', 'polling']
});

// register socket handlers TODO
io.on('connection', function(socket) {
	// Print socket connection log
	console.log(`SOCKET_LOG: User (_id: ${
		socket.decoded.user._id}) has connected from ${
		socket.handshake.headers['x-forwarded-for']} using app ${
		socket.decoded.appKey.name}\n- ${
		new Date().toLocaleString()}`);

	// Set connected user's socketId
	// require('./components/socket').setId(socket.decoded.user._id,
	// 	socket.id, socket.decoded.appKey.name, socket.decoded.appKey.token);

	// Conversation handler
	// require('./handlers/conversation')(io, socket);

	// Socket disconnection handler
	// require('./handlers/disconnection')(io, socket);

	// Test code
	/*
	console.log(`${socket.id} - Socket client has connected from ${
		socket.handshake.headers['x-forwarded-for']}`);
	// var count = 0;
	socket.pingTimeout = setTimeout(function() {
		// count += 1;
		console.log(socket.id + ' - Performing TEST emit');
		socket.emit('TEST', {
			text: 'This is a test emit'
		});
	}, 20000);
	socket.on('TEST', function(...args) {
		console.log(socket.id + ' - Socket client emitted event TEST');
		socket.emit('TEST.RES', {
			state: 'success',
			message: 'Test emit received',
			args: args.length === 1 ? args[0] : args
		});
	});
	socket.on('SEND', function(data) {
		console.log(socket.id + ' - Socket client emitted event SEND');
		if (data.id && data.id.length > 0
			&& data.message && data.message.length > 0) {
			io.to(data.id).emit('RECEIVE', {
				id: socket.id,
				message: data.message
			});
			socket.emit('SEND.SUCCESS', {
				state: 'success',
				message: 'Sending successful',
				data: data
			});
		} else {
			socket.emit('SEND.FAILURE', {
				state: 'failure',
				message: 'Sending failed',
				data: data
			});
		}
	});
	socket.on('disconnect', function(reason) {
		socket.pingTimeout.close();
		if (reason === 'io server disconnect') {
			console.log(socket.id + ' - Socket client disconnected by server');
		} else if (reason === 'io client disconnect') {
			console.log(socket.id + ' - Socket client disconnected by client');
		} else {
			console.log(socket.id + ' - Socket client disconnected. Reconnecting ...');
		}
	});
	*/
});

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
console.log('HTTP server started on, localhost:' + port);

// functions
function dbConnect(options) {
	console.log('Connecting database ...');
	mongoose.connect('mongodb://localhost:27017/file-calculator', options).then(
		function () {
			console.log('Database connection successful');
		},
		function (err) {
			console.log(err);
			console.log('Database connection failed');
			reconnectTries++;
			console.log('Reconnecting after ' + require('./components/dateTime').toTimeString(trialDelay));
			console.log('Reconnect trial: ' + reconnectTries);
			console.log('');
			delay(trialDelay * 1000).then(function () {
				trialDelay += trialDelay;
				if (trialDelay > 7200) trialDelay = 7200;
				// enable recurtion
				dbConnect(options);
			});
		}
	);
}

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
	var port = parseInt(val, 10);

	if (isNaN(port)) {
		// named pipe
		return val;
	}

	if (port >= 0) {
		// port number
		return port;
	}

	return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
	if (error.syscall !== 'listen') {
		throw error;
	}

	var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

	// handle specific listen errors with friendly messages
	switch (error.code) {
	case 'EACCES':
		console.error(bind + ' requires elevated privileges');
		process.exit(1);
		break;
	case 'EADDRINUSE':
		console.error(bind + ' is already in use');
		process.exit(1);
		break;
	default:
		throw error;
	}
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
	var addr = server.address();
	var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
	debug('Listening on ' + bind);
}
