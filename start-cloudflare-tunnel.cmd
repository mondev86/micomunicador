@echo off
setlocal

REM Inicia un tunel publico a tu frontend de Vite en el puerto 5173.
cloudflared tunnel --url http://localhost:5173

endlocal
