import { useCallback, useEffect, useRef, useState } from "react";
import "./style/image_selector.sass";
import { MagnifyMinus, MagnifyPlus, PlusIcon, ReloadIcon, TickIcon } from "../../assets/icons";
import { debounce } from "../../utils";
import twoFingersGesture from "../../assets/two-finger-gesture.png";
import dummyProfileUrl from "../../assets/dummy_profile_pic.jpg";

const INPUT_ID = "hidden-input-image-selector";

const ImageSelector = ({ currentImageSrc = "", blobHandler, style = {}, resolution = { height: 400, width: 400 } }) => {
  const fileSelectInput = useRef(null);
  const previewContainer = useRef(null);
  const previewerDivRef = useRef(null);
  const { current: isMobile } = useRef(navigator.userAgent.toLowerCase().match(/mobile/i) ? true : false);
  const canvas = useRef(document.createElement("canvas"));
  const [profilePicSrc, setProfilePicSrc] = useState(currentImageSrc);
  const [dragCursorOver, setDragCursorOver] = useState(false);
  const [imageSelected, setImageStatus] = useState("");
  let { current: initialBoxSize } = useRef({ width: 100, height: 100 });
  const [adjustedBoxSize, setAdjustedBS] = useState({ height: 100, width: 100 });
  const translate = useRef({ x: 0, y: 0 });
  const [previewDisplacement, setPreviewDisplacement] = useState({ x: 0, y: 0 });
  const adjustedImageInPx = useRef({ height: 0, width: 0 });
  const showedInstruction = useRef(false);
  const [showCropInstruction, setCropInstruction] = useState(false);

  const dragStarted = useRef(false);

  const cursorPos = useRef({
    x: 0,
    y: 0,
  });
  const currentTranslate = useRef({
    x: 0,
    y: 0,
  });
  const movement = useRef({ x: 0, y: 0 });
  const translateInPx = useRef({ x: 0, y: 0 });

  const createCanvas = useCallback(() => {
    // This function is handling the canvas and should provide the cropped image
    canvas.current.height = resolution.height;
    canvas.current.width = resolution.width;
    const img = new Image();
    img.src = profilePicSrc;
    img.onload = () => {
      const context = canvas.current.getContext("2d");
      context.clearRect(0, 0, resolution.width, resolution.height);
      const orgWidth = img.naturalWidth,
        orgHeight = img.naturalHeight;
      context.drawImage(img, (Math.abs(translate.current.x) * orgWidth) / 100, (Math.abs(translate.current.y) * orgHeight) / 100, orgWidth, orgHeight, 0, 0, (adjustedBoxSize.width * 400) / 100, (adjustedBoxSize.height * 400) / 100);
    };
  }, [canvas.current, profilePicSrc, previewContainer.current, adjustedBoxSize, resolution, translate.current]);

  //* IMAGE SELECT FUNCTIONS
  const createAndSetImageUrl = useCallback(
    (file) => {
      if (!showedInstruction.current && isMobile) {
        setCropInstruction(true);
        showedInstruction.current = true;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageBlob = new Blob([e.target.result]);
        const imageSrc = URL.createObjectURL(imageBlob);
        const img = new Image();
        img.src = imageSrc;
        img.onload = () => {
          let imgHeight = img.naturalHeight;
          let imgWidth = img.naturalWidth;
          const newDimensions = {
            width: imgWidth > imgHeight ? Math.floor((imgWidth / imgHeight) * 100) : 100,
            height: imgHeight > imgWidth ? Math.floor((imgHeight / imgWidth) * 100) : 100,
          };
          initialBoxSize = newDimensions;
          setAdjustedBS(newDimensions);
        };
        setProfilePicSrc(imageSrc);
        if (isMobile) {
          setTimeout(() => {
            showCropInstruction && setCropInstruction(false);
          }, 4000);
        }
      };
      reader.readAsArrayBuffer(file);
    },
    [setProfilePicSrc]
  );
  const imageSelectHandler = (e) => {
    const [file] = e.target.files;
    if (file && ["image/jpeg", "image/png"].includes(file.type)) createAndSetImageUrl(file);
    else window.alert("Please select a valid image file. Supported formats: .jpg, .png");
  };
  const droppedFileHandler = (e) => {
    e.preventDefault();
    const data = e.dataTransfer.files;
    if (data?.length === 1 && ["image/jpeg", "image/png"].includes(data[0].type)) {
      if (fileSelectInput.current.value !== data[0].name) {
        fileSelectInput.current.files = data;
        createAndSetImageUrl(data[0]);
      }
    } else if (data?.length > 1) {
      window.alert("Cannot upload more than 1 file");
    } else {
      window.alert("Please drop a valid image file");
    }
    setDragCursorOver(false);
  };
  const fileDragOverHandler = (e) => {
    e.preventDefault();
    setDragCursorOver(true);
  };

  const zoomIn = () => {
    setAdjustedBS((state) => {
      if (state.height >= 500 || state.width >= 500) return state;
      return { height: Math.floor(state.height * 1.1), width: Math.floor(state.width * 1.1) };
    });
  };
  const resetTranslate = debounce(
    () => {
      previewContainer.current?.style.removeProperty("transform");
      translate.current = { x: 0, y: 0 };
    },
    { duration: 300 }
  );
  const zoomOut = () => {
    resetTranslate();
    setAdjustedBS((state) => {
      if (state.height <= initialBoxSize.height || state.width <= initialBoxSize.width) return state;
      return { height: Math.max(state.height / 1.1, initialBoxSize.height), width: Math.ceil(state.width / 1.1, initialBoxSize.width) };
    });
  };
  const mouseWheelHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  };

  const moveStartHandler = (e) => {
    dragStarted.current = true;
    (cursorPos.current.x = e.clientX), (cursorPos.current.y = e.clientY);
    translateInPx.current.x = Number(((translate.current.x * adjustedImageInPx.current.width) / 100).toFixed(2));
    translateInPx.current.y = Number(((translate.current.y * adjustedImageInPx.current.height) / 100).toFixed(2));
    currentTranslate.current.x = translateInPx.current.x;
    currentTranslate.current.y = translateInPx.current.y;
    (movement.current.x = 0), (movement.current.y = 0);
  };
  const moveHandler = (e) => {
    if (dragStarted.current) {
      const currentCursorPos = {
        x: e.clientX,
        y: e.clientY,
      };

      currentTranslate.current.x = currentCursorPos.x - cursorPos.current.x;
      movement.current.x = translateInPx.current.x + currentTranslate.current.x;

      if (movement.current.x < -1 * previewDisplacement.x) {
        movement.current.x = -1 * previewDisplacement.x;
      }
      if (movement.current.x > 0) {
        movement.current.x = 0;
      }

      currentTranslate.current.y = currentCursorPos.y - cursorPos.current.y;
      movement.current.y = translateInPx.current.y + currentTranslate.current.y;

      if (movement.current.y < -1 * previewDisplacement.y) {
        movement.current.y = -1 * previewDisplacement.y;
      }
      if (movement.current.y > 0) {
        movement.current.y = 0;
      }
      previewContainer.current.style.setProperty("transform", `translate(${movement.current.x}px,${movement.current.y}px)`);
    }
  };
  const moveEndHandler = (e) => {
    if (dragStarted.current) {
      translate.current = {
        x: Number(((movement.current.x / adjustedImageInPx.current.width) * 100).toFixed(1)),
        y: Number(((movement.current.y / adjustedImageInPx.current.height) * 100).toFixed(1)),
      };
      dragStarted.current = false;
    }
  };

  useEffect(() => {
    if (isMobile) {
      previewerDivRef.current?.addEventListener(
        "touchstart",
        (e) => {
          if (e.targetTouches.length === 2) {
            e.preventDefault();
            if (showCropInstruction) {
              setCropInstruction(false);
            }
            const clientX = e.targetTouches[0].clientX + e.targetTouches[1].clientX,
              clientY = e.targetTouches[0].clientY + e.targetTouches[1].clientY;
            moveStartHandler({ clientX, clientY });
          }
        },
        false
      );
      previewerDivRef.current?.addEventListener("touchmove", (e) => {
        if (e.targetTouches.length === 2) {
          e.preventDefault();
          const clientX = e.targetTouches[0].clientX + e.targetTouches[1].clientX,
            clientY = e.targetTouches[0].clientY + e.targetTouches[1].clientY;
          moveHandler({ clientX, clientY });
        }
      });

      previewerDivRef.current?.addEventListener("touchend", (e) => {
        if (e.targetTouches.length === 0) {
          // e.preventDefault();
          moveEndHandler(undefined);
        }
      });
      previewerDivRef.current?.addEventListener("touchcancel", (e) => {
        if (e.targetTouches.length === 0) {
          // e.preventDefault();
          moveEndHandler(undefined);
        }
      });
    } else {
      //? Workaround: onWheel Event listener for zoom-in and out.
      //! onWheel event (SyntacticEvent) could not be prevented default in React
      previewerDivRef.current?.addEventListener("wheel", mouseWheelHandler);
    }
  }, [previewerDivRef.current, moveHandler, moveStartHandler, moveEndHandler, mouseWheelHandler]);
  useEffect(() => {
    if (previewerDivRef.current) {
      const { width: containerWidth, height: containerHeight } = previewerDivRef.current.getBoundingClientRect();
      const newDimensionsPx = {
        width: (adjustedBoxSize.width * containerWidth) / 100,
        height: (adjustedBoxSize.height * containerHeight) / 100,
      };
      adjustedImageInPx.current = newDimensionsPx;
      const previewPortionInsideContainer = {
        x: Number(((containerWidth / newDimensionsPx.width) * 100).toFixed(1)),
        y: Number(((containerHeight / newDimensionsPx.height) * 100).toFixed(1)),
      };
      setPreviewDisplacement({
        x: Number((((100 - previewPortionInsideContainer.x) * newDimensionsPx.width) / 100).toFixed(1)),
        y: Number((((100 - previewPortionInsideContainer.y) * newDimensionsPx.height) / 100).toFixed(1)),
      });
    }
  }, [previewerDivRef.current, adjustedBoxSize]);
  return (
    <div className="image-selector" style={style}>
      {!profilePicSrc ? (
        <label htmlFor={INPUT_ID} className="upload-action" title="Click to Select or Drag a Image" onDragOver={fileDragOverHandler} onDragLeave={(e) => setDragCursorOver(false)} onDrop={droppedFileHandler}>
          <img alt="Profile Pic Dummy" src={dummyProfileUrl} />
          {dragCursorOver ? (
            <div className="drop-marker">Drop Here!</div>
          ) : (
            <div className="instruction">
              {isMobile ? "Tap here to select an image from your device." : "Click to select a file from your device"}
              <br />
              {!isMobile && (
                <>
                  OR <br /> Drag and drop an image file here
                </>
              )}
            </div>
          )}
        </label>
      ) : (
        <>
          <div className={`image-preview ${imageSelected === "selected" ? "selected" : ""}`} ref={previewerDivRef} onMouseDown={isMobile ? undefined : moveStartHandler} onMouseMove={isMobile ? undefined : moveHandler} onMouseLeave={isMobile ? undefined : moveEndHandler} onMouseUp={isMobile ? undefined : moveEndHandler}>
            <div style={{ backgroundImage: `url(${profilePicSrc}`, height: `${adjustedBoxSize.height}%`, width: `${adjustedBoxSize.width}%` }} data-type="profile-pic" ref={previewContainer}></div>

            {showCropInstruction && (
              <div className="crop-instruction">
                Use two fingers to move the image
                <div className="crop-instruction-image">
                  <img src={twoFingersGesture} />
                </div>
              </div>
            )}
          </div>
          <div className="preview-controls">
            <div
              onClick={() => {
                setProfilePicSrc("");
                setImageStatus("");
                blobHandler(null);
                currentTranslate.current = { x: 0, y: 0 };
                cursorPos.current = { x: 0, y: 0 };
                translate.current = { x: 0, y: 0 };
                previewContainer.current?.style.removeProperty("transform");
                createCanvas();
              }}
            >
              {imageSelected === "selected" ? <PlusIcon width="20px" height="20px" fill="white" stroke="white" title="Remove selected image" style={{ transform: "rotate(45deg)" }} /> : <ReloadIcon width="20px" height="20px" fill="white" stroke="white" title="Select new image" />}
            </div>
            {imageSelected !== "selected" && (
              <>
                <div onClick={zoomIn}>
                  <MagnifyPlus width="20px" height="20px" fill="white" title="Zoom In" />
                </div>
                <div onClick={zoomOut}>
                  <MagnifyMinus width="20px" height="20px" fill="white" title="Zoom Out" />
                </div>
                <div
                  onClick={() => {
                    setImageStatus("selected");
                    createCanvas();
                    setTimeout(() => {
                      canvas.current.toBlob(
                        (blob) => {
                          if (blob) {
                            blobHandler(blob);
                          } else {
                            setImageStatus("");
                            window.alert("Something went wrong! Please try later");
                            console.error("CanvasBlobCreateError: Unable to create canvas block\nPlease report to developer!");
                          }
                        },
                        "image/png",
                        1
                      );
                    }, 100);
                  }}
                >
                  <TickIcon width="20px" height="20px" stroke="white" title="Upload" />
                </div>
              </>
            )}
          </div>
        </>
      )}
      <input ref={fileSelectInput} type="file" id={INPUT_ID} name="image" placeholder="Your profile picture" accept="capture=camera;image/*" onChange={imageSelectHandler} style={{ display: "none" }} />
    </div>
  );
};

export default ImageSelector;
