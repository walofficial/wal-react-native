import WALCore
import XCTest

final class TokensTests: XCTestCase {
    func testThemeColorsMatchReactNativeTheme() {
        // lib/theme.tsx
        XCTAssertEqual(Tokens.Colors.background.light, "#efefef")
        XCTAssertEqual(Tokens.Colors.background.dark, "#000000")
        XCTAssertEqual(Tokens.Colors.accent.light, "#FF2D55")
        XCTAssertEqual(Tokens.Colors.accent.dark, "#FF375F")
        XCTAssertEqual(Tokens.Colors.primary.resolved(dark: true), "#004cb0")
        XCTAssertEqual(Tokens.Colors.border.dark, "rgba(110,118,125,0.3)")
        XCTAssertEqual(Tokens.Colors.feedItemSecondaryText.light, "#71767B")
        XCTAssertEqual(Tokens.Colors.cardBackground.dark, "#141414")
    }

    func testColorSchemeDefaultsToDark() {
        XCTAssertEqual(Tokens.ColorScheme.source, "system")
        XCTAssertEqual(Tokens.ColorScheme.fallback, "dark")
    }

    func testSpacingRadiusAndFontScales() {
        XCTAssertEqual([Tokens.Spacing.xs, Tokens.Spacing.sm, Tokens.Spacing.md, Tokens.Spacing.lg, Tokens.Spacing.xl], [4, 8, 16, 24, 32])
        XCTAssertEqual([Tokens.Radius.sm, Tokens.Radius.md, Tokens.Radius.lg, Tokens.Radius.full], [4, 8, 16, 9999])
        XCTAssertEqual([Tokens.FontSize.xs, Tokens.FontSize.xxl], [12, 24])
        XCTAssertEqual(Tokens.LegacyFontSize.huge, 36)
    }

    func testSheetSnapPointsMatchGorhomConfig() {
        XCTAssertEqual(Tokens.Sheets.login, [45])
        XCTAssertEqual(Tokens.Sheets.contactSync, [85])
        XCTAssertEqual(Tokens.Sheets.factCheck, [70])
        XCTAssertEqual(Tokens.Sheets.newsSources, [50])
        XCTAssertEqual(Tokens.Sheets.photos, [25])
        XCTAssertEqual(Tokens.Sheets.bioEditor, [45])
        XCTAssertEqual(Tokens.Sheets.profilePhotoEdit, [25])
    }

    func testFactualityThresholds() {
        XCTAssertEqual(Tokens.Factuality.Thresholds.truth, 0.75)
        XCTAssertEqual(Tokens.Factuality.Thresholds.needsContext, 0.5)
        XCTAssertEqual(Tokens.Factuality.Circle.renderThreshold, 0.7)
    }

    func testMetricsThatDriveBehaviour() {
        XCTAssertEqual(Tokens.Metrics.feedPageSize, 10)
        XCTAssertEqual(Tokens.Metrics.chatPageSize, 15)
        XCTAssertEqual(Tokens.Metrics.otpDigits, 6)
        XCTAssertEqual(Tokens.Metrics.otpResendSeconds, 10)
        XCTAssertEqual(Tokens.Metrics.heartbeatMs, 25000)
        XCTAssertEqual(Tokens.Metrics.recordingMaxMs, 30000)
        XCTAssertEqual(Tokens.Metrics.tabIconFocusedScale, 1.15)
    }

    func testEveryColorIsListedInAll() {
        XCTAssertGreaterThan(Tokens.Colors.all.count, 100)
        XCTAssertEqual(Tokens.Colors.all["background"], Tokens.Colors.background)
    }
}

final class RoutesTests: XCTestCase {
    func testEveryRouteHasADescriptor() {
        for id in RouteID.allCases {
            XCTAssertNotNil(Routes.descriptors[id], "missing descriptor for \(id)")
            XCTAssertEqual(Routes.descriptors[id]?.id, id)
        }
        XCTAssertEqual(RouteID.allCases.count, 26)
    }

    func testTabsMirrorExpoTabsLayout() {
        XCTAssertEqual(Routes.tabs.map(\.id), [.home, .chatList, .user])
        XCTAssertEqual(Routes.tabs.map(\.iconFocused), ["location", "chatbubble", "person-circle"])
        XCTAssertEqual(Routes.tabs.map(\.iconUnfocused), ["location-outline", "chatbubble-outline", "person-circle"])
        XCTAssertEqual(Routes.tabs.map(\.focusedScale), [1.15, 1.0, 1.15])
        XCTAssertEqual(Routes.tabs.map(\.tabPressResetsStack), [false, false, true])
    }

