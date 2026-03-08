const { spawn } = require('child_process');
const localtunnel = require('localtunnel');

const PORT = process.env.PORT || 5000;

async function startTunnel() {
  console.log('⏳ Waiting for server to start...');
  
  // Wait a bit for server to start
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  try {
    console.log('🌐 Creating public tunnel...');
    const tunnel = await localtunnel({ port: PORT });
    
    console.log('\n✅ BACKEND IS NOW PUBLICLY ACCESSIBLE!\n');
    console.log('🔗 Public URL: ' + tunnel.url);
    console.log('\n📱 Use this URL in your Flutter apps:\n');
    console.log('   ' + tunnel.url);
    console.log('\n⚠️  Note: The URL changes each time you restart!\n');
    
    tunnel.on('close', () => {
      console.log('⚠️ Tunnel closed');
    });
  } catch (err) {
    console.error('❌ Failed to create tunnel:', err.message);
  }
}

// Start the backend server
console.log('🚀 Starting Food Delivery Backend...\n');
const server = spawn('node', ['server.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

server.on('error', (err) => {
  console.error('❌ Failed to start server:', err);
});

// Start tunnel after a short delay
startTunnel();
