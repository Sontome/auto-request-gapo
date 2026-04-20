$path = "C:\auto-request-gapo"

# Tạo folder
New-Item -ItemType Directory -Force -Path $path | Out-Null

# Download zip repo
$zip = "$env:TEMP\repo.zip"
Invoke-WebRequest "https://github.com/Sontome/auto-request-gapo/archive/refs/heads/main.zip" -OutFile $zip

# Giải nén
Expand-Archive $zip -DestinationPath $env:TEMP -Force

# Copy vào C:
Copy-Item "$env:TEMP\auto-request-gapo-main\*" $path -Recurse -Force

cd $path

Set-Clipboard "chrome://extensions/"

Add-Type -AssemblyName PresentationFramework
[System.Windows.MessageBox]::Show(
"Xong rồi .`nĐã copy chrome://extensions/",
"Installer",
"OK",
"Information"
)

Start-Process "chrome.exe" "chrome://extensions/"
