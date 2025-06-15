import { formatDistanceToNow, parseISO, differenceInDays } from "date-fns";
import { ka } from "date-fns/locale";

export const formatRelativeTime = (date: string | Date | number) => {
  if (!date) return new Date().toLocaleDateString("ka-GE")
  const parsedDate = typeof date === "string" ? parseISO(date) : new Date(date);
  const now = new Date();

  const diffInDays = Math.floor(
    (now.getTime() - parsedDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffInDays >= 2) {
    // Format as full date for posts older than 2 days
    const isCurrentYear = parsedDate.getFullYear() === now.getFullYear();
    return parsedDate.toLocaleDateString("ka-GE", {
      year: isCurrentYear ? undefined : "numeric",
      month: "short",
      day: "numeric",
    });
  }
  // Use relative time for recent posts
  return formatDistanceToNow(parsedDate, {
    addSuffix: true,
    locale: ka,
  })
    .replace("წუთზე ნაკლები ხნის წინ", "წთ")
    .replace("დაახლოებით ", "");
};
