const RTCElement: HTMLDivElement & {
  remoteSDP?: any;
  iceCandidate?: [];
  CALL_RESPONSE?: boolean | undefined;
  ReconnectionOffer?: "received";
} = document.createElement("div");

export default RTCElement;
