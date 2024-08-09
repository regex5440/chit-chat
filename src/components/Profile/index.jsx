import React, { useEffect, useRef, useState } from "react";
import "./profile.sass";
import { useDispatch, useSelector } from "react-redux";
import { getContactsRaw, getDeviceDetails, getUserData } from "../../library/redux/selectors";
import { MenuOptionType, USER_STATUSES } from "../../utils/enums";
import { CircularLoader, Modal } from "hd-ui";
import ThreeDot from "../Common/ThreeDot";
import { updateStatusThunk } from "../../library/redux/reducers";
import ChitChatServer from "../../client/api";
import { getImageUrl, setLoginStateToken } from "../../utils";
import { useNavigate } from "react-router-dom";
import * as DropDownMenu from "@radix-ui/react-dropdown-menu";
import { TickIcon } from "../../assets/icons";
import * as Dialog from "@radix-ui/react-dialog";
import ProfileOptionDialog from "./ProfileOptionDialog";

const ProfileTab = () => {
  const profileContainer = useRef(null);
  const { data: user, loading, hasData } = useSelector(getUserData);
  const contacts = useSelector(getContactsRaw);
  const dispatch = useDispatch();
  const [profileModalOpen, openProfileModal] = useState(false);
  const targetForModal = useRef(null);
  const navigate = useNavigate();
  const device = useSelector(getDeviceDetails);
  const [statusOption, showStatusOption] = useState(false);
  const [dialogOption, setDialogOption] = useState(null);

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
    navigate("/logout");
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
        <div
          className="option"
          onClick={() => {
            setDialogOption(MenuOptionType.UPDATE_PROFILE);
          }}
        >
          Update Profile
        </div>
        <div
          className="option"
          onClick={() => {
            setDialogOption(MenuOptionType.BLOCKED_LIST);
            // openProfileModal(false);
          }}
        >
          Blocked Contacts
        </div>
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
            <CircularLoader size={50} />
          </div>
        ) : hasData ? (
          <div className="profile-section-container">
            <div className="profile-picture-container" ref={profileContainer}>
              <img src={getImageUrl(user.avatar)} alt={user.firstName} className="profile-picture" />
              <span className="user-online-status" data-status={user.status.code}></span>
            </div>
            <div className="profile-name-container">
              <span className="name-data">{`${user.firstName} ${user.lastName}`}</span>
              <DropDownMenu.Root open={statusOption} onOpenChange={showStatusOption}>
                <DropDownMenu.Trigger asChild id="status-select" onMouseOver={device.type !== "mobile" ? () => showStatusOption(true) : undefined}>
                  <div>{USER_STATUSES[user.status.code].code?.toLowerCase()}</div>
                </DropDownMenu.Trigger>
                <DropDownMenu.Portal>
                  <DropDownMenu.Content className="status-option-dropdown">
                    <DropDownMenu.RadioGroup value={user.status.code} onValueChange={statusChangeHandler} style={{ borderRadius: "3px", overflow: "hidden", background: "var(--modal-background-primary)" }}>
                      <DropDownMenu.RadioItem value={USER_STATUSES.ONLINE.code} className="option">
                        <DropDownMenu.ItemIndicator>
                          <TickIcon width="16px" height="16px" stroke="var(--icon-stroke)" />
                        </DropDownMenu.ItemIndicator>
                        <span className="text">Online</span>
                      </DropDownMenu.RadioItem>

                      <DropDownMenu.RadioItem value={USER_STATUSES.OFFLINE.code} className="option">
                        <DropDownMenu.ItemIndicator>
                          <TickIcon width="16px" height="16px" stroke="var(--icon-stroke)" />
                        </DropDownMenu.ItemIndicator>
                        <span className="text">Offline</span>
                      </DropDownMenu.RadioItem>
                    </DropDownMenu.RadioGroup>
                  </DropDownMenu.Content>
                </DropDownMenu.Portal>
              </DropDownMenu.Root>
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
      <ProfileOptionDialog dialogType={dialogOption} closeHandler={setDialogOption} />
    </>
  );
};

export default ProfileTab;
