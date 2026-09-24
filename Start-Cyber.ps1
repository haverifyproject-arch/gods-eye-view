$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$cyberNodeDirectory = Join-Path $PSScriptRoot '.local-runtime\node-v24.14.0-win-x64'
if (Test-Path -LiteralPath (Join-Path $cyberNodeDirectory 'node.exe')) {
  $env:Path = "$cyberNodeDirectory;$env:Path"
}
Write-Host 'Cyber Situation Room: http://127.0.0.1:4173/cyber.html'
& npm.cmd run dev -- --host 127.0.0.1
