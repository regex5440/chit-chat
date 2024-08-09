import { ArrowBottomLeftIcon, CameraIcon, CheckIcon, Cross2Icon, SpeakerLoudIcon, UpdateIcon } from "@radix-ui/react-icons";
import "./caller.sass";
import { MicrophoneIcon, VideoIcon } from "../../assets/icons";
import { ChangeEventHandler, ReactElement, useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { enableAudio, enableVideo, minimizeComponent, resetCallState, setCallStatus } from "../../library/redux/reducers";
import { getCallStatus, getCallUIDetails, getConnectedUser, getConnectedUserProfile, getDeviceDetails, getPeerData, getUserData, getUserStreamControl } from "../../library/redux/selectors";
import { endCall, sendAnswer, sendCallInitiator, sendCallInitiatorResponse, sendCandidate, sendOffer, sendReconnectInitiator, sendReconnectInitiatorResponse } from "../../library/socket.io/socket";
import React from "react";
import { CALL_STATUS } from "../../utils/enums";
import RTCElement from "../../context/rtc_eventElement";
import { RTCEndEvent, RTCIceReceived, RTCReconnectEvent, RTCRemoteDescription } from "../../utils/events";
import { CircularLoader } from "hd-ui";
import WebRTCConnection from "../../utils/webrtc";
import { convertToDuration, debounce } from "../../utils";

const UserStreamConstraints = {
  video: {
    frameRate: {
      min: 30,
      ideal: 45,
      max: 60,
    },
  },
  audio: true,
};

const Caller = () => {
  const userStream = useRef<MediaStream>(new MediaStream());
  const [loading, setLoading] = useState(false);
  const [errorForUI, setErrorForUI] = useState<string | ReactElement>("");
  const [menuVisible, setMenuVisibility] = useState(true);
  const streamingArea = useRef<HTMLVideoElement>(null);
  const videoPreviewer = useRef<HTMLVideoElement>(null);
  const callStatusContainer = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const mediaControls = useSelector(getUserStreamControl);
  const callUIDetails = useSelector(getCallUIDetails);
  const currentCallStatus = useSelector(getCallStatus);
  const connectedUser = useSelector(getConnectedUser);
  const connectedUserProfile = useSelector(getConnectedUserProfile);
  const userDevice = useSelector(getDeviceDetails);
  const myProfile = useSelector(getUserData);
  const rtcConnection = useRef<WebRTCConnection>();
  const endCallTimeout = useRef<null | number>(null);
  const [callType, switchCallType] = useState<"audio" | "video">(mediaControls.videoEnabled ? "video" : "audio");
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<number>(mediaControls.videoEnabled ? 0 : -1);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<"speaker" | "default">(mediaControls.videoEnabled ? "speaker" : "default");
  const videoInputDevices = useRef<MediaDeviceInfo[]>([]);
  const audioInputDevices = useRef<MediaDeviceInfo[]>([]);
  const audioOutputDevices = useRef<MediaDeviceInfo[]>([]);
  const reconnecting = useRef(false);
  useEffect(() => {
    let timeoutToHide;
    if (menuVisible && currentCallStatus === CALL_STATUS.CONNECTED) {
      timeoutToHide = setTimeout(() => {
        setMenuVisibility(false);
      }, 5000);
    }
    return () => {
      if (timeoutToHide) {
        clearTimeout(timeoutToHide);
      }
    };
  }, [currentCallStatus, menuVisible]);

  async function reconnectConnection(e: Event | undefined = undefined) {
    //TODO: Trigger it from caller, switched networks.
    if (callUIDetails.visible) {
      console.log("Reconnecting...");
      reconnecting.current = true;
      rtcConnection.current?.terminate();
      await setupRTC();
      if (e === undefined) {
        await sendReconnectInitiator(connectedUser.chatId, connectedUser.userId);
      } else {
        sendReconnectInitiatorResponse(connectedUser.chatId, myProfile.data.id);
      }
      if (callUIDetails.userInitiated) {
        const offer = await startCallHandler();
        sendOffer(connectedUser.chatId, offer);
      }
    }
  }
  async function setupRTC() {
    await setAvailableDevices();
    try {
      if (callType === "video") {
        var speakerDevice = audioInputDevices.current.find((device) => /speaker/i.test(device.label));
      }
      const stream = await navigator.mediaDevices?.getUserMedia({
        audio: {
          deviceId: callType === "video" ? speakerDevice?.deviceId : "default",
        },
        video: UserStreamConstraints.video,
      });
      if (stream?.active === true) {
        stream.getTracks().forEach((track) => {
          if (track.kind === "video" && callType === "audio") {
            track.enabled = false;
          }
          userStream.current.addTrack(track);
        });
        keepUserStreamInSync();
        dispatch(setCallStatus(CALL_STATUS.CONNECTING));
        rtcConnection.current = new WebRTCConnection({
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
        if (streamingArea.current) {
          streamingArea.current.srcObject = stream;
        }
        rtcConnection.current.setStream = stream;
        rtcConnection.current.onConnectionStateChange = (state) => {
          console.log(state);
          switch (state) {
            case "connected":
              reconnecting.current = false;
              stopNoPickTimer();
              dispatch(setCallStatus(CALL_STATUS.CONNECTED));
              setLoading(false);
              if (rtcConnection.current) {
                setVideoSrc(rtcConnection.current.remoteStream);
              }
              break;
            case "connecting":
              setLoading(true);
              break;
            case "disconnected":
              if (currentCallStatus === CALL_STATUS.CONNECTED) {
                startNoPickTimer();
                //TODO: Reconnect here
              }
              break;
            case "failed":
              reconnecting.current = false;
              stopNoPickTimer();
              endCallHandler(true);
              break;
            default:
              setLoading(false);
          }
        };
        rtcConnection.current.onRemoteStreamAdded = (stream) => {
          console.log("remote", stream);
        };
        rtcConnection.current.onIceCandidate = (candidates) => {
          sendCandidate(connectedUser.chatId, candidates);
        };
      }
    } catch (e) {
      endCallHandler(true);
      setErrorForUI(
        <>
          <h2>Permission Denied!</h2>Please allow camera and microphone access in your browser’s settings.
        </>
      );
      console.log(e);
    }
  }
  function setVideoSrc(remoteStream: MediaStream) {
    if (streamingArea.current && videoPreviewer.current) {
      videoPreviewer.current.srcObject = userStream.current;
      streamingArea.current.srcObject = remoteStream;
      console.log("Stream set");
    }
  }
  function closeConnection() {
    rtcConnection.current?.terminate();
  }
  function stopNoPickTimer() {
    if (endCallTimeout.current) {
      clearTimeout(endCallTimeout.current);
    }
  }
  function startNoPickTimer() {
    endCallTimeout.current = setTimeout(() => {
      endCallHandler(true);
    }, 30 * 1000) as any; // Call not picked timing
  }
  function remoteDescriptionReceiver(e: Event) {
    if (RTCElement.remoteSDP && rtcConnection.current) {
      rtcConnection.current.setRemoteDescription = RTCElement.remoteSDP;
      if (RTCElement.remoteSDP?.type === "offer" && reconnecting.current) {
        answerCallHandler().then((answer) => sendAnswer(connectedUser.chatId, answer));
      }
      RTCElement.remoteSDP = undefined;
    }
  }
  function remoteIceReceiver() {
    if (RTCElement.iceCandidate && rtcConnection.current) {
      rtcConnection.current.setRemoteIceCandidates = RTCElement.iceCandidate;
      RTCElement.iceCandidate = undefined;
    }
  }
  function endConnectionReceiver() {
    endCallHandler(true);
  }
  async function setAvailableDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    devices.forEach((device) => {
      // if (device.deviceId === "default") return;
      switch (device.kind) {
        case "audioinput":
          audioInputDevices.current.push(device);
          break;
        case "audiooutput":
          audioOutputDevices.current.push(device);
          break;
        case "videoinput":
          videoInputDevices.current.push(device);
          break;
      }
    });
    console.log({ audOut: audioOutputDevices.current, audIn: audioInputDevices.current, vidIn: videoInputDevices.current });
  }
  useEffect(() => {
    setupRTC().then(async (v) => {
      if (callUIDetails.userInitiated) {
        await sendCallInitiator(connectedUser.chatId, mediaControls.videoEnabled ? "video" : "audio", myProfile.data.id);
        startCallHandler();
      } else {
        sendCallInitiatorResponse(connectedUser.chatId, myProfile.data.id);
      }
    });

    RTCElement.addEventListener(RTCReconnectEvent.type, reconnectConnection);
    RTCElement.addEventListener(RTCRemoteDescription.type, remoteDescriptionReceiver);
    RTCElement.addEventListener(RTCIceReceived.type, remoteIceReceiver);
    RTCElement.addEventListener(RTCEndEvent.type, endConnectionReceiver);
    return () => {
      RTCElement.removeEventListener(RTCReconnectEvent.type, reconnectConnection);
      RTCElement.removeEventListener(RTCRemoteDescription.type, remoteDescriptionReceiver);
      RTCElement.removeEventListener(RTCIceReceived.type, remoteIceReceiver);
      RTCElement.removeEventListener(RTCEndEvent.type, endConnectionReceiver);
      userStream.current.getTracks().forEach((track) => {
        track.stop();
      });
    };
  }, []);

  useEffect(() => {
    // Control media tracks mute state
    userStream.current.getTracks().forEach((track) => {
      if (track.kind === "video") {
        track.enabled = mediaControls.videoEnabled;
      }
      if (track.kind === "audio") {
        track.enabled = mediaControls.audioEnabled;
      }
    });
    if (mediaControls.videoEnabled) {
      callType === "audio" && switchCallType("video");
      callType === "audio" && toggleAudioToSpeaker();
    }
  }, [mediaControls]);

  function keepUserStreamInSync() {
    userStream.current.getTracks().forEach((track) => {
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
  }
  function handleRemoteStreamDuration(e) {
    if (callStatusContainer.current && currentCallStatus === CALL_STATUS.CONNECTED) {
      callStatusContainer.current.innerText = convertToDuration(Math.round(e.target?.currentTime || 0));
    }
  }
  // Options handlers
  const videoOptionHandler: ChangeEventHandler<HTMLInputElement> = async (e) => {
    const checked = e.target.checked;
    if (callType === "audio") {
      try {
        await switchCameraView();
        switchCallType("video");
      } catch (e) {
        alert("Could not start video");
      }
    }
    dispatch(enableVideo(checked));
  };
  const audioOptionHandler: ChangeEventHandler<HTMLInputElement> = (e) => {
    const checked = e.target.checked;
    dispatch(enableAudio(checked));
  };
  function endCallHandler(e: Event | any) {
    //TODO: End call gracefully if rejected or not picker by callee
    closeConnection();
    userStream.current.getTracks().forEach((track) => {
      track.stop();
    });
    dispatch(resetCallState(true));
    if (e?.type !== RTCEndEvent.type) {
      endCall(connectedUser.chatId);
    }
    //TODO: Leave a message with call duration and type in chat from caller side
  }
  const answerCallHandler = async () => {
    //TODO: better handling of calling answer
    const answer = await rtcConnection.current?.answerCall();
    sendAnswer(connectedUser.chatId, answer);
    console.log("2. Send", answer);
  };
  const minimizeHandler = () => {
    dispatch(minimizeComponent(true));
  };
  const startCallHandler = async () => {
    console.log("Sending offer");
    const offer = await rtcConnection.current?.initiateCall();
    sendOffer(connectedUser.chatId, offer);
    dispatch(setCallStatus(CALL_STATUS.WAITING));
    startNoPickTimer();
    console.log("2. Send", offer?.type);
  };
  async function switchCameraView() {
    if (userStream.current) {
      const nextVideoInputIndex = (selectedVideoDevice + 1) % videoInputDevices.current.length;
      const device = videoInputDevices.current[nextVideoInputIndex];
      console.log("selected device", device);
      const oldVideoTrack = userStream.current.getVideoTracks()[0];
      oldVideoTrack?.stop();
      const newVideoStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          ...UserStreamConstraints.video,
          deviceId: device.deviceId,
        },
      });
      const newVideoTrack = newVideoStream.getVideoTracks()[0];
      newVideoTrack.enabled = mediaControls.videoEnabled;
      if (oldVideoTrack) {
        userStream.current.removeTrack(oldVideoTrack);
      }
      userStream.current.addTrack(newVideoTrack);
      if (rtcConnection.current) {
        rtcConnection.current.setNewTrack = newVideoTrack;
      }
      keepUserStreamInSync();
      setSelectedVideoDevice(nextVideoInputIndex);
    }
  }
  async function toggleAudioToSpeaker() {
    if (userStream.current) {
      const audioDevice = selectedAudioDevice === "speaker" ? "default" : "speaker";
      const device = audioInputDevices.current.find((device) => new RegExp(audioDevice, "i").test(device.label));
      console.log(device);
      const oldAudioTrack = userStream.current.getAudioTracks()[0];
      oldAudioTrack?.stop();
      const newAudioStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          deviceId: device?.deviceId,
        },
      });
      const newAudioTrack = newAudioStream.getAudioTracks()[0];
      newAudioTrack.enabled = mediaControls.audioEnabled;
      oldAudioTrack && userStream.current.removeTrack(oldAudioTrack);
      userStream.current.addTrack(newAudioTrack);
      keepUserStreamInSync();
      if (rtcConnection.current) {
        rtcConnection.current.setNewTrack = newAudioTrack;
      }
      setSelectedAudioDevice(audioDevice);
    }
  }
  const renderOptions = () => {
    /*
     * //TODO: More options are device based
     *   ie: Camera Switch (preferred for mobile)
     *   ie: Speaker/Headset Switch (preferred for mobile)
     */
    if (callUIDetails.userInitiated || currentCallStatus === CALL_STATUS.CONNECTED) {
      return (
        <div className="option-container call-controls">
          {userDevice.type === "mobile" && (
            <div className="option">
              <input type="checkbox" id="speaker-control" checked={selectedAudioDevice === "speaker"} onChange={toggleAudioToSpeaker} />
              <label htmlFor="speaker-control">
                <SpeakerLoudIcon width={24} height={24} />
              </label>
            </div>
          )}
          <div className="option">
            <input type="checkbox" id="camera-control" checked={mediaControls.videoEnabled} onChange={videoOptionHandler} />
            <label htmlFor="camera-control">
              <VideoIcon width={24} height={24} />
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
          {userDevice.type === "mobile" && callType === "video" && (
            <div className="option" title="Switch Camera" id="camera-switch" onClick={switchCameraView}>
              <span>
                <UpdateIcon width={30} height={30} />
              </span>
            </div>
          )}
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
  function toggleMenu() {
    if (currentCallStatus === CALL_STATUS.CONNECTED) {
      setMenuVisibility((state) => !state);
    }
  }

  const dragStart = useRef(false);
  const startPointWithinElement = useRef({ x: 0, y: 0 });
  const lastKnownTouchValues = useRef({ x: 0, y: 0 });
  function dragStartHandler(e) {
    dragStart.current = true;
    const boxRect = videoPreviewer.current?.parentElement?.getBoundingClientRect();
    let x = e.clientX || e.targetTouches[0].clientX,
      y = e.clientY || e.targetTouches[0].clientY;
    if (boxRect) {
      startPointWithinElement.current.x = x - boxRect.left;
      startPointWithinElement.current.y = y - boxRect.top;
    }
  }
  function dragHandler(e) {
    if (dragStart.current) {
      let x = e.clientX || e.targetTouches?.[0].clientX,
        y = e.clientY || e.targetTouches?.[0].clientY;
      videoPreviewer.current?.parentElement?.style.setProperty("left", `${x - startPointWithinElement.current.x}px`);
      videoPreviewer.current?.parentElement?.style.setProperty("top", `${y - startPointWithinElement.current.y}px`);
      lastKnownTouchValues.current = { x, y };
    }
  }
  function dragEndHandler(e) {
    if (dragStart.current) {
      let x = e.clientX || lastKnownTouchValues.current.x;
      let y = e.clientY || lastKnownTouchValues.current.y;
      const previewWidth = videoPreviewer.current?.offsetWidth || 0;
      const previewHeight = videoPreviewer.current?.offsetHeight || 0;

      if (x <= window.innerWidth / 2) {
        x = 20;
      } else {
        x = window.innerWidth - previewWidth - 20;
      }

      if (y <= window.innerHeight / 2) {
        y = 100;
      } else {
        y = window.innerHeight - previewHeight - 100;
      }
      if (videoPreviewer.current?.parentElement) {
        videoPreviewer.current.parentElement.animate({ left: `${x}px`, top: `${y}px` }, { duration: 200 }).onfinish = (e) => {
          videoPreviewer.current?.parentElement?.style.setProperty("left", `${x}px`);
          videoPreviewer.current?.parentElement?.style.setProperty("top", `${y}px`);
        };
      }
    }
    dragStart.current = false;
    startPointWithinElement.current = { x: 0, y: 0 };
    lastKnownTouchValues.current = { x: 0, y: 0 };
  }
  return (
    <div className="chit-chat-call" onPointerMove={userDevice.type !== "mobile" ? dragHandler : undefined} onTouchMove={dragHandler as any} onPointerCancel={userDevice.type !== "mobile" ? dragEndHandler : undefined} onPointerUp={userDevice.type !== "mobile" ? dragEndHandler : undefined} onTouchEnd={dragEndHandler} onTouchCancel={dragEndHandler}>
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
          <div className="chit-chat-call__stream-area" onClick={toggleMenu} onMouseOver={() => setMenuVisibility(true)}>
            <video ref={streamingArea} autoPlay muted={currentCallStatus !== CALL_STATUS.CONNECTED} onTimeUpdate={handleRemoteStreamDuration} />
          </div>
          <div className="chit-chat-call__option-area" data-visible={menuVisible}>
            {renderOptions()}
          </div>
          <div className="chit-chat-call__user-video" data-visible={currentCallStatus === CALL_STATUS.CONNECTED && callType === "video"} onPointerDown={userDevice.type !== "mobile" ? dragStartHandler : undefined} onPointerUp={userDevice.type !== "mobile" ? dragEndHandler : undefined} onPointerCancel={userDevice.type !== "mobile" ? dragEndHandler : undefined} onTouchStart={dragStartHandler} onTouchEnd={dragEndHandler} onTouchCancel={dragEndHandler} data-fullArea={!menuVisible}>
            <video ref={videoPreviewer} autoPlay muted data-camera={selectedVideoDevice === 0 ? "front" : "rear"} />
          </div>
          <div className="chit-chat-call__top-menu" data-visible={menuVisible}>
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
