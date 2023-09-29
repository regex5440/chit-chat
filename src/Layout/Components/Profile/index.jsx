import React, { useEffect, useRef, useState } from "react";
import "./profile.sass";
import { GearIcon } from "../../../assets/icons";
import { useDispatch, useSelector } from "react-redux";
import { getContactsRaw, getUserData } from "../../../library/redux/selectors";
import { USER_STATUSES } from "../../../utils/enums";
import { CircularLoader } from "hd-ui";
import ThreeDot from "../Common/ThreeDot";
import { statusUpdate } from "../../../library/socket.io/socket";
import { updateStatusThunk } from "../../../library/redux/reducers";

const ProfileTab = () => {
  const profileContainer = useRef(null);
  const { data: user, loading, hasData } = useSelector(getUserData);
  const contacts = useSelector(getContactsRaw);
  const dispatch = useDispatch();
  const [profileModalOpen, openProfileModal] = useState(false);

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
              <img src={user.avatar.url || (user.avatar.key ? `${import.meta.env.CC_IMAGE_BUCKET_URL}/${user.avatar.key}` : "")} alt={user.firstName} className="profile-picture" />
              <span className="user-online-status" data-status={user.status.code}></span>
            </div>
            <div className="profile-name-container">
              <span>{`${user.firstName} ${user.lastName}`}</span>
            </div>
            <div className="profile-options-container">
              <GearIcon className="app-settings" />
              <ThreeDot />
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
