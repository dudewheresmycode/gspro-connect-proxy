import net from 'net';

import { ip as ipv4 } from 'address';
import chalk from 'chalk';
import { EventEmitter } from 'events';

const serverConfigDefault = {
  port: 1337
}

const clientConfigDefault = {
  timeout: 5000,
  ip_address: '127.0.0.1',
  port: 921
}

export default class GSProProxy extends EventEmitter {
  constructor(
    options = {
      serverConfig: {},
      clientConfig: {}
    }
  ) {
    super();
    this.serverConfig = { ...serverConfigDefault, ...options.serverConfig };
    this.clientConfig = { ...clientConfigDefault, ...options.clientConfig };

    this.sockets = {
      launchMonitor: null,
      gsPro: null
    };

    this.createServer();
  }

  createServer() {
    this.server = net.createServer((socket) => {
      console.log(chalk.green('[LaunchMonitor] Launch monitor socket opened'));
      // is this needed to ping?
      socket.write('');
      // socket.on('connect', () => this.launchMonitorConnected());

      socket.on('data', (data) => {
        const dataObj = JSON.parse(data);
        console.log(chalk.grey(`[LaunchMonitor] ${JSON.stringify(dataObj, null, 1)}`));
        this.emit('launchData', dataObj);
      });
      socket.on('error', (error) => {
        console.log(chalk.red('[LaunchMonitor] socket error', error));
        this.disconnectLaunchMonitor();
      });
      socket.on('close', () => {
        console.log(chalk.yellow(`[LaunchMonitor] socket closed`));
        this.sockets.launchMonitor = null;
      });
      // set the active LM socket
      this.sockets.launchMonitor = socket;
      // connect to the GSPro Connect API
      this.connectGSPro();
    });

    this.server.listen(this.serverConfig.port, '0.0.0.0', () => {
      console.log(chalk.green(`[LaunchMonitor] server running at ${ipv4()}:${this.serverConfig.port}`));
    });
  }

  // launchMonitorConnected() {
  //   console.log(chalk.green('[LaunchMonitor] ✅ Launch monitor connected'));
  //   this.connectGSPro();
  // }

  connectGSPro() {
    console.log(chalk.blue('[GSPro] Connecting to open API'));
    this.sockets.gsPro = new net.Socket();
    this.sockets.gsPro.connect(this.clientConfig.port, this.clientConfig.ip_address);

    this.sockets.gsPro.setTimeout(this.clientConfig.timeout);
    this.sockets.gsPro.write('');

    this.sockets.gsPro.on('timeout', () => {
      console.log('[gspro] Unable to connect to GSPro');
      this.disconnectGSPro();
    });

    this.sockets.gsPro.on('connect', () => this.gsProConnected());

    this.sockets.gsPro.on('error', (e) => {
      if (e.code === 'ECONNREFUSED') {
        console.error('Connection refused. Do you have the GSPro Connect window open?');
      } else {
        console.error('error with gspro socket', e);
        this.disconnectGSPro();
      }
    });
  }

  gsProConnected() {
    console.log(chalk.blue('[GSPro] ✅ Connected'));
    this.sockets.gsPro.setEncoding('UTF8');
    this.sockets.gsPro.setTimeout(0);

    this.sockets.gsPro.on('close', (hadError) => {
      console.log(chalk.red('[GSPro] connection closed.  Had error: ', hadError));
    });

    if (this.sockets.launchMonitor) {
      // let them talk to each other
      this.sockets.gsPro.pipe(this.sockets.launchMonitor);
      this.sockets.launchMonitor.pipe(this.sockets.gsPro);
    }

    this.sockets.gsPro.on('data', (data) => {
      const dataObj = JSON.parse(data);
      console.log(chalk.blue(`[GSPro] ${JSON.stringify(dataObj, null, 1)}`));
      this.emit('gsproData', dataObj);
    });
  }

  disconnectGSPro() {
    this.sockets.gsPro.destroy();
    this.sockets.gsPro = null;
  }

  disconnectLaunchMonitor() {
    this.sockets.launchMonitor.destroy();
    this.sockets.launchMonitor = null;
  }

}

// // TCP proxy server
// const serverConfig = {
//   port: 1337
// };

// // ip of PC running GSPro
// const config = {
//   timeout: 5000,
//   ip_address: '192.168.1.134',
//   port: 921,
// };

// let r10Socket;
// let gsproSocket;


// console.log(`GSPro Connect Proxy`);
// console.log();

// const server = net.createServer((socket) => {
//   console.log(chalk.green('[LaunchMonitor] ✅ Launch monitor connected'));
//   // is this needed to ping?
//   socket.write('');
//   socket.on('data', (data) => {
//     const dataObj = JSON.parse(data);
//     console.log(chalk.grey(`[LaunchMonitor] ${JSON.stringify(dataObj, null, 1)}`));
//     // if (gsproSocket) {
//     //   gsproSocket.write(data);
//     // }
//   });
//   socket.on('error', (error) => {
//     console.log(chalk.red('[LaunchMonitor] socket error', error));
//     disconnectR10();
//   });
//   socket.on('close', () => {
//     console.log(chalk.yellow(`[LaunchMonitor] socket closed`));
//     r10Socket = null;
//   });
//   r10Socket = socket;
//   connectGSPro();
// });

// server.listen(serverConfig.port, '0.0.0.0', () => {

//   console.log(chalk.green(`[LaunchMonitor] server running at ${ipv4()}:${serverConfig.port}`));
// });

// function disconnectR10() {
//   r10Socket.destroy();
//   r10Socket = null;
// }
