$path = "C:\auto-request-gapo"

New-Item -ItemType Directory -Force -Path $path | Out-Null

$zip = "$env:TEMP\repo.zip"

Invoke-WebRequest `
"https://github.com/Sontome/auto-request-gapo/archive/refs/heads/main.zip" `
-UseBasicParsing `
-OutFile $zip

Expand-Archive $zip -DestinationPath $env:TEMP -Force

Copy-Item "$env:TEMP\auto-request-gapo-main\*" $path -Recurse -Force

cd $path

Set-Clipboard "chrome://extensions/"

Add-Type -AssemblyName PresentationFramework
[System.Windows.MessageBox]::Show(
"Xong rồi đại ca 😎",
"Installer",
"OK",
"Information"
)

Start-Process "chrome.exe" "chrome://extensions/"
