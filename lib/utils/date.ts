import { formatDistanceToNow, parseISO } from "date-fns";
import { ka, enUS } from "date-fns/locale";
import { getCurrentLocale, t } from "../i18n";

export const formatRelativeTime = (date: string | Date | number) => {
  if (!date) {
    const locale = getCurrentLocale();
    return new Date().toLocaleDateString(locale === "ka" ? "ka-GE" : "en-US");
  }

  const parsedDate = typeof date === "string" ? parseISO(date) : new Date(date);
  const now = new Date();
  const locale = getCurrentLocale();

  const diffInDays = Math.floor(
    (now.getTime() - parsedDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffInDays >= 2) {
    // Format as full date for posts older than 2 days
    const isCurrentYear = parsedDate.getFullYear() === now.getFullYear();
    return parsedDate.toLocaleDateString(locale === "ka" ? "ka-GE" : "en-US", {
      year: isCurrentYear ? undefined : "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // Use relative time for recent posts
  const formattedTime = formatDistanceToNow(parsedDate, {
    addSuffix: true,
    locale: locale === "ka" ? ka : enUS,
  });

  if (locale === "ka") {
    return formattedTime
      .replace("წუთზე ნაკლები ხნის წინ", "წთ")
      .replace("დაახლოებით ", "");
  }

  return formattedTime
    .replace("less than a minute ago", "now")
    .replace("about ", "");
};
