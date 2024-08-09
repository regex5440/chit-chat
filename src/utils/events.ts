const RTCReconnectEvent = new Event("webrtc_call_reconnect");
const RTCEndEvent = new Event("webrtc_call_end");
const RTCRemoteDescription = new Event("webrtc_remote_description_received");
const RTCIceReceived = new Event("webrtc_ice_candidate_received");

export { RTCReconnectEvent, RTCEndEvent, RTCRemoteDescription, RTCIceReceived };
