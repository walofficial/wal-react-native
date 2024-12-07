import { useEffect, forwardRef, useImperativeHandle } from "react";
import { useOtpVerify } from "react-native-otp-verify";

export interface AndroidAutoSMSRef {
  start: () => void;
  stop: () => void;
}

const AndroidAutoSMS = forwardRef<
  AndroidAutoSMSRef,
  { onOTPReceived: (otp: string) => void }
>(({ onOTPReceived }, ref) => {
  const { hash, otp, message, timeoutError, stopListener, startListener } =
    useOtpVerify({ numberOfDigits: 6 });

  useImperativeHandle(ref, () => ({
    start: () => {
      startListener();
    },
    stop: () => {
      stopListener();
    },
  }));

  useEffect(() => {
    if (otp) {
      onOTPReceived(otp);
    }
  }, [otp]);

  return null;
});

export default AndroidAutoSMS;
