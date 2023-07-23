import React, { useEffect, useRef, useState } from "react";
import "./profile.sass";
import { GearIcon } from "../../../assets/icons";
import { useDispatch, useSelector } from "react-redux";
import { getUserData } from "../../../library/redux/selectors";
import { USER_STATUSES } from "../../../utils/enums";
import { CircularLoader } from "hd-ui";

const ProfileTab = () => {
  const profileContainer = useRef(null);
  const { data: user, loading, hasData } = useSelector(getUserData);
  const [profileModalOpen, openProfileModal] = useState(false);

  useEffect(() => {
    if (profileContainer.current) {
      profileContainer.current.style.setProperty("--status-border-color", USER_STATUSES[user.status].palleteColor);
      profileContainer.current.style.setProperty("--status-color", USER_STATUSES[user.status].color);
    }
  }, [user]);

  return (
    <>
      <div className="profile-section">
        {loading ? (
          <div className="profile-section_loading">
            <CircularLoader width={50} />{" "}
          </div>
        ) : hasData ? (
          <div className="profile-section-container">
            <div className="profile-picture-container" ref={profileContainer}>
              <img src={user.avatar.url} alt={user.firstName} className="profile-picture" />
              <span className="user-online-status" data-status={user.status}></span>
            </div>
            <div className="profile-name-container">
              <span>{`${user.firstName} ${user.lastName}`}</span>
            </div>
            <div className="profile-options-container">
              <GearIcon className="app-settings" />
              <div
                className="three-dot"
                onClick={() => {
                  openProfileModal(true);
                }}
              >
                <span></span>
                <span></span>
                <span></span>
              </div>
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
