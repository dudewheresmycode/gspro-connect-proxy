import GSProProxy from '../index.js';

const clientConfig = {
  // uncomment to change defaults
  // timeout: 5000,
  // ip_address: '127.0.0.1',
  // port: 921
};

const serverConfig = {
  // uncomment to change defaults
  // port: 1337
};

const proxy = new GSProProxy({ serverConfig, clientConfig });

proxy.on('launchData', (data) => {
  console.log('Received data from the launch monitor', data);
});

proxy.on('gsproData', (data) => {
  console.log('Received data from GSPro', data);
});
