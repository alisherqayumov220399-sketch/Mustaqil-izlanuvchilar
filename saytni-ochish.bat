@echo off
chcp 65001 > nul
echo ========================================================
echo        Ilm+ tizimi (Mustaqil izlanuvchilar)
echo    Markaziy Baza va Real Server ishga tushirilmoqda...
echo ========================================================
echo.
echo Brauzer ochilmoqda: http://localhost:5000
start http://localhost:5000
npm start
pause
