$ErrorActionPreference = 'Stop'
$portableNode = Join-Path $PSScriptRoot '.local-runtime/node-v24.14.0-win-x64/node.exe'
$realityNode = if (Test-Path -LiteralPath $portableNode) { $portableNode } else { (Get-Command node -ErrorAction Stop).Source }
Push-Location $PSScriptRoot
try {
  & $realityNode 'node_modules/vite/bin/vite.js' --host 127.0.0.1 --port 4173 --open '/'
} finally {
  Pop-Location
}
