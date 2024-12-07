export default function MessageItemText({ text }: { text: string }) {
  return (
    <span className="bg-gray-200 dark:bg-gray-800 p-3 rounded-md max-w-xs dark:text-white">
      {text}
    </span>
  );
}
