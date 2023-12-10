import { ArrowBottomLeftIcon, CameraIcon, CheckIcon, Cross2Icon } from "@radix-ui/react-icons";
import "./caller.sass";
import { MicrophoneIcon } from "../../assets/icons";
import { ChangeEventHandler, ReactElement, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { enableAudio, enableVideo, minimizeComponent, resetCallState, setCallStatus, setDuration } from "../../library/redux/reducers";
import { getCallStatus, getCallUIDetails, getConnectedUser, getConnectedUserProfile, getPeerData, getUserData, getUserStreamControl } from "../../library/redux/selectors";
import { endCall, sendAnswer, sendCandidate, sendOffer } from "../../library/socket.io/socket";
import { convertToDuration, useDebounce } from "../../utils";
import React from "react";
import { CALL_STATUS } from "../../utils/enums";

const Caller = () => {
  const [userStream, setUserStream] = useState(new MediaStream());
  const [remoteStream, setRemoteStream] = useState(new MediaStream());
  const streamingArea = useRef<HTMLVideoElement>(null);
  const videoPreviewer = useRef<HTMLVideoElement>(null);
  const callStatusContainer = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const mediaControls = useSelector(getUserStreamControl);
  const callUIDetails = useSelector(getCallUIDetails);
  const currentCallStatus = useSelector(getCallStatus);
  const peerData = useSelector(getPeerData);
  const connectedUser = useSelector(getConnectedUser);
  const connectedUserProfile = useSelector(getConnectedUserProfile);
  const myProfile = useSelector(getUserData);
  const peerConnection = useRef(
    new RTCPeerConnection({
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
    })
  ); //TODO: Created STUN and TURN server of my own
  const candidates = useRef<RTCIceCandidate[]>([]);
  const sendCandidatesDebounced = useDebounce(() => {
    sendCandidate(connectedUser.chatId, candidates.current);
  }, 700);
  const [errorForUI, setErrorForUI] = useState<string | ReactElement>("");
  const durationInterval = useRef<number | null>(null);
  const duration = useRef(0);

  useEffect(() => {
    //TODO: handle permission denied
    //TODO: change video aspect ratio based on device orientation (for one time only)
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
          stream.getTracks().forEach((track) => {
            if (track.kind === "video") {
              track.enabled = mediaControls.videoEnabled;
            }
            peerConnection.current.addTrack(track, stream);
          });
          streamingArea.current.srcObject = stream;
          dispatch(setCallStatus(CALL_STATUS.CONNECTING));
          if (callUIDetails.userInitiated) {
            startCallHandler();
          }
        } else {
          endCallHandler();
          console.log("Permission Denied");
        }
      })
      .catch((e) => {
        endCallHandler();
        setErrorForUI(
          <>
            <h2>Permission Denied!</h2>Please allow camera and microphone access in your browser’s settings.
          </>
        );
        console.log(e);
      });
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
        switch (peerConnection.current.connectionState) {
          case "new":
          case "connecting":
            console.log("STATE: Connecting…");
            break;
          case "connected":
            durationInterval.current = setInterval(() => {
              duration.current++;
              dispatch(setDuration(duration.current));
              if (callStatusContainer.current) {
                callStatusContainer.current.textContent = convertToDuration(duration.current);
              }
            }, 1000);
            dispatch(setCallStatus(CALL_STATUS.CONNECTED));
            console.log("STATE: Connected");
            break;
          case "disconnected":
            dispatch(setCallStatus(CALL_STATUS.DISCONNECTED));
            durationInterval.current && clearInterval(durationInterval.current);
            durationInterval.current = null;
            console.log("STATE: Disconnected");
            break;
          case "closed":
            console.log("STATE: Offline");
            break;
          case "failed":
            console.log("STATE: Error");
            break;
          default:
            console.log("STATE: Unknown");
            break;
        }
        console.log(event);
      },
      false
    );
    return () => {
      peerConnection.current.close();
    };
  }, [setUserStream, sendCandidatesDebounced]);

  useEffect(() => {
    if (streamingArea.current && videoPreviewer.current) {
      if (currentCallStatus === CALL_STATUS.CONNECTED) {
        streamingArea.current.srcObject = remoteStream;
        videoPreviewer.current.srcObject = userStream;

        if (remoteStream) {
          remoteStream.getVideoTracks()[0]?.applyConstraints({ aspectRatio: window.innerWidth / window.innerHeight });
        }
      } else {
        streamingArea.current.srcObject = userStream;
      }
    }
  }, [currentCallStatus, remoteStream, userStream]);

  useEffect(() => {
    // Keep audio/video toggle buttons in sync with track enabled
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
    userStream.getTracks().forEach((track) => {
      if (track.kind === "video") {
        track.enabled = mediaControls.videoEnabled;
      }
      if (track.kind === "audio") {
        track.enabled = mediaControls.audioEnabled;
      }
    });
  }, [userStream, mediaControls]);

  useEffect(() => {
    if (userStream) {
      if (peerData.remoteDescription !== null && !peerConnection.current.remoteDescription) {
        peerConnection.current.setRemoteDescription(new RTCSessionDescription(peerData.remoteDescription));
        console.log("2 Received", peerData.remoteDescription.type);
      }
      if (peerData.iceCandidates !== null) {
        console.log("3 IceCandidateReceived");

        peerData.iceCandidates?.forEach((candidate: RTCIceCandidate) => {
          peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        });
      }
    }
  }, [userStream, peerData]);

  // Options handlers
  const videoOptionHandler: ChangeEventHandler<HTMLInputElement> = (e) => {
    const checked = e.target.checked;
    dispatch(enableVideo(checked));
  };
  const audioOptionHandler: ChangeEventHandler<HTMLInputElement> = (e) => {
    const checked = e.target.checked;
    dispatch(enableAudio(checked));
  };
  const endCallHandler = () => {
    //TODO: End call gracefully and provide option for caller even after call end/not connected/rejected etc.
    userStream?.getTracks().forEach((track) => {
      track.stop();
    });
    peerConnection.current.close();
    dispatch(resetCallState(true));
    endCall(connectedUser.chatId);
    //TODO: Leave a message with call duration and type in chat from caller side
  };
  const answerCallHandler = () => {
    //TODO: better handling of calling answer
    peerConnection.current.createAnswer().then((value) => {
      peerConnection.current.setLocalDescription(value);
      sendAnswer(connectedUser.chatId, value);
      console.log("2. Send", value.type);
    });
  };
  const minimizeHandler = () => {
    dispatch(minimizeComponent(true));
  };
  const startCallHandler = () => {
    peerConnection.current.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true }).then((value) => {
      peerConnection.current.setLocalDescription(value);
      sendOffer(connectedUser.chatId, value, mediaControls.videoEnabled ? "video" : "audio", myProfile.data.id);
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
          <div className="option" title="End Call" id="end-call" onClick={endCallHandler}>
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
    } else if (currentCallStatus !== CALL_STATUS.CONNECTED) {
      return (
        <div className="option-container">
          <div className="option" title="Accept Call" onClick={answerCallHandler}>
            <span>
              <CheckIcon width={30} height={30} />
            </span>
          </div>
          <div className="option" title="Reject Call" id="end-call" onClick={endCallHandler}>
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
