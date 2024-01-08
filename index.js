const net = require('net');


const config = {
  timeout: 5000,
  ip_address: '192.168.1.134',
  port: 921,
};
// 192.168.1.71

let r10Socket;
let gsproSocket;

function connectGSPro() {
  gsproSocket = new net.Socket();
  gsproSocket.connect(config.port, config.ip_address);

  gsproSocket.setTimeout(config.timeout); 
  gsproSocket.write('');
  
  gsproSocket.on('timeout', () => {
    console.log('[gspro] Unable to connect to GSPro');
    disconnectGSPro();
  });
  
  gsproSocket.on('connect', () => handleConnection());
  
  gsproSocket.on('error', (e) => {
    if (e.code === 'ECONNREFUSED') {
      console.error('Connection refused. Do you have the GSPro Connect window open?');
    } else {
      console.error('error with gspro socket', e);
      disconnectGSPro();
    }
  });  
}

var server = net.createServer((socket) => {
  console.log('r10 connected');
  // is this needed to ping?
	socket.write('');
  socket.on('data', (data) => {
    console.log(`r10 data received: ${data}`);
    // if (gsproSocket) {
    //   gsproSocket.write(data);
    // }
  });
  socket.on('error', (error) => {
    console.log('r10 socket error', error);
    disconnectR10();
  });
  socket.on('close', () => {
    console.log(`r10 socket closed`);
    r10Socket = null;
  });
  r10Socket = socket;
  connectGSPro();
	// socket.pipe(socket);
});
server.listen(1337, '192.168.1.71', () => {
  console.log('listening');
});

function disconnectR10() {
  r10Socket.destroy();
  r10Socket = null;
}

function handleConnection() {
  console.log('✅ GSPro connected');
  gsproSocket.setEncoding('UTF8');
  gsproSocket.setTimeout(0);

  gsproSocket.on('close', (hadError) => {
    console.log('gsPro connection closed.  Had error: ', hadError);
  });

  if (r10Socket) {
    // let them talk to each other
    gsproSocket.pipe(r10Socket);
    r10Socket.pipe(gsproSocket);
  }

  gsproSocket.on('data', (data) => {
    const dataObj = JSON.parse(data);
    console.log('GSPro data received', dataObj);
    // proxy to r10 connect
    // r10Socket.write(data);
  });
}

function disconnectGSPro() {
  gsproSocket.destroy();
  gsproSocket = null;
}