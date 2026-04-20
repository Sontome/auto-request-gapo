$path = "C:\auto-request-gapo"

# 1. Clone repo
if (!(Test-Path $path)) {
    git clone https://github.com/Sontome/auto-request-gapo.git $path
} else {
    Write-Host "Folder tồn tại rồi 😏"
}

cd $path

# 2. Copy link extensions cho user
$extLink = "chrome://extensions/"
Set-Clipboard $extLink

# 3. Popup hướng dẫn
Add-Type -AssemblyName PresentationFramework

[System.Windows.MessageBox]::Show(
"Đã cài xong auto-request-gapo 😎 Bấm OK để mở Chrome Extensions`n`n👉 Nhớ bật 'Developer mode' nha ",
"Installer",
"OK",
"Information"
)

# 4. Mở Chrome Extensions
Start-Process "chrome.exe" "chrome://extensions/"

Write-Host "Xong hết rồi đại ca 😎"
