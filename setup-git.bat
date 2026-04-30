@echo off
REM ===================================================================
REM   setup-git.bat — Khoi tao git repo + push len GitHub
REM   Double-click file nay o folder "Giao ban" de chay
REM ===================================================================

setlocal
chcp 65001 >nul

cd /d "%~dp0"
echo.
echo === Folder hien tai: %CD%
echo.

REM 1. Kiem tra git
where git >nul 2>nul
if errorlevel 1 (
    echo [LOI] Khong tim thay 'git'. Cai Git for Windows tu: https://git-scm.com/download/win
    pause
    exit /b 1
)

REM 2. Cau hinh user neu chua co
git config --global user.email >nul 2>nul
if errorlevel 1 (
    git config --global user.email "ducphamhn01@gmail.com"
    git config --global user.name "Bonito"
    echo [OK] Da cau hinh git user
)

REM 3. Init repo neu chua co
if not exist ".git" (
    echo === Khoi tao git repo...
    git init -b main
) else (
    echo === Repo da co .git roi, bo qua init
)

REM 4. Add + commit
echo === Them tat ca file...
git add -A

REM Kiem tra co thay doi khong
git diff --cached --quiet
if errorlevel 1 (
    echo === Commit...
    git commit -m "v2.3: lien ket cheo KT-VT-HS + modal 360 + global search"
) else (
    echo === Khong co thay doi de commit
)

REM 5. Add remote neu chua co
git remote get-url origin >nul 2>nul
if errorlevel 1 (
    echo === Them remote origin...
    git remote add origin https://github.com/Bonitohd1/Giao-ban-.git
) else (
    echo === Remote origin da co roi
    git remote set-url origin https://github.com/Bonitohd1/Giao-ban-.git
)

REM 6. Push
echo.
echo === Bay gio se push len GitHub.
echo === Neu Windows hien hop dang nhap GitHub: dang nhap tai khoan Bonitohd1.
echo === Neu hien yeu cau username/password tren terminal:
echo ===   - Username: Bonitohd1
echo ===   - Password: dan Personal Access Token (KHONG phai mat khau GitHub)
echo ===   - Tao token tai: https://github.com/settings/tokens (chon scope 'repo')
echo.

git push -u origin main

if errorlevel 1 (
    echo.
    echo [LOI] Push that bai. Mot so nguyen nhan thuong gap:
    echo   1) Repo tren GitHub chua tao - vao https://github.com/new tao repo ten "Giao-ban-"
    echo   2) Sai mat khau - dung Personal Access Token, KHONG dung mat khau GitHub
    echo   3) Repo da co commit khac - chay: git pull origin main --rebase  roi  git push
    pause
    exit /b 1
)

echo.
echo === XONG. Code da len GitHub: https://github.com/Bonitohd1/Giao-ban-
pause
endlocal