    func testPresentationsMatchReactNativeScreens() {
        XCTAssertEqual(Routes.descriptors[.createPost]?.presentation, .modal)
        XCTAssertEqual(Routes.descriptors[.createPost]?.animationDurationMs, 200)
        XCTAssertEqual(Routes.descriptors[.locations]?.presentation, .formSheet)
        XCTAssertEqual(Routes.descriptors[.locations]?.animationDurationMs, 350)
        XCTAssertEqual(Routes.descriptors[.feed]?.presentation, .fade)
        XCTAssertEqual(Routes.descriptors[.signIn]?.presentation, .fade)
        XCTAssertEqual(Routes.descriptors[.register]?.headerLogoutOnBack, true)
        XCTAssertEqual(Routes.descriptors[.chatRoom]?.stack, .chat)
        XCTAssertEqual(Routes.descriptors[.livestream]?.isOutOfScope, true)
        XCTAssertEqual(Routes.descriptors[.createSpace]?.outOfScope, "livekit")
    }

    func testRouteParamsSerialiseLikeExpoRouterParams() {
        XCTAssertEqual(Route.feed(feedId: "f1").params, ["feedId": "f1"])
        XCTAssertEqual(Route.verification(verificationId: "v1").params, ["verificationId": "v1"])
        XCTAssertEqual(Route.verification(verificationId: "v1", focusComment: true).params, ["verificationId": "v1", "focusComment": "true"])
        XCTAssertEqual(Route.chatList.params, [:])
        XCTAssertEqual(Route.record(chatMode: true, roomId: "r1").id, .record)
        XCTAssertEqual(Route.record(chatMode: true, roomId: "r1").params, ["chatMode": "true", "roomId": "r1"])
        XCTAssertEqual(Route.feed(feedId: "f1").descriptor.rnPath, "/[feedId]")
    }

    func testPushRoutingOrderMatchesHandleNotificationNavigation() {
        XCTAssertEqual(Routes.pushRouting.map(\.type), ["poke", "new_message", "*", "verification_like", "friend_request_sent"])
        XCTAssertEqual(Routes.pushRouting.map(\.route), [.verification, .chatRoom, .feed, .status, .chatList])
    }

    func testDeepLinks() {
        XCTAssertEqual(Routes.deepLinkScheme, "wal")
        XCTAssertEqual(Routes.associatedDomain, "wal.ge")
        XCTAssertEqual(Routes.deepLinkPatterns.map(\.match), ["/status/{verificationId}", "/links/{username}"])
    }
}

final class L10nTests: XCTestCase {
    func testBundlesLoadForEverySupportedLocale() {
        let l10n = L10n()
        XCTAssertEqual(l10n.supportedLocales, ["en", "fr", "ka"])
        XCTAssertGreaterThanOrEqual(l10n.keys(for: "en").count, 240)
        XCTAssertGreaterThanOrEqual(l10n.keys(for: "ka").count, 240)
        XCTAssertGreaterThan(l10n.keys(for: "fr").count, 30)
        XCTAssertEqual(l10n.keys(for: "en").count, L10nKey.allCases.count)
    }

    func testTranslationLookupAndFallback() {
        let l10n = L10n()
        XCTAssertEqual(l10n.locale, "en")
        XCTAssertEqual(l10n.t(.settingsAccount), "Account")
        l10n.setLocale("ka")
        XCTAssertEqual(l10n.locale, "ka")
        XCTAssertNotEqual(l10n.t(.settingsAccount), "Account")
        // `common.fact_check` is missing in ka.json; i18n-js enableFallback resolves it from en.
        XCTAssertFalse(l10n.hasTranslation("common.fact_check", locale: "ka"))
        XCTAssertEqual(l10n.t("common.fact_check"), L10n().t("common.fact_check"))
        XCTAssertEqual(l10n.t("does.not.exist"), "[missing \"does.not.exist\" translation]")
    }

    func testUnsupportedLocaleIsIgnored() {
        let l10n = L10n()
        l10n.setLocale("de")
        XCTAssertEqual(l10n.locale, "en")
        XCTAssertEqual(L10n.resolveDeviceLocale(languageCode: "ka"), "ka")
        XCTAssertEqual(L10n.resolveDeviceLocale(languageCode: "de"), "en")
        XCTAssertEqual(L10n.resolveDeviceLocale(languageCode: nil), "en")
    }

    func testInterpolation() {
        let l10n = L10n()
        XCTAssertEqual(l10n.t(.commonWaitSeconds, ["timer": 7]), "Wait 7 seconds")
        XCTAssertEqual(l10n.t(.commonConfirmBlockUser, ["username": "nika"]), "Are you sure you want to block nika?")
    }

    func testRegionAndLanguageMapping() {
        XCTAssertEqual(LocaleMapping.region(for: "ka"), "georgia")
        XCTAssertEqual(LocaleMapping.region(for: "fr"), "france")
        XCTAssertEqual(LocaleMapping.region(for: "xx"), "united_states")
        XCTAssertEqual(LocaleMapping.language(for: "ka"), "georgian")
        XCTAssertEqual(LocaleMapping.language(for: "xx"), "english")
    }
}
