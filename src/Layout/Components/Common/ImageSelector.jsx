import { useCallback, useEffect, useRef, useState } from "react";
import "./style/image_selector.sass";
import { Chevron, MagnifyMinus, MagnifyPlus, ReloadIcon, TickIcon } from "../../../assets/icons";
import { debounce, useDebounce } from "../../../utils";

const getBGPosition = (elem) => {
  const [posX, posY] = getComputedStyle(elem)?.backgroundPosition.split(" ");
  return {
    x: Number(posX.replace("%", "").trim()),
    y: Number(posY.replace("%", "").trim()),
  };
};
const getBGSize = (elem) => {
  const [imageWidth, imageHeight] = getComputedStyle(elem)?.backgroundSize.split(" ");
  return {
    width: Number(imageWidth.replace("%", "").trim()),
    height: Number(imageHeight.replace("%", "").trim()),
  };
};
const INPUT_ID = window.crypto.randomUUID();

const ImageSelector = ({ currentImageSrc = "", blobHandler, style = {}, resolution = { height: 400, width: 400 } }) => {
  const fileSelectInput = useRef(null);
  const previewContainer = useRef(null);
  const previewerDivRef = useRef(null);
  // const { current: canvas } = useRef(document.createElement("canvas"));
  const canvas = useRef(document.createElement("canvas"));
  const [profilePicSrc, setProfilePicSrc] = useState(currentImageSrc);
  const [dragCursorOver, setDragCursorOver] = useState(false);
  const [imageSelected, setImageStatus] = useState("");
  let { current: initialBoxSize } = useRef({ width: 100, height: 100 });
  const [adjustedBoxSize, setAdjustedBS] = useState({ height: 100, width: 100 });
  const translate = useRef({ x: 0, y: 0 });
  const [previewDisplacement, setPreviewDisplacement] = useState({ x: 0, y: 0 });
  const adjustedImageInPx = useRef({ height: 0, width: 0 });

  const imageSizeAfterMagnification = { width: 0, height: 0 }; // Used for setting positioning of image

  const createCanvas = useCallback(() => {
    // This function is handling the canvas and should provide the cropped image
    canvas.current.height = resolution.height;
    canvas.current.width = resolution.width;
    const img = new Image();
    img.src = profilePicSrc;
    // img.style.width = adjustedImageInPx + "px";
    // img.style.width = adjustedImageInPx + "px";
    img.onload = () => {
      const context = canvas.current.getContext("2d");
      context.clearRect(0, 0, resolution.width, resolution.height);
      // const { x, y, height, width } = { ...getBGPosition(previewContainer.current), ...getBGSize(previewContainer.current) };
      const orgWidth = img.naturalWidth,
        orgHeight = img.naturalHeight;

      // const renderedHeight = (height * resolution.height) / 100,
      //   renderedWidth = (width * resolution.width) / 100;
      // const leftInPx = (x * (renderedWidth - resolution.width)) / 100,
      //   topInPx = (translate.current.y * (renderedHeight - resolution.height)) / 100;
      console.log("Adjusted", adjustedBoxSize);
      context.drawImage(
        img,
        (Math.abs(translate.current.x) * orgWidth) / 100,
        (Math.abs(translate.current.y) * orgHeight) / 100,
        orgWidth,
        orgHeight, // adjustedBoxSize.width * adjustedImageInPx.current.width, adjustedBoxSize.height * adjustedImageInPx.current.height,
        0,
        0,
        (adjustedBoxSize.width * 400) / 100,
        (adjustedBoxSize.height * 400) / 100
      );
    };
  }, [profilePicSrc, previewContainer.current, adjustedBoxSize]);

  useEffect(() => {
    //? Workaround: onWheel Event listener for zoom-in and out.
    //! onWheel event (SyntacticEvent) could not be prevented default in React
    previewerDivRef.current?.addEventListener("wheel", mouseWheelHandler);
  }, [previewerDivRef.current]);
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
  //* IMAGE SELECT FUNCTIONS
  const createAndSetImageUrl = useCallback(
    (file) => {
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
      };
      reader.readAsArrayBuffer(file);
    },
    [setProfilePicSrc]
  );
  const imageSelectHandler = (e) => {
    const [file] = e.target.files;
    if (file && ["image/jpeg", "image/png"].includes(file.type)) createAndSetImageUrl(file);
    else window.alert("Please select a valid image file.");
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
  const moveStartHandler = (e) => {
    dragStarted.current = true;
    (cursorPos.current.x = e.clientX), (cursorPos.current.y = e.clientY);
    translateInPx.current.x = Number(((translate.current.x * adjustedImageInPx.current.width) / 100).toFixed(2));
    translateInPx.current.y = Number(((translate.current.y * adjustedImageInPx.current.height) / 100).toFixed(2));
    currentTranslate.current.x = translateInPx.current.x;
    currentTranslate.current.y = translateInPx.current.y;
    (movement.current.x = 0), (movement.current.y = 0);
    console.log("StartedWith", translate.current, currentTranslate.current);
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
      console.log("Movement", movement.current);
      previewContainer.current.style.setProperty("transform", `translate(${movement.current.x}px,${movement.current.y}px)`);
    }
  };
  const moveEndHandler = (e) => {
    if (dragStarted.current) {
      translate.current = {
        x: Number(((movement.current.x / adjustedImageInPx.current.width) * 100).toFixed(1)),
        y: Number(((movement.current.y / adjustedImageInPx.current.height) * 100).toFixed(1)),
      };
      console.log("Stored", translate.current, adjustedImageInPx.current);
      dragStarted.current = false;
    }
  };

  return (
    <div className="image-selector" style={style}>
      {!profilePicSrc ? (
        <label htmlFor={INPUT_ID} className="upload-action" title="Click to Select or Drag a Image" onDragOver={fileDragOverHandler} onDragLeave={(e) => setDragCursorOver(false)} onDrop={droppedFileHandler}>
          <img alt="Profile Pic Dummy" src="/src/assets/dummy_profile_pic.jpg" />
          {dragCursorOver ? (
            <div className="drop-marker">Drop Here!</div>
          ) : (
            <div className="instruction">
              Click to Select <br /> OR <br /> Drag a Image
            </div>
          )}
        </label>
      ) : (
        <>
          <div className={`image-preview ${imageSelected === "selected" ? "selected" : ""}`} onMouseDown={moveStartHandler} onMouseMove={moveHandler} onMouseLeave={moveEndHandler} onMouseUp={moveEndHandler} ref={previewerDivRef}>
            <div style={{ backgroundImage: `url(${profilePicSrc}`, height: `${adjustedBoxSize.height}%`, width: `${adjustedBoxSize.width}%` }} data-type="profile-pic" ref={previewContainer}></div>

            <div className="success-status">
              <TickIcon stroke="#0ab81b" width="400px" height="400px" />
            </div>
          </div>
          <div className="preview-controls">
            {/*//TODO: Also, zoom in and out not using translate and showing unexpected results*/}
            <div
              onClick={() => {
                setProfilePicSrc("");
                currentTranslate.current = { x: 0, y: 0 };
                scaleLevel = 1;
                cursorPos.current = { x: 0, y: 0 };
                translate.current = { x: 0, y: 0 };
                previewContainer.current?.style.removeProperty("transform");
              }}
            >
              <ReloadIcon width="20px" height="20px" fill="white" stroke="white" title="Select new image" />
            </div>
            <div onClick={zoomIn}>
              <MagnifyPlus width="20px" height="20px" fill="white" title="Zoom In" />
            </div>
            <div onClick={zoomOut}>
              <MagnifyMinus width="20px" height="20px" fill="white" title="Zoom Out" />
            </div>
            <div
              onClick={() => {
                // setImageStatus("selected");
                createCanvas();
                // canvas.toBlob(
                //   (blob) => {
                //     if (blob) {
                //       blobHandler(blob);
                //     } else {
                //       setImageStatus("");
                //       window.alert("Something went wrong! Please try later");
                //       console.error("CanvasBlobCreateError: Unable to create canvas block\nPlease report to developer!");
                //     }
                //   },
                //   "image/png",
                //   1
                // );
              }}
            >
              <TickIcon width="20px" height="20px" stroke="white" title="Upload" />
            </div>
          </div>
        </>
      )}
      <canvas ref={canvas} />
      <input ref={fileSelectInput} type="file" id={INPUT_ID} name="image" placeholder="Your profile picture" accept="capture=camera;image/*" onChange={imageSelectHandler} style={{ display: "none" }} />
    </div>
  );
};

export default ImageSelector;
