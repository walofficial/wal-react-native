declare module '@livekit/react-native' {
  // Components / classes
  export const LiveKitRoom: any;
  export const VideoTrack: any;
  export const AudioSession: any;
  export const LogLevel: any;
  export const setLogLevel: any;
  export const registerGlobals: any;

  // Hooks / functions (typed as any to unblock TS until upstream types resolve)
  export function useLocalParticipant(...args: any[]): any;
  export function useParticipantInfo(...args: any[]): any;
  export function useParticipants(...args: any[]): any;
  export function useLocalParticipantPermissions(...args: any[]): any;
  export function useConnectionState(...args: any[]): any;
  export function useRoom(...args: any[]): any;
  export function useRoomContext(...args: any[]): any;
  export function useTracks(...args: any[]): any;
  export function useRemoteParticipants(...args: any[]): any;
  export function useParticipantTracks(...args: any[]): any;
  export function useIOSAudioManagement(...args: any[]): any;
  export function useTrackTranscription(...args: any[]): any;
  export function useEnsureTrackRef(...args: any[]): any;
  export function useIsMuted(...args: any[]): any;
  export function useIsSpeaking(...args: any[]): any;
  export function isTrackReference(...args: any[]): any;

  // Types used in imports
  export type TrackReferenceOrPlaceholder = any;
}
