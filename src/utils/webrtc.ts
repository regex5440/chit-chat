type IceCandidateReceiver = (candidates: RTCIceCandidate[]) => void;
type StreamHandler = (stream: MediaStream) => void;
type ConnectionStateChangeHandler = (state: RTCPeerConnectionState) => void;

export default class WebRTCConnection {
  #peerConnection!: RTCPeerConnection;
  #iceCandidates: RTCIceCandidate[] = [];
  #remoteMediaStream: MediaStream = new MediaStream();

  #candidateProvider!: IceCandidateReceiver;
  #remoteStreamProvider!: StreamHandler;
  #stateChangeHandler!: ConnectionStateChangeHandler;

  //Debounce timeout
  #debounceTimeout!: number;
  constructor(configuration: RTCConfiguration) {
    this.#peerConnection = new RTCPeerConnection(configuration);
    this.#setupListener();
  }
  #debouncedCandidateProvider() {
    if (this.#debounceTimeout) {
      clearTimeout(this.#debounceTimeout);
    }
    this.#debounceTimeout = setTimeout(() => {
      if (this.#iceCandidates.length > 0) {
        this.#candidateProvider(this.#iceCandidates);
        this.#iceCandidates = [];
      } else {
        throw new Error("Error generating ICE candidates");
      }
    }, 250) as any as number;
  }
  #setupListener() {
    this.#peerConnection.onconnectionstatechange = (e) => {
      this.#stateChangeHandler?.(this.#peerConnection.connectionState);
    };
    this.#peerConnection.onicecandidate = (e) => {
      if (e.candidate !== null) {
        this.#iceCandidates.push(e.candidate);
        this.#debouncedCandidateProvider();
      }
    };
    this.#peerConnection.ontrack = (e) => {
      this.#remoteMediaStream.addTrack(e.track);
      if (this.#remoteMediaStream.getTracks().length === 2) {
        this.#remoteStreamProvider?.(this.#remoteMediaStream);
      }
    };
  }
  get remoteStream() {
    return this.#remoteMediaStream;
  }
  set onConnectionStateChange(stateHandlerFunction: ConnectionStateChangeHandler) {
    this.#stateChangeHandler = stateHandlerFunction;
  }
  /**
   * Sets the handler function for the 'onRemoteStreamAdded' event.
   * @param {StreamHandler} streamHandler - The handler function that will be called when a remote stream is added. This function should take a MediaStream object as its parameter and does not return anything.
   */
  set onRemoteStreamAdded(streamHandler: StreamHandler) {
    this.#remoteStreamProvider = streamHandler;
  }
  set onIceCandidate(candidateReceiver: IceCandidateReceiver) {
    this.#candidateProvider = candidateReceiver;
  }
  set setRemoteDescription(description: RTCSessionDescriptionInit) {
    this.#peerConnection.setRemoteDescription(description);
  }
  set setRemoteIceCandidates(candidates: RTCIceCandidate[]) {
    candidates.forEach((candidate) => {
      this.#peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    });
  }
  set setStream(stream: MediaStream) {
    stream.getTracks().forEach((track) => {
      this.#peerConnection.addTrack(track, stream);
    });
  }
  set setNewTrack(track: MediaStreamTrack) {
    this.#peerConnection.getSenders().forEach((s) => {
      if (s.track?.kind === track.kind) {
        s.replaceTrack(track);
        console.log("Track replaced", track);
      }
    });
  }
  async initiateCall(): Promise<RTCSessionDescriptionInit> {
    const offer = await this.#peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    this.#peerConnection.setLocalDescription(offer);
    return offer;
  }
  async answerCall(): Promise<RTCSessionDescriptionInit> {
    const answer = await this.#peerConnection.createAnswer();
    this.#peerConnection.setLocalDescription(answer);
    return answer;
  }
  terminate(): void {
    this.#peerConnection.close();
  }
}
