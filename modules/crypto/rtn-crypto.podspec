require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name            = "rtn-crypto"
  s.version         = package["version"]
  s.summary         = package["description"]
  s.description     = package["description"]
  s.homepage        = package["homepage"] || "https://github.com"
  s.license         = package["license"]
  s.platforms       = { :ios => "13.0" }
  s.author          = package["author"] || "WAL"
  s.source          = { :git => ".", :tag => "#{s.version}" }
  
  s.source_files    = "ios/**/*.{h,m,mm,swift}", "shared/**/*.{h,cpp}"
  s.header_dir      = "RTNCrypto"
  s.preserve_paths  = "vendor/**/*", "scripts/**/*"
  
  # Vendored libsodium - built by scripts/setup-libsodium.sh
  # Check if xcframework exists, otherwise use static library
  vendor_dir = File.join(__dir__, "vendor")
  xcframework_path = File.join(vendor_dir, "libsodium.xcframework")
  static_lib_path = File.join(vendor_dir, "lib", "libsodium.a")
  
  if File.exist?(xcframework_path)
    s.vendored_frameworks = "vendor/libsodium.xcframework"
  elsif File.exist?(static_lib_path)
    s.vendored_libraries = "vendor/lib/libsodium.a"
  end
  
  s.pod_target_xcconfig = {
    "HEADER_SEARCH_PATHS" => "$(inherited) \"${PODS_TARGET_SRCROOT}/vendor/include\"",
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++17"
  }
  
  install_modules_dependencies(s)
end
