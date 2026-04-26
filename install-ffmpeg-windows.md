# تثبيت FFmpeg على Windows

## الطريقة الأولى: تحميل مباشر
1. اذهب إلى: https://ffmpeg.org/download.html
2. اختر "Windows" 
3. حمل النسخة المناسبة (64-bit)
4. فك الضغط في مجلد مثل `C:\ffmpeg`
5. أضف `C:\ffmpeg\bin` إلى PATH

## الطريقة الثانية: باستخدام Chocolatey
```powershell
# تثبيت Chocolatey أولاً (إذا لم يكن مثبت)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# تثبيت FFmpeg
choco install ffmpeg
```

## الطريقة الثالثة: باستخدام Scoop
```powershell
# تثبيت Scoop أولاً (إذا لم يكن مثبت)
iwr -useb get.scoop.sh | iex

# تثبيت FFmpeg
scoop install ffmpeg
```

## التحقق من التثبيت
```bash
ffmpeg -version
```