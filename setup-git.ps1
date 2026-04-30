# setup-git.ps1 — Khởi tạo git + push lên GitHub
# Chạy: chuột phải file này → Run with PowerShell
# (Hoặc trong PowerShell: cd "C:\Users\KCCShopVn\Desktop\Giao ban"; .\setup-git.ps1)

$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

Write-Host "`n=== Folder: $PSScriptRoot`n" -ForegroundColor Cyan

# 1. Kiểm tra git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "[LỖI] Không tìm thấy git. Cài Git for Windows: https://git-scm.com/download/win" -ForegroundColor Red
    Read-Host "Bấm Enter để thoát"
    exit 1
}

# 2. Config user
try { git config --global user.email | Out-Null } catch {
    git config --global user.email "ducphamhn01@gmail.com"
    git config --global user.name "Bonito"
    Write-Host "[OK] Đã cấu hình git user" -ForegroundColor Green
}

# 3. Init nếu chưa có
if (-not (Test-Path ".git")) {
    Write-Host "=== Khởi tạo git repo..." -ForegroundColor Cyan
    git init -b main
} else {
    Write-Host "=== Repo đã có rồi, bỏ qua init" -ForegroundColor Yellow
}

# 4. Add + commit
Write-Host "=== Thêm tất cả file..." -ForegroundColor Cyan
git add -A

git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "=== Commit..." -ForegroundColor Cyan
    git commit -m "v2.3: lien ket cheo KT-VT-HS + modal 360 + global search"
} else {
    Write-Host "=== Không có thay đổi để commit" -ForegroundColor Yellow
}

# 5. Remote
$remoteUrl = "https://github.com/Bonitohd1/Giao-ban-.git"
try {
    git remote get-url origin | Out-Null
    git remote set-url origin $remoteUrl
    Write-Host "=== Remote origin đã update" -ForegroundColor Yellow
} catch {
    git remote add origin $remoteUrl
    Write-Host "=== Đã thêm remote origin" -ForegroundColor Green
}

# 6. Push
Write-Host "`n=== Push lên GitHub..." -ForegroundColor Cyan
Write-Host "    Nếu Windows hỏi đăng nhập GitHub: chọn Bonitohd1" -ForegroundColor Gray
Write-Host "    Nếu hỏi password trong terminal: dùng Personal Access Token" -ForegroundColor Gray
Write-Host "    (tạo token tại https://github.com/settings/tokens, scope 'repo')`n" -ForegroundColor Gray

git push -u origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[LỖI] Push thất bại. Cách xử lý:" -ForegroundColor Red
    Write-Host "  1) Tạo repo 'Giao-ban-' trên https://github.com/new (nếu chưa có)"
    Write-Host "  2) Dùng Personal Access Token thay password"
    Write-Host "  3) Nếu repo có commit khác: git pull origin main --rebase; git push"
    Read-Host "`nBấm Enter để thoát"
    exit 1
}

Write-Host "`n=== ✅ XONG. Code đã lên GitHub:" -ForegroundColor Green
Write-Host "    https://github.com/Bonitohd1/Giao-ban-`n" -ForegroundColor Green
Read-Host "Bấm Enter để thoát"
