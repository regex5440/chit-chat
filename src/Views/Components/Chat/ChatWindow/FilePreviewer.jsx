import { useEffect, useRef, useState } from "react";
import "./file_previewer.sass";
import { useDispatch } from "react-redux";
import { updateSelectedFiles } from "../../../../library/redux/reducers";
import { Cross1Icon, TrashIcon } from "@radix-ui/react-icons";

const FilePreviewer = ({ files, type = "image" }) => {
  const [selectedFileIndex, setSelectedFileIndex] = useState(null);
  const deleteIconSetTimeout = useRef(null);
  const dispatch = useDispatch();

  useEffect(() => {
    if (files.length > 0) {
      setSelectedFileIndex(0);
    }
  }, [files]);

  const closeHandler = () => {
    dispatch(updateSelectedFiles([]));
    setSelectedFileIndex(null);
  };

  const fileRemoveHandler = (removeIndex) => {
    const newFiles = files.filter((file, index) => index !== removeIndex);
    dispatch(updateSelectedFiles(newFiles));
    setSelectedFileIndex(removeIndex - 1 >= 0 ? removeIndex - 1 : 0);
  };

  return (
    <div className="file-previewer">
      <div className="file-previewer__container">
        <div className="file-previewer__header">
          {/* //TODO: Add metadata remove switch button */}
          <button className="close-btn" onClick={closeHandler}>
            <Cross1Icon height={20} width={20} />
          </button>
        </div>
        {/* //TODO: Add previewer for documents */}
        <div className="file-previewer__body" style={{ backgroundImage: `url(${files[selectedFileIndex]?.url})` }}></div>
        <div className="file-previewer__footer">
          <div className="file-previewer__footer-container">
            {/* //TODO: Show footer for multiple documents */}
            {files.map((file, index) => (
              <div
                className="file-previewer__footer__file"
                key={file.index}
                onClick={() => setSelectedFileIndex(index)}
                style={{ backgroundImage: `url(${file.url})` }}
                data-active={index === selectedFileIndex}
                onMouseOver={(e) => {
                  deleteIconSetTimeout.current = setTimeout(() => {
                    e.target.dataset.show_remove_cta = true;
                  }, 1500);
                }}
                data-show_remove_cta={false}
                onMouseLeave={(e) => {
                  clearTimeout(deleteIconSetTimeout.current);
                  e.currentTarget.dataset.show_remove_cta = false;
                }}
              >
                <div
                  className="file-previewer__delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileRemoveHandler(index);
                  }}
                >
                  <TrashIcon height={20} width={20} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilePreviewer;
