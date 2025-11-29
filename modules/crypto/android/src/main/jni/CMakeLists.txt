cmake_minimum_required(VERSION 3.13)

# Define the library name here.
project(rtncrypto)

# This file includes all the necessary to let you build your React Native application
include(${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake)

include(FetchContent)

# Fetch libsodium
FetchContent_Declare(
  libsodium
  GIT_REPOSITORY https://github.com/AnyTalk/libsodium-cmake.git
  GIT_TAG master
)

set(SODIUM_DISABLE_TESTS ON CACHE BOOL "" FORCE)
set(SODIUM_MINIMAL ON CACHE BOOL "" FORCE)
FetchContent_MakeAvailable(libsodium)

# Define where the additional source code lives
file(GLOB SHARED_SOURCES "../../../../../shared/*.cpp")
target_sources(${CMAKE_PROJECT_NAME} PRIVATE ${SHARED_SOURCES})

# Define where CMake can find the additional header files
target_include_directories(${CMAKE_PROJECT_NAME} PUBLIC ../../../../../shared)

# Link libsodium
target_link_libraries(${CMAKE_PROJECT_NAME} PRIVATE sodium)
