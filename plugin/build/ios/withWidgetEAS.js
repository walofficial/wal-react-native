"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withWidgetEAS = void 0;
const withWidgetEAS = (config, options) => {
    var _a;
    config.extra = config.extra || {};
    config.extra.eas = config.extra.eas || {};
    config.extra.eas.build = config.extra.eas.build || {};
    config.extra.eas.build.experimental =
        config.extra.eas.build.experimental || {};
    config.extra.eas.build.experimental.ios =
        config.extra.eas.build.experimental.ios || {};
    config.extra.eas.build.experimental.ios.appExtensions =
        config.extra.eas.build.experimental.ios.appExtensions || [];
    const widget = config.extra.eas.build.experimental.ios.appExtensions.find((extension) => extension.targetName === "widget");
    if (widget) {
        throw new Error(`[withWidget] Found existing widget extension in app.json at config.extra.eas.build.experimental.ios.appExtensions. Please remove it and try again.`);
    }
    const bundleIdentifier = ((_a = config.ios) === null || _a === void 0 ? void 0 : _a.bundleIdentifier) || "";
    if (!bundleIdentifier) {
        throw new Error(`[withWidget] Unable to find bundleIdentifier in app.json at config.ios.bundleIdentifier. Please add it and try again.`);
    }
    config.extra.eas.build.experimental.ios.appExtensions = [
        ...config.extra.eas.build.experimental.ios.appExtensions,
        {
            targetName: "widget",
            bundleIdentifier: `${bundleIdentifier}.widget`,
        },
    ];
    return config;
};
exports.withWidgetEAS = withWidgetEAS;
