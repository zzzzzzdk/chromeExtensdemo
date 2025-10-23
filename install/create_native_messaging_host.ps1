# Set registry path
$registryPath = "HKLM:\Software\Google\Chrome\NativeMessagingHosts\com.yisa.nativeapp"

# Set JSON config file path
$jsonFilePath = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\NativeMessagingHosts\com.yisa.nativeapp.json"

# Set native app path
$nativeAppPath = "E:\Study\Chrome Extens\NooBox-master\install\一键联查.exe"

# Create registry key if not exists
if (-Not (Test-Path $registryPath)) {
    New-Item -Path $registryPath -Force
}

# Write registry value
Set-ItemProperty -Path $registryPath -Name "Path" -Value $jsonFilePath -Type String

# Generate JSON config content
$jsonContent = @"
{
  "name": "com.yisa.nativeapp",
  "description": "Yisa Native App",
  "path": "$nativeAppPath",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://oacmjpblobgdfpcndnlembgkbhpahffa/"
  ]
}
"@

# Ensure directory exists
New-Item -ItemType Directory -Force -Path (Split-Path $jsonFilePath)

# Write JSON config file
Set-Content -Path $jsonFilePath -Value $jsonContent

# Output success message
Write-Output "Installation completed successfully!"
