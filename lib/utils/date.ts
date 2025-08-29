import { formatDistanceToNow, parseISO } from "date-fns";
import { ka, enUS } from "date-fns/locale";
import { getCurrentLocale, t } from "../i18n";

export const formatRelativeTime = (date: string | Date | number) => {
  if (!date) {
    return "";
  }

  const parsedDate = typeof date === "string" ? parseISO(date) : new Date(date);
  const now = new Date();
  const locale = getCurrentLocale();

  const diffInMinutes = Math.floor((now.getTime() - parsedDate.getTime()) / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);

  if (locale === "ka") {
    if (diffInMinutes < 1) return "ახალი";
    if (diffInMinutes < 60) return `${diffInMinutes}წთ`;
    if (diffInHours < 24) return `${diffInHours}სთ`;
    if (diffInDays < 7) return `${diffInDays} დღის წინ`;
    if (diffInWeeks < 5) return `${diffInWeeks} კვირის წინ`;
  } else {
    if (diffInMinutes < 1) return "now";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInDays < 7) return `${diffInDays}d`;
    if (diffInWeeks < 5) return `${diffInWeeks}w`;
  }

  // For older posts show date
  return parsedDate.toLocaleDateString(locale === "ka" ? "ka-GE" : "en-US", {
    month: "long",
    day: "numeric"
  });
};
