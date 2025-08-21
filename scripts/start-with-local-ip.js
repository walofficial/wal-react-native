#!/usr/bin/env node

const { execSync, spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

// Get the local IP address using ipconfig getifaddr en0
let localIp;
try {
  localIp = execSync("ipconfig getifaddr en0").toString().trim();
  console.log(`✅ Found local IP address: ${localIp}`);
} catch (error) {
  console.warn(
    "⚠️ Could not determine local IP address from en0. Falling back to localhost."
  );
  localIp = "localhost";
}

// Set the API URL with the local IP and port 5500
process.env.EXPO_PUBLIC_API_URL = `http://${localIp}:5500/`;
console.log(
  `🚀 Setting EXPO_PUBLIC_API_URL to: ${process.env.EXPO_PUBLIC_API_URL}`
);

// Create a temporary .env.local file to persist the environment variable for the Expo process
const envPath = path.join(process.cwd(), ".env.local");
const envContent = `EXPO_PUBLIC_API_URL=${process.env.EXPO_PUBLIC_API_URL}\n`;

// Write to .env.local file
fs.writeFileSync(envPath, envContent, { flag: "w" });
console.log(`📝 Created temporary .env.local file with dynamic IP address`);

// Start Expo
console.log("🚀 Starting Expo development server...");
const expoProcess = spawn("expo", ["start"], {
  stdio: "inherit",
  env: process.env,
  shell: true,
});

// Handle process exit
expoProcess.on("close", (code) => {
  // Clean up the temporary .env.local file
  if (fs.existsSync(envPath)) {
    fs.unlinkSync(envPath);
    console.log("🧹 Removed temporary .env.local file");
  }

  process.exit(code);
});

// Handle termination signals
["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, () => {
    expoProcess.kill(signal);

    // Clean up the temporary .env.local file
    if (fs.existsSync(envPath)) {
      fs.unlinkSync(envPath);
      console.log("🧹 Removed temporary .env.local file");
    }

    process.exit(0);
  });
});
