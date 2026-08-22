const { exec } = require('child_process')
const path = require('path')

function runInstall() {
  const backendDir = path.join(__dirname, '..', 'backend')
  console.log('Installing @aws-sdk/client-bedrock-runtime in', backendDir)
  const cmd = `npm install @aws-sdk/client-bedrock-runtime`;
  const p = exec(cmd, { cwd: backendDir, stdio: 'inherit' })
  p.stdout?.pipe(process.stdout)
  p.stderr?.pipe(process.stderr)
  p.on('close', (code) => {
    if (code === 0) console.log('Installed Bedrock client')
    else console.error('npm install exited with', code)
  })
}

if (require.main === module) runInstall();

module.exports = { runInstall }
