cmake_minimum_required(VERSION 3.13)

project(rtncrypto)

set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 17)

# ============================================================================
# Find React Native packages (provided by react-native gradle plugin)
# ============================================================================

find_package(ReactAndroid REQUIRED CONFIG)
find_package(fbjni REQUIRED CONFIG)

# ============================================================================
# libsodium setup - using FetchContent to build from source
# Official libsodium CMake wrapper from robinlinden/libsodium-cmake
# ============================================================================

include(FetchContent)

# Fetch the CMake wrapper for libsodium (pinned to a specific commit for stability)
FetchContent_Declare(
    libsodium
    GIT_REPOSITORY https://github.com/robinlinden/libsodium-cmake.git
    GIT_TAG        260622e5b69bce9b955603a98e46354125a932a4  # Latest with libsodium 1.0.20 support
    GIT_SHALLOW    TRUE
    GIT_PROGRESS   TRUE
)

# Configure libsodium build options
set(SODIUM_DISABLE_TESTS ON CACHE BOOL "Disable libsodium tests" FORCE)
set(SODIUM_DISABLE_PIE ON CACHE BOOL "Disable PIE for Android compatibility" FORCE)

# Make libsodium available
FetchContent_MakeAvailable(libsodium)

message(STATUS "libsodium configured for Android (${ANDROID_ABI})")

# ============================================================================
# Create the shared library
# ============================================================================

# Collect source files
file(GLOB LIBRTNCRYPTO_SOURCES
    "${CMAKE_CURRENT_SOURCE_DIR}/../../../../../shared/*.cpp"
    "${CMAKE_CURRENT_SOURCE_DIR}/*.cpp"
)

# Create shared library
add_library(${CMAKE_PROJECT_NAME} SHARED ${LIBRTNCRYPTO_SOURCES})

# Include directories
target_include_directories(${CMAKE_PROJECT_NAME} PUBLIC
    "${CMAKE_CURRENT_SOURCE_DIR}/../../../../../shared"
)

# Link libraries - React Native 0.76+ uses merged reactnative library
target_link_libraries(${CMAKE_PROJECT_NAME}
    fbjni::fbjni
    ReactAndroid::jsi
    ReactAndroid::reactnative
    android
    log
    sodium
)
