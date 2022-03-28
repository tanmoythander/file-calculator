/* eslint-disable no-console */
var socketComponent = require('./../components/socket');


module.exports = function(io, socket) {
	const onDisconnect = function(/*reason*/) {
		socketComponent.disableId(socket.decoded.user._id, socket.id,
			socket.decoded.appKey.name, socket.decoded.appKey.token);
		// if (reason === 'io server disconnect') {
		// 	// the disconnection was initiated by the server
		// 	// reconnect manually
		// 	socket.connect();
		// } else if (reason === 'io client disconnect') {
		// 	console.log(`SOCKET_LOG: User (_id: ${
		// 		savedUser._id}) has disconnected\n -${
		// 		new Date().toLocaleString()}`);
		// } else {
		// 	console.log(`SOCKET_LOG: User (_id: ${
		// 		savedUser._id}) will be reconnecting soon\n -${
		// 		new Date().toLocaleString()}`);
		// }
	};

	socket.on('disconnect', onDisconnect);
};
