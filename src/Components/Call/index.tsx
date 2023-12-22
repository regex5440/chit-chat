import { ArrowBottomLeftIcon, CameraIcon, CheckIcon, Cross2Icon } from "@radix-ui/react-icons";
import "./caller.sass";
import { MicrophoneIcon } from "../../assets/icons";
import { ChangeEventHandler, ReactElement, useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { enableAudio, enableVideo, minimizeComponent, resetCallState, setCallStatus, setDuration } from "../../library/redux/reducers";
import { getCallStatus, getCallUIDetails, getConnectedUser, getConnectedUserProfile, getPeerData, getUserData, getUserStreamControl } from "../../library/redux/selectors";
import { endCall, sendAnswer, sendCallInitiator, sendCallInitiatorResponse, sendCandidate, sendOffer } from "../../library/socket.io/socket";
import { convertToDuration, useDebounce } from "../../utils";
import React from "react";
import { CALL_STATUS } from "../../utils/enums";
import RTCElement from "../../Context/rtc_eventElement";
import { RTCEndEvent, RTCIceReceived, RTCRemoteDescription } from "../../utils/events";
import { CircularLoader } from "hd-ui";

const Caller = () => {
  const [userStream, setUserStream] = useState(new MediaStream());
  const [remoteStream, setRemoteStream] = useState(new MediaStream());
  const [loading, setLoading] = useState(false);
  const [errorForUI, setErrorForUI] = useState<string | ReactElement>("");
  const streamingArea = useRef<HTMLVideoElement>(null);
  const videoPreviewer = useRef<HTMLVideoElement>(null);
  const callStatusContainer = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const mediaControls = useSelector(getUserStreamControl);
  const callUIDetails = useSelector(getCallUIDetails);
  const currentCallStatus = useSelector(getCallStatus);
  // const peerData = useSelector(getPeerData);
  const connectedUser = useSelector(getConnectedUser);
  const connectedUserProfile = useSelector(getConnectedUserProfile);
  const myProfile = useSelector(getUserData);
  const peerConnection = useRef<RTCPeerConnection>();
  const candidates = useRef<RTCIceCandidate[]>([]);
  const sendCandidatesDebounced = useDebounce(() => {
    sendCandidate(connectedUser.chatId, candidates.current);
  }, 700);
  const durationInterval = useRef<number | null>(null);
  const duration = useRef(0);
  const endCallIn = useRef(60); //Seconds
  const endCallInterval = useRef<null | number>(null);
  const runDuration = useCallback(() => {
    durationInterval.current = setInterval(() => {
      duration.current++;
      dispatch(setDuration(duration.current));
      if (callStatusContainer.current) {
        callStatusContainer.current.textContent = convertToDuration(duration.current);
      }
    }, 1000);
  }, []);
  const stopDuration = useCallback((reset = false) => {
    durationInterval.current && clearInterval(durationInterval.current);
    durationInterval.current = null;
    if (reset) {
      duration.current = 0;
    }
  }, []);
  const setRTCEventListeners = useCallback(() => {
    if (!peerConnection.current) return;
    peerConnection.current.ontrack = (e) => {
      console.log("Received", e.track, e.streams);
      if (e.track) {
        remoteStream.addTrack(e.track);
      }
    };
    peerConnection.current.onicecandidate = (e) => {
      console.log("IceCandidateCreated");
      if (e.candidate === null) return;
      candidates.current.push(e.candidate);
      sendCandidatesDebounced();
    };
    peerConnection.current.onicecandidateerror = (e) => {
      console.log("CandidateError", e);
    };
    peerConnection.current.onnegotiationneeded = (e) => {
      console.log("NegotiationNeed", e);
    };
    peerConnection.current.addEventListener(
      "connectionstatechange",
      (event) => {
        switch (peerConnection.current?.connectionState) {
          case "new":
          case "connecting":
            setLoading(true);
            console.log("STATE: Connecting…");
            break;
          case "connected":
            runDuration();
            stopNoPickerTimer();
            dispatch(setCallStatus(CALL_STATUS.CONNECTED));
            setLoading(false);
            RTCElement.CALL_RESPONSE = undefined;
            RTCElement.remoteSDP = undefined;
            RTCElement.iceCandidate = undefined;
            console.log("STATE: Connected");
            break;
          case "disconnected":
            stopDuration(true);
            setLoading(false);
            endCallHandler(true);
            console.log("STATE: Disconnected");
            break;
          case "closed":
            console.log("STATE: Offline");
            setLoading(false);
            break;
          case "failed":
            console.log("STATE: Error");
            setLoading(false);
            stopDuration(true);
            stopNoPickerTimer();
            endCallHandler(event);
            break;
          default:
            console.log("STATE: Unknown");
            break;
        }
        console.log(event);
      },
      false
    );
  }, []);
  const closeConnection = () => {
    RTCElement.iceCandidate = undefined;
    RTCElement.remoteSDP = undefined;
    RTCElement.CALL_RESPONSE = false;
    peerConnection.current?.close();
  };
  const pauseDuration = () => {
    durationInterval.current && clearInterval(durationInterval.current);
  };
  const startNoPickupTimer = () => {
    pauseDuration();
    endCallInterval.current = setInterval(() => {
      endCallIn.current--;
      if (endCallIn.current === 0) {
        endCallHandler(true);
      }
    }, 1000);
  };
  const stopNoPickerTimer = () => {
    if (endCallInterval.current) {
      clearInterval(endCallInterval.current);
      endCallIn.current = 60;
    }
  };

  async function setupRTC(stream: MediaStream) {
    console.log("Setting new RTC instance");
    closeConnection();
    peerConnection.current = new RTCPeerConnection({
      iceServers: [
        {
          urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
        },
        {
          urls: "turn:openrelay.metered.ca:80",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
      ],
    });
    stream.getTracks().forEach((track) => {
      if (track.kind === "video") {
        track.enabled = mediaControls.videoEnabled;
      }
      peerConnection.current?.addTrack(track, stream);
      console.log("SettingTrack:", track.kind);
    });
    setRTCEventListeners();
    try {
      if (callUIDetails.userInitiated) {
        await sendCallInitiator(connectedUser.chatId, mediaControls.videoEnabled ? "video" : "audio", myProfile.data.id);
        dispatch(setCallStatus(CALL_STATUS.WAITING));
        startCallHandler();
      } else {
        sendCallInitiatorResponse(connectedUser.chatId, connectedUser.userId);
      }
    } catch (e) {
      console.log("ERROR", e);
      dispatch(setCallStatus(CALL_STATUS.NO_RESPONSE));
      endCallHandler(e);
    }
  }
  const setRTCRemoteSDP = () => {
    if (RTCElement.remoteSDP) {
      console.log("2 Received", RTCElement.remoteSDP);
      peerConnection.current?.setRemoteDescription(new RTCSessionDescription(RTCElement.remoteSDP));
      console.log("CALL_STATUS", currentCallStatus);
    }
  };
  const setRTCIceCandidate = () => {
    console.log("3 IceCandidateReceived", RTCElement.iceCandidate);
    if (RTCElement.iceCandidate?.length ?? 0 > 0) {
      RTCElement.iceCandidate?.forEach((candidate: RTCIceCandidate) => {
        peerConnection.current?.addIceCandidate(new RTCIceCandidate(candidate));
      });
    }
  };

  useEffect(() => {
    navigator.mediaDevices
      ?.getUserMedia({
        video: {
          frameRate: {
            min: 30,
            ideal: 45,
            max: 60,
          },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      })
      .then((stream) => {
        if (stream.active && streamingArea.current) {
          console.log("1. Got the user media");
          setUserStream(stream);
          dispatch(setCallStatus(CALL_STATUS.CONNECTING));
          streamingArea.current.srcObject = stream;
          window.addEventListener("offline", startNoPickupTimer);
          RTCElement.addEventListener(RTCEndEvent.type, endCallHandler);
          RTCElement.addEventListener(RTCRemoteDescription.type, setRTCRemoteSDP);
          RTCElement.addEventListener(RTCIceReceived.type, setRTCIceCandidate);
          setupRTC(stream);
        } else {
          endCallHandler(true);
          console.log("Permission Denied");
        }
      })
      .catch((e) => {
        endCallHandler(true);
        setErrorForUI(
          <>
            <h2>Permission Denied!</h2>Please allow camera and microphone access in your browser’s settings.
          </>
        );
        console.log(e);
      });
    return () => {
      window.removeEventListener("offline", startNoPickupTimer);
      RTCElement.removeEventListener(RTCEndEvent.type, endCallHandler);
      RTCElement.removeEventListener(RTCRemoteDescription.type, setRTCRemoteSDP);
      RTCElement.removeEventListener(RTCIceReceived.type, setRTCIceCandidate);

      stopNoPickerTimer();
      durationInterval.current && clearInterval(durationInterval.current);
      duration.current = 0;
    };
  }, [setUserStream]);

  useEffect(() => {
    //Responsible for setting stream to different video elements
    if (streamingArea.current && videoPreviewer.current) {
      if (currentCallStatus === CALL_STATUS.CONNECTED) {
        streamingArea.current.srcObject = remoteStream;
        videoPreviewer.current.srcObject = userStream;
      } else {
        streamingArea.current.srcObject = userStream;
      }
    }
  }, [currentCallStatus, remoteStream, userStream]);

  useEffect(() => {
    // Keep audio/video buttons in sync with track issues and set initialValues
    userStream?.getTracks().forEach((track) => {
      if (track.kind === "audio") {
        track.onmute = () => {
          dispatch(enableAudio(false));
        };
        track.onunmute = () => {
          dispatch(enableAudio(true));
        };
      } else if (track.kind === "video") {
        track.onmute = () => {
          dispatch(enableVideo(false));
        };
        track.onunmute = () => {
          dispatch(enableVideo(true));
        };
      }
    });
    return () => {
      userStream?.getTracks().forEach((track) => {
        track.stop();
      });
    };
  }, [userStream]);

  useEffect(() => {
    // Keep buttons in sync with audio/video
    userStream.getTracks().forEach((track) => {
      if (track.kind === "video") {
        track.enabled = mediaControls.videoEnabled;
      }
      if (track.kind === "audio") {
        track.enabled = mediaControls.audioEnabled;
      }
    });
  }, [userStream, mediaControls]);

  // Options handlers
  const videoOptionHandler: ChangeEventHandler<HTMLInputElement> = (e) => {
    const checked = e.target.checked;
    dispatch(enableVideo(checked));
  };
  const audioOptionHandler: ChangeEventHandler<HTMLInputElement> = (e) => {
    const checked = e.target.checked;
    dispatch(enableAudio(checked));
  };
  function endCallHandler(e: Event | any) {
    //TODO: End call gracefully if rejected or not picker by callee
    closeConnection();
    userStream?.getTracks().forEach((track) => {
      track.stop();
    });
    dispatch(resetCallState(true));
    if (e?.type !== RTCEndEvent.type) {
      endCall(connectedUser.chatId);
    }
    //TODO: Leave a message with call duration and type in chat from caller side
  }
  const answerCallHandler = () => {
    //TODO: better handling of calling answer
    peerConnection.current?.createAnswer().then((value) => {
      peerConnection.current?.setLocalDescription(value);
      sendAnswer(connectedUser.chatId, value);
      console.log("2. Send", value.type);
    });
  };
  const minimizeHandler = () => {
    dispatch(minimizeComponent(true));
  };
  const startCallHandler = () => {
    console.log("Sending offer");
    peerConnection.current?.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true }).then((value) => {
      peerConnection.current?.setLocalDescription(value);
      sendOffer(connectedUser.chatId, value);
      startNoPickupTimer();
      console.log("2. Send", value.type);
    });
  };
  const renderOptions = () => {
    /*
     * //TODO: More options are device based
     *   ie: Camera Switch (preferred for mobile)
     *   ie: Speaker/Headset Switch (preferred for mobile)
     */
    if (callUIDetails.userInitiated || currentCallStatus === CALL_STATUS.CONNECTED) {
      return (
        <div className="option-container call-controls">
          <div className="option">
            <input type="checkbox" id="camera-control" checked={mediaControls.videoEnabled} onChange={videoOptionHandler} />
            <label htmlFor="camera-control">
              <CameraIcon width={24} height={24} />
            </label>
          </div>
          <div className="option" title="End Call" id="end-call" onClick={() => endCallHandler(true)}>
            <span>
              <Cross2Icon width={30} height={30} />
            </span>
          </div>
          <div className="option">
            <input type="checkbox" id="microphone-control" checked={mediaControls.audioEnabled} onChange={audioOptionHandler} />
            <label htmlFor="microphone-control">
              <MicrophoneIcon width="26" height="26" />
            </label>
          </div>
        </div>
      );
    } else if (currentCallStatus === CALL_STATUS.CONNECTING) {
      return (
        <div className="option-container">
          <div className="option" title="Accept Call" onClick={answerCallHandler}>
            <span>
              <CheckIcon width={30} height={30} />
            </span>
          </div>
          <div className="option" title="Reject Call" id="end-call" onClick={() => endCallHandler(true)}>
            <span>
              <Cross2Icon width={30} height={30} />
            </span>
          </div>
        </div>
      );
    }
  };
  const renderConnectionStatus = () => {
    switch (currentCallStatus) {
      case CALL_STATUS.CONNECTING:
        if (callUIDetails.userInitiated) {
          return "Connecting";
        }
        return `Incoming ${mediaControls.videoEnabled ? "video" : "voice"} call`;
      case CALL_STATUS.CONNECTED:
        return "Connected";
      case CALL_STATUS.WAITING:
        return "Ringing";
      case CALL_STATUS.DISCONNECTED:
        return "Call ended";
      case CALL_STATUS.REJECTED:
        return "Call denied";
      case CALL_STATUS.NO_RESPONSE:
        return "No Response";
      default:
        return "";
    }
  };
  return (
    <div className="chit-chat-call">
      {errorForUI ? (
        <div className="calling-error">{errorForUI}</div>
      ) : (
        <>
          {loading && (
            <>
              <div className="chit-chat-call__overlay"></div>
              <div className="chit-chat-call__loading">
                <CircularLoader size={70} riderColor={"var(--icon-stroke)"} />
                <p>Loading...</p>
              </div>
            </>
          )}
          <div className="chit-chat-call__stream-area">
            <video ref={streamingArea} autoPlay muted={currentCallStatus !== CALL_STATUS.CONNECTED} />
          </div>
          <div className="chit-chat-call__option-area" data-visible={true}>
            {renderOptions()}
          </div>
          {currentCallStatus === CALL_STATUS.CONNECTED && (
            <div className="chit-chat-call__user-video">
              <video ref={videoPreviewer} autoPlay muted />
            </div>
          )}

          <div className="chit-chat-call__top-menu">
            <div className="caller-info">
              <div className="caller-name">
                {connectedUserProfile?.firstName} {connectedUserProfile?.lastName}
              </div>
              <div className="call-status" ref={callStatusContainer}>
                {currentCallStatus !== CALL_STATUS.CONNECTED && renderConnectionStatus()}
              </div>
            </div>

            <div className="call-minimize" title="Run in background" onClick={minimizeHandler}>
              <ArrowBottomLeftIcon width={30} height={30} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Caller;
