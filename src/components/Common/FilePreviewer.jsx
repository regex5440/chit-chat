import { useEffect, useRef, useState } from "react";
import "./style/file_previewer.sass";
import { useDispatch } from "react-redux";
import { updateSelectedFiles } from "../../library/redux/reducers";
import { Cross1Icon, FileTextIcon, TrashIcon } from "@radix-ui/react-icons";
import { convertBytes, getAssetURL } from "../../utils";

const FilePreviewer = ({ files, previewerMode, fileType = "image", defaultSelectedIndex, header }) => {
  const [selectedFileIndex, setSelectedFileIndex] = useState(defaultSelectedIndex || null);
  const deleteIconSetTimeout = useRef(null);
  const dispatch = useDispatch();

  useEffect(() => {
    if (previewerMode === "receive") return;
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeHandler();
      }
    });
  }, []);

  useEffect(() => {
    if (files.length > 0 && !defaultSelectedIndex) {
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

  const selectedFile = files[selectedFileIndex];

  return (
    <div className="file-previewer" data-type={previewerMode}>
      <div className="file-previewer__container">
        <div className="file-previewer__header">
          {header}
          {/* //TODO: Add metadata remove switch button */}
          {previewerMode === "send" && (
            <button className="close-btn" onClick={closeHandler}>
              <Cross1Icon height={20} width={20} />
            </button>
          )}
        </div>
        <div className="file-previewer__body">
          {fileType === "image" ? (
            <img className="attached_img" src={previewerMode === "receive" ? getAssetURL(selectedFile?.key) : selectedFile?.url} alt="preview" />
          ) : (
            <div className="attached_doc">
              <div className="doc-container">
                <div className="doc-reader">{selectedFile?.name.endsWith(".pdf") ? <iframe src={previewerMode === "receive" ? getAssetURL(selectedFile?.key) : selectedFile?.url} /> : <h2 style={{ textAlign: "center", marginTop: "100px", color: "grey", fontStyle: "italic" }}>Preview unavailable</h2>}</div>
                <div className="doc-name">{selectedFile?.name}</div>
                <div className="doc-size">{convertBytes(selectedFile?.size)}</div>
              </div>
            </div>
          )}
        </div>
        <div className="file-previewer__footer">
          {/* //TODO: Scroll by dragging through mouse option or by scrolling */}
          <div className="file-previewer__footer-container">
            {files.map((file, index) => (
              <div
                className="file-previewer__footer__file"
                key={file.index}
                onClick={() => setSelectedFileIndex(index)}
                style={fileType === "image" ? { backgroundImage: `url(${previewerMode === "receive" ? getAssetURL(file.key) : file.url})` } : {}}
                data-active={index === selectedFileIndex}
                onMouseOver={(e) => {
                  if (previewerMode === "receive") return;
                  deleteIconSetTimeout.current = setTimeout(() => {
                    e.target.dataset.show_remove_cta = true;
                  }, 1500);
                }}
                data-show_remove_cta={false}
                onMouseLeave={(e) => {
                  if (previewerMode === "receive") return;

                  clearTimeout(deleteIconSetTimeout.current);
                  e.currentTarget.dataset.show_remove_cta = false;
                }}
                title={fileType === "document" ? file.name : ""}
              >
                {fileType != "image" && (
                  <div className="file-previewer__doc-select">
                    <FileTextIcon />
                    <div className="file-name">{file.name}</div>
                  </div>
                )}
                {previewerMode === "send" && (
                  <div
                    className="file-previewer__delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileRemoveHandler(index);
                    }}
                    title="Delete this file"
                  >
                    <TrashIcon height={20} width={20} color={fileType === "image" ? "white" : "var(--icon-stroke)"} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilePreviewer;
