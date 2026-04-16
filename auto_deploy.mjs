import { Client } from 'ssh2';

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec('docker restart sistemacuentas-backend && docker logs sistemacuentas-backend --tail 50', (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
      process.exit(0);
    }).on('data', (data) => {
      console.log('STDOUT:\n' + data);
    }).stderr.on('data', (data) => {
      console.log('STDERR:\n' + data);
    });
  });
}).on('keyboard-interactive', (name, instructions, instructionsLang, prompts, finish) => {
  console.log('Keyboard Interactive envocado:', prompts);
  finish(['dA/vqZiDcQ0#Ay+C']);
}).on('banner', (message) => {
  console.log('Banner:', message);
}).on('error', (err) => {
  console.error('Connection Error:', err);
  process.exit(1);
}).connect({
  host: '72.60.13.187',
  port: 22,
  username: 'root',
  password: 'dA/vqZiDcQ0#Ay+C',
  tryKeyboard: true,
  debug: console.log
});
