import { registerSheet, SheetDefinition } from "react-native-actions-sheet";
import UserSentMediaSheet from "@/components/UserSentMediaSheet";
import MakeItPublicSheet from "./MakeItPublicSheet";
import ContactSyncSheet from "./ContactSyncSheet";
import UserLogin from "@/components/UserLogin";

registerSheet("user-sent-media-sheet", UserSentMediaSheet);
registerSheet("user-make-it-public-sheet", MakeItPublicSheet);
registerSheet("contact-sync-sheet", ContactSyncSheet);

declare module "react-native-actions-sheet" {
  interface Sheets {
    "user-sent-media-sheet": SheetDefinition<{
      payload: {
        verificationId: string;
      };
    }>;
    "user-make-it-public-sheet": SheetDefinition<{
      payload: {
        userId: string;
        matchId: string;
      };
    }>;
    "contact-sync-sheet": SheetDefinition<{}>;
    "location-user-list": SheetDefinition<{
      payload: {
        taskId: string;
      };
    }>;
  }
}
