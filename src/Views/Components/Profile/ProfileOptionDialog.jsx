import { useDispatch, useSelector } from "react-redux";
import { MenuOptionType } from "../../../utils/enums";
import "./option_dialog.sass";
import * as Dialog from "@radix-ui/react-dialog";
import { getBlockedUsers } from "../../../library/redux/selectors";
import { useEffect, useState } from "react";
import { CircularLoader } from "hd-ui";
import * as Avatar from "@radix-ui/react-avatar";
import { getImageUrl } from "../../../utils";
import { getBlockedUsersThunk, unBlockHandlerThunk } from "../../../library/redux/reducers/user_appData";
import FlipMove from "react-flip-move";

const BlockedListData = () => {
  const dispatch = useDispatch();
  const blockedList = useSelector(getBlockedUsers);
  const [error, setState] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dispatch(getBlockedUsersThunk());
  }, []);

  const unblockHandler = (userId) => {
    setLoading(userId);
    dispatch(unBlockHandlerThunk(userId))
      .unwrap()
      .catch((err) => {
        setState("Something went wrong. Please try again later.");
        e.target.dataset.loading = false;
      });
  };
  return (
    <>
      <Dialog.Title>Blocked Users</Dialog.Title>
      {error && <div className="error-message">{error}</div>}
      <div className="blocked-list-container">
        {!blockedList ? (
          <CircularLoader size={40} riderColor={"var(--icon-stroke)"} />
        ) : Object.values(blockedList).length === 0 ? (
          <div className="no-blocked-users">No Blocked Users</div>
        ) : (
          <FlipMove style={{ width: "100%" }} leaveAnimation="fade">
            {Object.values(blockedList).map((user) => (
              <div className="blocked-user" key={user.id}>
                <Avatar.Root className="user-avatar">
                  <Avatar.Image src={getImageUrl(user.avatar)} alt={user.firstName} className="avatar-image" />
                  <Avatar.Fallback delayMs={600} />
                </Avatar.Root>
                <div className="user-name-id">
                  <div className="user-name">{`${user.firstName} ${user.lastName}`.trim()}</div>
                  <div className="user-id">{user.username}</div>
                </div>
                <div className="unblock-user" onClick={() => unblockHandler(user.id)}>
                  {loading === user.id ? <CircularLoader size={20} riderColor={"var(--icon-stroke)"} trackColor={"grey"} /> : "Unblock"}
                </div>
              </div>
            ))}
          </FlipMove>
        )}
      </div>
    </>
  );
};

const ProfileOptionDialog = ({ dialogType, closeHandler }) => {
  //TODO: Implement dialog content based on dialogType. FIRST IS BLOCKED LIST
  const Component = {
    [MenuOptionType.BLOCKED_LIST]: <BlockedListData />,
  };
  return (
    <Dialog.Root open={dialogType} onOpenChange={(open) => !open && closeHandler(null)}>
      <Dialog.Portal>
        <Dialog.Overlay className="profile-menu-overlay" />
        <Dialog.Content className="profile-menu-content">{Component[MenuOptionType[dialogType]]}</Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ProfileOptionDialog;
