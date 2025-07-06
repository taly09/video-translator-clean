# הוספת נתיבי CUDA + cuDNN ל-PATH (לבדיקה זמנית בהרצה הזו)
$env:PATH = "C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.8\bin;C:\Program Files\NVIDIA\cuDNN\bin;" + $env:PATH

# בדפסת ה-PATH כדי לוודא
Write-Host "`nPATH:" $env:PATH "`n"

# בדיקה עם פייתון
$pythonPath = ".\.venv\Scripts\python.exe"
if (-Not (Test-Path $pythonPath)) {
    Write-Host "❌ לא נמצא python.exe ב-venv"
    exit 1
}

# הכנת קוד פייתון בקובץ זמני כדי להימנע מבעיות גרשיים
$pythonCode = @"
import torch
print('PyTorch version:', torch.__version__)
print('CUDA version:', torch.version.cuda)
print('cuDNN version:', torch.backends.cudnn.version())
print('CUDA available:', torch.cuda.is_available())
torch.zeros(1).cuda()
print('✅ CUDA works!')
"@

# יצירת קובץ זמני
$tempFile = [System.IO.Path]::GetTempFileName() + ".py"
Set-Content -Path $tempFile -Value $pythonCode -Encoding UTF8

# הרצת הקובץ
& $pythonPath $tempFile

# מחיקת הקובץ הזמני
Remove-Item $tempFile
