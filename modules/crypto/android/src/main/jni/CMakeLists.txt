cmake_minimum_required(VERSION 3.13)

# Define the library name here.
project(rtncrypto)

# This file includes all the necessary to let you build your React Native application
include(${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake)

# Define where the additional source code lives
file(GLOB SHARED_SOURCES "../../../../../shared/*.cpp")
target_sources(${CMAKE_PROJECT_NAME} PRIVATE ${SHARED_SOURCES})

# Define where CMake can find the additional header files
target_include_directories(${CMAKE_PROJECT_NAME} PUBLIC ../../../../../shared)

