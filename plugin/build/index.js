"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const withWidgetAndroid_1 = require("./android/withWidgetAndroid");
const withWidgetIos_1 = require("./ios/withWidgetIos");
const withAppConfigs = (config, options) => {
    config = (0, withWidgetAndroid_1.withWidgetAndroid)(config);
    config = (0, withWidgetIos_1.withWidgetIos)(config, options);
    return config;
};
exports.default = withAppConfigs;
