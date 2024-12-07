"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withWidgetAndroid = void 0;
const withWidgetAppBuildGradle_1 = require("./withWidgetAppBuildGradle");
const withWidgetManifest_1 = require("./withWidgetManifest");
const withWidgetProjectBuildGradle_1 = require("./withWidgetProjectBuildGradle");
const withWidgetSourceCodes_1 = require("./withWidgetSourceCodes");
/**
 * @param config
 * @returns
 */
const withWidgetAndroid = config => {
    config = (0, withWidgetManifest_1.withWidgetManifest)(config);
    config = (0, withWidgetProjectBuildGradle_1.withWidgetProjectBuildGradle)(config);
    config = (0, withWidgetAppBuildGradle_1.withWidgetAppBuildGradle)(config);
    config = (0, withWidgetSourceCodes_1.withWidgetSourceCodes)(config);
    return config;
};
exports.withWidgetAndroid = withWidgetAndroid;
