@echo off
REM =========================================================================
REM  Smart Reply AI - Native Windows C++ Desktop Build Script
REM =========================================================================

echo [SmartReply] Building Native Windows C++ Application...

set OUTPUT_DIR=bin
if not exist %OUTPUT_DIR% mkdir %OUTPUT_DIR%

REM 1. Try MSVC cl.exe if available in Developer Command Prompt
where cl.exe >nul 2>nul
if %errorlevel% equ 0 (
    echo [SmartReply] Found MSVC (cl.exe). Compiling release executable...
    cl.exe /nologo /O2 /std:c++17 /EHsc /Iinclude src\main.cpp src\clipboard_hook.cpp src\heuristic_engine.cpp src\cloud_client.cpp src\tray_manager.cpp src\floating_window.cpp /link user32.lib gdi32.lib shell32.lib wininet.lib /SUBSYSTEM:WINDOWS /OUT:%OUTPUT_DIR%\SmartReplyAI.exe
    if %errorlevel% equ 0 (
        echo [SmartReply] SUCCESS: Built %OUTPUT_DIR%\SmartReplyAI.exe
        exit /b 0
    )
)

REM 2. Try MinGW / GCC g++.exe if available
where g++.exe >nul 2>nul
if %errorlevel% equ 0 (
    echo [SmartReply] Found GCC (g++.exe). Compiling release executable...
    g++ -std=c++17 -O3 -mwindows -Iinclude src/main.cpp src/clipboard_hook.cpp src/heuristic_engine.cpp src/cloud_client.cpp src/tray_manager.cpp src/floating_window.cpp -luser32 -lgdi32 -lshell32 -lwininet -o %OUTPUT_DIR%\SmartReplyAI.exe
    if %errorlevel% equ 0 (
        echo [SmartReply] SUCCESS: Built %OUTPUT_DIR%\SmartReplyAI.exe
        exit /b 0
    )
)

REM 3. Try Clang++ if available
where clang++.exe >nul 2>nul
if %errorlevel% equ 0 (
    echo [SmartReply] Found Clang++ (clang++.exe). Compiling release executable...
    clang++ -std=c++17 -O3 -mwindows -Iinclude src/main.cpp src/clipboard_hook.cpp src/heuristic_engine.cpp src/cloud_client.cpp src/tray_manager.cpp src/floating_window.cpp -luser32 -lgdi32 -lshell32 -lwininet -o %OUTPUT_DIR%\SmartReplyAI.exe
    if %errorlevel% equ 0 (
        echo [SmartReply] SUCCESS: Built %OUTPUT_DIR%\SmartReplyAI.exe
        exit /b 0
    )
)

echo [SmartReply] Notice: No C++ compiler found directly in PATH.
echo [SmartReply] To compile:
echo 1. Open 'Developer Command Prompt for VS' and run 'build.bat'
echo 2. Or run: cmake -B build ^&^& cmake --build build --config Release
exit /b 1
