"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withWidgetIos = void 0;
const withWidgetXCode_1 = require("./withWidgetXCode");
const withWidgetEAS_1 = require("./withWidgetEAS");
const withWidgetIos = (config, options) => {
    config = (0, withWidgetXCode_1.withWidgetXCode)(config, options);
    config = (0, withWidgetEAS_1.withWidgetEAS)(config, options);
    return config;
};
exports.withWidgetIos = withWidgetIos;
