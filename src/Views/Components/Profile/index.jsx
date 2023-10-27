import React, { useEffect, useRef, useState } from "react";
import "./profile.sass";
import { useDispatch, useSelector } from "react-redux";
import { getContactsRaw, getUserData } from "../../../library/redux/selectors";
import { USER_STATUSES } from "../../../utils/enums";
import { CircularLoader, DropDown, Modal } from "hd-ui";
import ThreeDot from "../Common/ThreeDot";
import { updateStatusThunk } from "../../../library/redux/reducers";
import ChitChatServer from "../../../client/api";
import { getImageUrl, setLoginStateToken } from "../../../utils";
import { useNavigate } from "react-router-dom";

const ProfileTab = () => {
  const profileContainer = useRef(null);
  const { data: user, loading, hasData } = useSelector(getUserData);
  const contacts = useSelector(getContactsRaw);
  const dispatch = useDispatch();
  const [profileModalOpen, openProfileModal] = useState(false);
  const targetForModal = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (profileContainer.current) {
      profileContainer.current.style.setProperty("--status-border-color", USER_STATUSES[user.status.code].palleteColor);
      profileContainer.current.style.setProperty("--status-color", USER_STATUSES[user.status.code].color);
    }
  }, [user]);

  useEffect(() => {
    if (!contacts.loading) {
      if (user?.status && user.status.update_type === "auto") {
        dispatch(updateStatusThunk({ status: USER_STATUSES.ONLINE.code, type: "auto" }));
      }
    }
  }, [user, contacts.loading]);
  const statusChangeHandler = (value) => {
    let changeType = "manual";
    if (value === USER_STATUSES.ONLINE.code) {
      changeType = "auto";
    }
    dispatch(updateStatusThunk({ type: changeType, status: value }));
  };

  const logOutHandler = () => {
    ChitChatServer.get("/log_out");
    setLoginStateToken("");
    navigate("/");
  };

  const renderProfileModal = () => {
    return (
      <Modal
        open={profileModalOpen}
        closeHandler={() => {
          openProfileModal(false);
        }}
        keepModalCentered={false}
        closeOnBlur={true}
        TransitionStyle="fade"
        triggerElement={targetForModal}
        showBackdrop={false}
      >
        <div className="option not-allowed">Update Profile</div>
        <div className="option not-allowed">Blocked Contacts</div>
        <div className="option not-allowed settings">App Settings</div>
        <div className="option red" onClick={logOutHandler}>
          Logout
        </div>
      </Modal>
    );
  };

  return (
    <>
      <div className="profile-section">
        {loading ? (
          <div className="profile-section_loading">
            <CircularLoader size={50} />{" "}
          </div>
        ) : hasData ? (
          <div className="profile-section-container">
            <div className="profile-picture-container" ref={profileContainer}>
              <img src={getImageUrl(user.avatar)} alt={user.firstName} className="profile-picture" />
              <span className="user-online-status" data-status={user.status.code}></span>
            </div>
            <div className="profile-name-container">
              <span>{`${user.firstName} ${user.lastName}`}</span>
              <DropDown id="status-select" onChange={statusChangeHandler} defaultValue={user.status.code} actionType="hover" optionLayerStyle={{ borderRadius: "3px", overflow: "hidden", background: "var(--modal-background-primary)" }} style={{ borderRadius: "3px", width: "80px", height: "30px" }} selectedOptionStyle={{ borderRadius: "3px", background: "transparent", justifyContent: "left" }}>
                <DropDown.Option value={USER_STATUSES.ONLINE.code}>
                  <div className="status-option-container">
                    <span className="status-icon" style={{ backgroundColor: USER_STATUSES.ONLINE.color }}></span>Online
                  </div>
                </DropDown.Option>
                <DropDown.Option value={USER_STATUSES.OFFLINE.code}>
                  <div className="status-option-container">
                    <span className="status-icon" style={{ backgroundColor: USER_STATUSES.OFFLINE.color }}></span>Offline
                  </div>
                </DropDown.Option>
              </DropDown>
            </div>
            <div className="profile-options-container">
              <ThreeDot ref={targetForModal} onClick={() => openProfileModal(true)} />
              {renderProfileModal()}
            </div>
          </div>
        ) : (
          <div>No Data</div>
        )}
      </div>
    </>
  );
};

export default ProfileTab;
