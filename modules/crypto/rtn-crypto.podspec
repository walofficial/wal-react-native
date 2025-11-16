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
  
  install_modules_dependencies(s)
end

