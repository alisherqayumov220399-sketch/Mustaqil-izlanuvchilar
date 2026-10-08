@echo off
chcp 65001 > nul
echo ========================================================
echo        Internetga joylash uchun loyihani yig'ish (build)
echo ========================================================
echo.
npm run build
echo.
echo Tayyor! Loyihaning 'dist' papkasi internetga joylash uchun tayyorlandi.
echo Uni Vercel, Netlify yoki GitHub Pages orqali bir zumda yuklashingiz mumkin.
echo.
pause
