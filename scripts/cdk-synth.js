const { spawn } = require('child_process')
const path = require('path')

function runSynth() {
  const dir = path.join(__dirname, '..', 'infra', 'cdk')
  console.log('Running `cdk synth` in', dir)
  const p = spawn('npx', ['cdk', 'synth'], { cwd: dir, stdio: 'inherit', shell: true })
  p.on('close', (code) => {
    if (code === 0) console.log('cdk synth completed')
    else console.error('cdk synth failed with code', code)
  })
}

if (require.main === module) runSynth()

module.exports = { runSynth }
