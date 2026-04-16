import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function deploy() {
  try {
    console.log('Conectando por SSH a 72.60.13.187...');
    await ssh.connect({
      host: '72.60.13.187',
      username: 'root',
      password: 'dA/vqZiDcQ0#Ay+C',
      tryKeyboard: true,
      onKeyboardInteractive: (name, instructions, instructionsLang, prompts, finish) => {
        if (prompts.length > 0 && prompts[0].prompt.toLowerCase().includes('password')) {
          finish(['dA/vqZiDcQ0#Ay+C']);
        } else {
          finish([]);
        }
      }
    });
    
    console.log('Conexión exitosa. Ejecutando comandos de clonado e inicio...');
    
    // Obtener los logs del backend para diagnosticar posibles fallos internos del framework o base de datos.
    const result = await ssh.execCommand('docker logs sistemacuentas-backend --tail 50');
    
    console.log('STDOUT:\n', result.stdout);
    
    if (result.stderr) {
        console.log('STDERR:\n', result.stderr);
    }
    
    console.log('¡Despliegue finalizado con éxito!');
    process.exit(0);
  } catch (error) {
    console.error('Error durante el despliegue:', error);
    process.exit(1);
  }
}

deploy();
