"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withWidgetSourceCodes = void 0;
/* eslint-disable @typescript-eslint/no-non-null-assertion */
const config_plugins_1 = require("@expo/config-plugins");
const fs_extra_1 = __importDefault(require("fs-extra"));
const glob_1 = __importDefault(require("glob"));
const path_1 = __importDefault(require("path"));
const withWidgetSourceCodes = config => {
    return (0, config_plugins_1.withDangerousMod)(config, [
        "android",
        async (newConfig) => {
            var _a;
            const projectRoot = newConfig.modRequest.projectRoot;
            const platformRoot = newConfig.modRequest.platformProjectRoot;
            const widgetDir = path_1.default.join(projectRoot, "widget");
            copyResourceFiles(widgetDir, platformRoot);
            const packageName = (_a = config.android) === null || _a === void 0 ? void 0 : _a.package;
            prepareSourceCodes(widgetDir, platformRoot, packageName);
            return newConfig;
        },
    ]);
};
exports.withWidgetSourceCodes = withWidgetSourceCodes;
function copyResourceFiles(widgetSourceDir, platformRoot) {
    const source = path_1.default.join(widgetSourceDir, "android", "src", "main", "res");
    const resDest = path_1.default.join(platformRoot, "app", "src", "main", "res");
    console.log(`copy the res files from ${source} to ${resDest}`);
    fs_extra_1.default.copySync(source, resDest);
}
async function prepareSourceCodes(widgetSourceDir, platformRoot, packageName) {
    const packageDirPath = packageName.replace(/\./g, "/");
    const source = path_1.default.join(widgetSourceDir, `android/src/main/java/package_name`);
    const dest = path_1.default.join(platformRoot, "app/src/main/java", packageDirPath);
    console.log(`copy the kotlin codes from ${source} to ${dest}`);
    fs_extra_1.default.copySync(source, dest);
    const files = glob_1.default.sync(`${dest}/*.kt`);
    for (const file of files) {
        const content = fs_extra_1.default.readFileSync(file, "utf8");
        const newContent = content.replace(/^package .*\s/, `package ${packageName}\n`);
        fs_extra_1.default.writeFileSync(file, newContent);
    }
}
