class DateComponentsSerializer {

  static func serializedDateComponents(_ dateComponents: DateComponents) -> [String: Any] {
    var serializedComponents: [String: Any] = [:]
    serializedComponents["calendar"] = dateComponents.calendar?.identifier ?? NSNull()
    serializedComponents["timeZone"] = dateComponents.timeZone?.identifier ?? NSNull()
    serializedComponents["isLeapMonth"] = dateComponents.isLeapMonth ?? false
    // NOTE:
    // Do not reference `DateComponents.isRepeatedDay` directly because it may not exist
    // in the iOS SDK shipped with the current Xcode, causing a compile-time error.
    // Instead, attempt a runtime lookup via the bridged `NSDateComponents`.
    if #available(iOS 18.0, *) {
      if let isRepeatedDay = (dateComponents as NSDateComponents).value(forKey: "isRepeatedDay") as? Bool {
        serializedComponents["isRepeatedDay"] = isRepeatedDay
      }
    }


    let map = calendarUnitsConversionMap()
    for (calendarUnit, keyName) in map {
      if let unitValue = dateComponents.value(for: calendarUnit) {
        serializedComponents[keyName] = unitValue
      }
    }

    return serializedComponents
  }

  static func calendarUnitsConversionMap() -> [Calendar.Component: String] {
    return [
      .era: "era",
      .year: "year",
      .month: "month",
      .day: "day",
      .hour: "hour",
      .minute: "minute",
      .second: "second",
      .weekday: "weekday",
      .weekdayOrdinal: "weekdayOrdinal",
      .quarter: "quarter",
      .weekOfMonth: "weekOfMonth",
      .weekOfYear: "weekOfYear",
      .yearForWeekOfYear: "yearForWeekOfYear",
      .nanosecond: "nanosecond"
    ]
  }

}
