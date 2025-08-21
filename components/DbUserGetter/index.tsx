import MessageConnectionWrapper from "../Chat/socket/MessageConnectionWrapper";
import { useAtomValue } from "jotai";
import { publicKeyState } from "@/lib/state/auth";
import { isWeb } from "@/lib/platform";
import { useNotificationHandler } from "./useNotficationHandler";

function DbUserGetter({ children }: { children: React.ReactNode }) {
  const publicKey = useAtomValue(publicKeyState);
  useNotificationHandler();

  if (isWeb) {
    return children;
  }
  return (
    <MessageConnectionWrapper publicKey={publicKey}>
      {children}
    </MessageConnectionWrapper>
  );
}

export default DbUserGetter;
