@echo off

REM Kiem tra xem Bun da duoc cai dat hay chua
bun -v >nul 2>&1

IF ERRORLEVEL 1 (
    echo Bun chua duoc cai dat. Bat dau cai dat...
    powershell -Command "irm https://bun.sh/install.ps1 | iex"
) ELSE (
    bun upgrade
)

REM Cai dat dependencies
bun install

IF ERRORLEVEL 1 (
    echo Co loi xay ra khi cai dat dependencies. Vui long kiem tra lai.
    pause
    exit /b 1
)

REM Build du an
bun run build

IF ERRORLEVEL 1 (
    echo Co loi xay ra khi build du an. Vui long kiem tra lai.
    pause
    exit /b 1
)

REM Chay ung dung
bun start

IF ERRORLEVEL 1 (
    echo Co loi xay ra khi chay ung dung. Vui long kiem tra lai.
    pause
    exit /b 1
)