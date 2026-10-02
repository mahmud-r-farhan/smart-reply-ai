cmake_minimum_required(VERSION 3.16)
project(SmartReplyNative VERSION 1.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include_directories(include)

set(SOURCES
    src/main.cpp
    src/clipboard_hook.cpp
    src/heuristic_engine.cpp
    src/cloud_client.cpp
    src/json_utils.cpp
    src/tray_manager.cpp
    src/floating_window.cpp
)

# Win32 GUI Executable (subsystem:windows)
add_executable(SmartReplyNative WIN32 ${SOURCES})

# Windows system libraries
target_link_libraries(SmartReplyNative PRIVATE
    user32
    gdi32
    shell32
    wininet
)

set_target_properties(SmartReplyNative PROPERTIES
    OUTPUT_NAME "SmartReplyAI"
)

# ============================================================================
#  Host-runnable unit tests for the JSON helpers (no Win32 dependencies).
#  Built on non-Windows hosts so the parser can be exercised in CI/Linux:
#    cmake -B build-tests -DCMAKE_BUILD_TYPE=Release && cmake --build build-tests
#    ./build-tests/json_utils_test
# ============================================================================
if(NOT WIN32)
    enable_testing()
    add_executable(json_utils_test tests/json_utils_test.cpp src/json_utils.cpp)
    target_include_directories(json_utils_test PRIVATE include)
    add_test(NAME json_utils COMMAND json_utils_test)
endif()
