param(
    [Parameter(Mandatory = $true)][ValidateSet('Protect', 'Restore')][string]$Mode,
    [Parameter(Mandatory = $true)][string]$Source,
    [Parameter(Mandatory = $true)][string]$Destination
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Security
$sourcePath = (Resolve-Path -LiteralPath $Source).Path
$destinationPath = [System.IO.Path]::GetFullPath($Destination)
if (Test-Path -LiteralPath $destinationPath) { throw 'Destination already exists; refusing to overwrite.' }
$scope = [System.Security.Cryptography.DataProtectionScope]::CurrentUser
$inputBytes = [System.IO.File]::ReadAllBytes($sourcePath)
if ($Mode -eq 'Protect') {
    $outputBytes = [System.Security.Cryptography.ProtectedData]::Protect($inputBytes, $null, $scope)
    $verifiedBytes = [System.Security.Cryptography.ProtectedData]::Unprotect($outputBytes, $null, $scope)
} else {
    $outputBytes = [System.Security.Cryptography.ProtectedData]::Unprotect($inputBytes, $null, $scope)
    $verifiedBytes = $outputBytes
}
if ($Mode -eq 'Protect') {
    $sha = [System.Security.Cryptography.SHA256]::Create()
    try {
        if ([Convert]::ToBase64String($sha.ComputeHash($inputBytes)) -ne [Convert]::ToBase64String($sha.ComputeHash($verifiedBytes))) {
            throw 'Encryption verification failed.'
        }
    } finally { $sha.Dispose() }
}
$parent = [System.IO.Path]::GetDirectoryName($destinationPath)
[System.IO.Directory]::CreateDirectory($parent) | Out-Null
[System.IO.File]::WriteAllBytes($destinationPath, $outputBytes)
Write-Output ('Verified ' + $Mode + ': ' + [System.IO.Path]::GetFileName($sourcePath))
# Originals are deliberately retained to preserve the user's recovery options.
