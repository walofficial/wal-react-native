import { registerGlobals } from "@livekit/react-native";
import { isWeb } from "./platform";

if (!isWeb) {
  registerGlobals();
}
