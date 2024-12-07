"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withWidgetAppBuildGradle = void 0;
const config_plugins_1 = require("@expo/config-plugins");
/**
 * Add "apply plugin: kotlin-android" to app build.gradle
 * @param config
 * @returns
 */
const withWidgetAppBuildGradle = config => {
    return (0, config_plugins_1.withAppBuildGradle)(config, async (newConfig) => {
        const buildGradle = newConfig.modResults.contents;
        const search = /(apply plugin: "com\.android\.application"\n)/gm;
        const replace = `$1apply plugin: "kotlin-android"\n`;
        const newBuildGradle = buildGradle.replace(search, replace);
        newConfig.modResults.contents = newBuildGradle;
        return newConfig;
    });
};
exports.withWidgetAppBuildGradle = withWidgetAppBuildGradle;
