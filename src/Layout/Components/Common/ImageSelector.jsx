import { useCallback, useEffect, useRef, useState } from "react";
import "./style/image_selector.sass";
import { Chevron, MagnifyMinus, MagnifyPlus, ReloadIcon, TickIcon } from "../../../assets/icons";

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

const resolution = { height: 400, width: 400 }; // For canvas container
const INPUT_ID = window.crypto.randomUUID();

const ImageSelector = ({ currentImageSrc = "", uploadHandler, style = {} }) => {
  const fileSelectInput = useRef(null);
  const selectedImageContainer = useRef(null);
  const previewerDivRef = useRef(null);
  const { current: canvas } = useRef(document.createElement("canvas"));
  const [profilePicSrc, setProfilePicSrc] = useState(currentImageSrc);
  const [dragCursorOver, setDragCursorOver] = useState(false);
  const [imageSelected, setImageStatus] = useState("");
  const [initialBGSize, setBGSize] = useState({ width: 100, height: 100 });
  const [uploadProgress, setUploadProgress] = useState(0);

  const imageSizeAfterMagnification = { width: 0, height: 0 }; // Used for setting positioning of image

  const createCanvas = useCallback(() => {
    // This function is handling the canvas and should provide the cropped image
    canvas.height = resolution.height;
    canvas.width = resolution.width;
    const img = new Image();
    img.src = profilePicSrc;
    img.onload = () => {
      const context = canvas.getContext("2d");
      context.clearRect(0, 0, resolution.width, resolution.height);
      // context.scale(2, 2);   // TODO: later to increase the dpi of the cropped image
      const { x, y, height, width } = { ...getBGPosition(selectedImageContainer.current), ...getBGSize(selectedImageContainer.current) };
      const orgWidth = img.naturalWidth,
        orgHeight = img.naturalHeight;

      const renderedHeight = (height * resolution.height) / 100,
        renderedWidth = (width * resolution.width) / 100;
      const leftInPx = (x * (renderedWidth - resolution.width)) / 100,
        topInPx = (y * (renderedHeight - resolution.height)) / 100;

      context.drawImage(img, 0, 0, orgWidth, orgHeight, -1 * leftInPx, -1 * topInPx, renderedWidth, renderedHeight);
    };
  }, [profilePicSrc, selectedImageContainer.current, initialBGSize]);

  useEffect(() => {
    //? Workaround: onWheel Event listener for zoom-in and out.
    //! onWheel event (SyntacticEvent) could not be prevented default in React
    previewerDivRef.current?.addEventListener("wheel", mouseWheelHandler);

    createCanvas();
  }, [previewerDivRef.current]);

  useEffect(() => {
    if (uploadProgress === 100) {
      setImageStatus("uploaded");
    }
  }, [uploadProgress]);

  //* IMAGE SELECT FUNCTIONS
  const createAndSetImageUrl = useCallback(
    // TODO: This needs to create correct
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
          if (imgHeight > imgWidth) {
            setBGSize((state) => ({ ...state, height: Math.floor((imgHeight / imgWidth) * 100) }));
          } else if (imgWidth > imgHeight) {
            setBGSize((state) => ({ ...state, width: Math.floor((imgWidth / imgHeight) * 100) }));
          }
        };
        setProfilePicSrc(imageSrc);
      };
      reader.readAsArrayBuffer(file);
    },
    [setProfilePicSrc, setBGSize]
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

  //* SELECTED IMAGE MOVEMENT
  const imagePosition = (x = null, y = null) => {
    if (typeof x === "number" || typeof y === "number") {
      if (typeof x === "number") selectedImageContainer.current.style.backgroundPositionX = `${x}%`;
      if (typeof y === "number") selectedImageContainer.current.style.backgroundPositionY = `${y}%`;
    } else {
      return getBGPosition(selectedImageContainer.current);
    }
  };

  const imageSize = (width = null, height = null) => {
    if (width && height) {
      selectedImageContainer.current.style.backgroundSize = `${width}% ${height}%`;
    } else {
      return getBGSize(selectedImageContainer.current);
    }
  };
  const zoomIn = () => {
    const { width, height } = imageSize();
    const [newHeight, newWidth] = [height + Math.floor(initialBGSize.height / 10), width + Math.floor(initialBGSize.width / 10)];
    imageSize(newWidth, newHeight);
    Object.assign(imageSizeAfterMagnification, { width: newWidth, height: newHeight });
  };
  const zoomOut = () => {
    const { width, height } = imageSize();
    if (width > 100 && height > 100) {
      const [newHeight, newWidth] = [height - Math.floor(initialBGSize.height / 10), width - Math.floor(initialBGSize.width / 10)];
      imageSize(newWidth, newHeight);
      Object.assign(imageSizeAfterMagnification, { width: newWidth, height: newHeight });
    } else {
      if (height === 100) {
        imagePosition(null, 0);
      }
      if (width === 100) {
        imagePosition(0);
      }
    }
  };
  const mouseWheelHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
    createCanvas();
  };

  let dragStarted = false;
  const initialCursorPos = {
    x: 0,
    y: 0,
  };
  const initialImagePosition = {
    x: 0,
    y: 0,
  };

  let clientRect = {};
  let imageBGSize = {};
  const moveStartHandler = (e) => {
    dragStarted = true;
    clientRect = selectedImageContainer.current.getBoundingClientRect();
    imageBGSize = imageSize();
    const { x: offsetLeft, y: offsetTop } = clientRect;
    const cursorPosX = e.clientX - offsetLeft,
      cursorPosY = e.clientY - offsetTop;

    initialCursorPos.x = cursorPosX;
    initialCursorPos.y = cursorPosY;

    Object.assign(initialImagePosition, imagePosition());
  };
  const moveHandler = (e) => {
    if (dragStarted) {
      const { x: offsetLeft, y: offsetTop, height: containerHeight, width: containerWidth } = clientRect;
      const finalCursorPosX = { x: e.clientX - offsetLeft, y: e.clientY - offsetTop };

      const displacementX = finalCursorPosX.x - initialCursorPos.x,
        displacementY = finalCursorPosX.y - initialCursorPos.y;

      const movementInPercentage = {
        x: (displacementX / containerWidth) * 100,
        y: (displacementY / containerHeight) * 100,
      };

      const { x: initialPosX, y: initialPosY } = initialImagePosition;
      const newImagePosition = {
        x: initialPosX - movementInPercentage.x,
        y: initialPosY - movementInPercentage.y,
      };

      const { height, width } = imageBGSize;

      if (height > 100) {
        if (newImagePosition.y >= 0 && newImagePosition.y <= 100) imagePosition(null, newImagePosition.y);
      }
      if (width > 100) {
        if (newImagePosition.x >= 0 && newImagePosition.x <= 100) imagePosition(newImagePosition.x);
      }
      createCanvas();
    }
  };
  const moveEndHandler = (e) => {
    dragStarted = false;
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
        <div className={`image-preview ${imageSelected === "selected" ? "selected" : imageSelected === "uploaded" ? "finished" : ""}`} onMouseDown={moveStartHandler} onMouseMove={moveHandler} onMouseLeave={moveEndHandler} onMouseUp={moveEndHandler} ref={previewerDivRef}>
          <div className="image-preview__progress top" style={{ transform: `scaleX(${0 <= uploadProgress && uploadProgress <= 25 ? (uploadProgress * 4) / 100 : 1})` }} />
          <div className="image-preview__progress right" style={{ transform: `scaleY(${25 < uploadProgress && uploadProgress <= 50 ? ((uploadProgress - 25) * 4) / 100 : uploadProgress <= 25 ? 0 : 1})` }} />
          <div className="image-preview__progress bottom" style={{ transform: `scaleX(${50 < uploadProgress && uploadProgress <= 75 ? ((uploadProgress - 50) * 4) / 100 : uploadProgress <= 50 ? 0 : 1})` }} />
          <div className="image-preview__progress left" style={{ transform: `scaleY(${75 < uploadProgress && uploadProgress <= 100 ? ((uploadProgress - 75) * 4) / 100 : uploadProgress <= 75 ? 0 : 1})` }} />
          <div style={{ backgroundImage: `url(${profilePicSrc}`, backgroundSize: `${initialBGSize.width}% ${initialBGSize.height}%` }} data-type="profile-pic" ref={selectedImageContainer}></div>

          <div className="preview-controls">
            <div
              onClick={() => {
                setProfilePicSrc("");
              }}
            >
              <ReloadIcon width="40px" height="40px" fill="white" stroke="white" title="Select new image" />
            </div>
            <div onClick={zoomIn}>
              <MagnifyPlus width="40px" height="40px" fill="white" title="Zoom In" />
            </div>
            <div onClick={zoomOut}>
              <MagnifyMinus width="40px" height="40px" fill="white" title="Zoom Out" />
            </div>
            <div
              onClick={() => {
                setImageStatus("selected");
                canvas.toBlob(
                  (blob) => {
                    if (blob) {
                      uploadHandler(blob, setUploadProgress);
                    } else {
                      setImageStatus("");
                      window.alert("Something went wrong! Please try later");
                      console.error("CanvasBlobCreateError: Unable to create canvas block\nPlease report to developer!");
                    }
                  },
                  "image/png",
                  1
                );
              }}
            >
              <TickIcon width="40px" height="40px" stroke="white" title="Upload" />
            </div>
          </div>
          <div className="success-status">
            <TickIcon stroke="#0ab81b" width="400px" height="400px" />
          </div>
        </div>
      )}
      <input ref={fileSelectInput} type="file" id={INPUT_ID} name="image" placeholder="Your profile picture" accept="image/png,image/jpeg" capture="environment" onChange={imageSelectHandler} style={{ display: "none" }} />
    </div>
  );
};

export default ImageSelector;
