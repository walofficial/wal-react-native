import { useAtom } from "jotai";
import { verificationStatusState } from "./atom";
import { createPortal } from "react-dom";

export default function VerificationStatusView() {
  const [currentStatus, setCurrentStatus] = useAtom(verificationStatusState);

  if (!currentStatus) {
    return null;
  }
  return createPortal(
    <div className="flex items-center justify-center bg-[#efefef] dark:bg-black fixed top-0 h-full w-full z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full border-4 border-gray-300 dark:border-gray-300 border-t-transparent dark:border-t-transparent h-16 w-16" />
        <p className="text-primary-foreground text-xl font-medium text-black dark:text-white">
          {currentStatus.text}
        </p>
      </div>
    </div>,
    document.body
  );
}
