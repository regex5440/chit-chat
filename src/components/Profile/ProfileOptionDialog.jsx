import { useDispatch, useSelector } from "react-redux";
import { MenuOptionType } from "../../utils/enums";
import "./option_dialog.sass";
import * as Dialog from "@radix-ui/react-dialog";
import { getBlockedUsers, getUserData } from "../../library/redux/selectors";
import { useCallback, useEffect, useRef, useState } from "react";
import { BouncyBalls, CircularLoader } from "hd-ui";
import * as Avatar from "@radix-ui/react-avatar";
import { debounce, getImageUrl, useUniqueRequest } from "../../utils";
import { getBlockedUsersThunk, getMyProfile, unBlockHandlerThunk } from "../../library/redux/reducers/user_appData";
import FlipMove from "react-flip-move";
import ChitChatServer from "../../client/api";
import { GoogleNeutralRoundNAIcon } from "../../assets/icons";
import { Cross1Icon } from "@radix-ui/react-icons";
import { useNavigate } from "react-router-dom";

const ProfileOptionDialog = ({ dialogType, closeHandler }) => {
  //TODO: Implement dialog content based on dialogType. FIRST IS BLOCKED LIST
  const Component = {
    [MenuOptionType.BLOCKED_LIST]: <BlockedListData />,
    [MenuOptionType.UPDATE_PROFILE]: <UpdateProfile />,
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

function UpdateForm({ userAccount }) {
  const [isFormUpdated, setFormUpdated] = useState(false);
  const [loading, setLoading] = useState({
    updateRequest: false,
    usernameRequest: false,
  });
  const [error, setError] = useState("");
  const [isUsernameAvailable, setUsernameAvailability] = useState(true);
  const dispatch = useDispatch();
  const userNameCheckerRequest = useUniqueRequest(ChitChatServer);
  const [userNameInput, setUserNameInput] = useState("");
  const [emailValidated, setEmailValidated] = useState(true);

  const checkUserName = useCallback(
    debounce(
      async (usernameQuery) => {
        if (usernameQuery.length > 3) {
          setLoading((state) => ({ ...state, usernameRequest: true }));
          try {
            const response = await userNameCheckerRequest(`/username_checker?username=${usernameQuery}`);
            if (response.success) {
              setUsernameAvailability(response.data.available);
              setLoading((state) => ({ ...state, usernameRequest: false }));
            } else {
              throw new Error(response.message);
            }
          } catch (err) {
            if (err.message !== "canceled") {
              setUsernameAvailability(false);
              setError("Something went wrong. Please try again later.");
              setLoading((state) => ({ ...state, usernameRequest: false }));
            }
            console.error("U", err);
          }
        } else {
          setUsernameAvailability(false);
          setLoading((state) => ({ ...state, usernameRequest: false }));
        }
      },
      { duration: 1000 }
    ),
    []
  );

  const formOnInputHandler = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const firstName = formData.get("firstName");
    const lastName = formData.get("lastName");
    const about = formData.get("about");
    const username = formData.get("username");
    const email = formData.get("email");
    if (firstName !== userAccount.firstName || lastName !== userAccount.lastName || about !== userAccount.about || username !== userAccount.username || email !== userAccount.email) {
      !isFormUpdated && setFormUpdated(true);
      if (email !== userAccount.email) {
        emailValidated && setEmailValidated(false);
      }
    } else {
      isFormUpdated && setFormUpdated(false);
      if (email === userAccount.email) {
        !emailValidated && setEmailValidated(true);
      }
    }
  };
  const submitHandler = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    let x = {};
    formData.forEach((val, key) => {
      x[key] = val;
    });
    console.log(x, e.currentTarget);
    const firstName = formData.get("firstName").trim();
    const lastName = formData.get("lastName").trim();
    const about = formData.get("about").trim();
    const username = formData.get("username").trim().toLowerCase();
    // const email = formData.get("email").trim().toLowerCase();
    if (firstName && username) {
      setFormUpdated(false);
      setLoading((state) => ({ ...state, updateRequest: true }));
      try {
        const response = await ChitChatServer.post("/update_profile", { firstName, lastName, about, username, email: userAccount.email });
        console.log(response);
        if (response.success) {
          dispatch(getMyProfile());
        } else {
          setError(response.message);
        }
      } catch (err) {
        setFormUpdated(true);
      } finally {
        setLoading((state) => ({ ...state, updateRequest: false }));
      }
    }
  };
  const handleUserName = (e) => {
    const value = e.target.value;
    if (value && value !== userAccount.username) {
      setUsernameAvailability(false);
      setUserNameInput(value);
      checkUserName(value?.trim().toLowerCase());
    } else {
      setUserNameInput("");
      setUsernameAvailability(true);
    }
  };

  return (
    <div className="profile-form">
      <Dialog.Title>Update Profile</Dialog.Title>
      <form className="profile-form__inputs" onSubmit={submitHandler} onInput={formOnInputHandler}>
        <div className="row-1">
          <input type="text" placeholder="First Name" defaultValue={userAccount.firstName} name="firstName" />
          <input type="text" placeholder="Last Name" defaultValue={userAccount.lastName} name="lastName" />
        </div>
        <div className="row-2">
          <textarea placeholder="Bio" defaultValue={userAccount.about} name="about" maxLength={150} />
        </div>
        <div className="row-3">
          <div>
            <input type="text" placeholder="Username" name="username" onChange={handleUserName} value={userNameInput || userAccount.username} />
            {userNameInput && (loading.usernameRequest ? <CircularLoader size={20} riderColor={"var(--icon-stroke)"} /> : isUsernameAvailable ? <div className="available">Available</div> : <div className="unavailable">Unavailable</div>)}
          </div>
        </div>
        <div className="row-4">
          <input type="text" placeholder="Email" defaultValue={userAccount.email} name="email" disabled />
          {/* {!emailValidated && <button className="verifier">Validate</button>} */}
        </div>
        <div className="row-5">
          <div className="error">{error}</div>

          <button type="submit" disabled={!isFormUpdated || !isUsernameAvailable} data-in_progress={loading.updateRequest}>
            {loading.updateRequest ? <CircularLoader size={35} /> : "Update"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Services({ userAccount }) {
  const gBtn = useRef();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  useEffect(() => {
    google.accounts.id.initialize({
      client_id: import.meta.env.CC_OAuthClientID,
      callback: oAuthDataHandler,
    });
    //TODO: Create a custom Google button
    google.accounts.id.renderButton(gBtn.current, { type: "icon", shape: "circle" });
    return () => {
      setLoading(false);
      setError("");
    };
  }, []);

  async function oAuthDataHandler(gData) {
    setLoading(true);
    try {
      const response = await ChitChatServer.post("/connect_oauth", { service: "google", credential: gData.credential });
      if (response.success) {
        setError("");
        dispatch(getMyProfile());
      }
    } catch (e) {
      console.log(e);
      setError("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  }
  function connectionStatus() {
    if (userAccount.testAccount) {
      return "Disabled for test account";
    }
    if (loading) {
      return <BouncyBalls ballColor={"var(--icon-stroke)"} />;
    } else {
      return userAccount.oAuth?.google.enabled ? "Connected" : "Not Connected";
    }
  }
  return (
    <div className="connected-services">
      <Dialog.Title>Connected Services</Dialog.Title>
      {error && <div className="error-message">{error}</div>}
      <div className="services-view">
        <div className="service">
          <div className="service-name" ref={gBtn} data-disabled={userAccount.oAuth?.google.enabled || userAccount.testAccount || false}>
            <GoogleNeutralRoundNAIcon />
          </div>
          <div className="service-status">{connectionStatus()}</div>
        </div>
      </div>
    </div>
  );
}

function UpdateProfile() {
  const [renderedPage, setPage] = useState("profile");
  const { data: userAccount, loading, hasData } = useSelector(getUserData);
  const [deletionLoading, setDeletionLoading] = useState(false);
  const navigate = useNavigate();

  function deleteAccount() {
    setDeletionLoading(true);
    ChitChatServer.post("/delete_account")
      .then((response) => {
        navigate("/logout");
      })
      .catch((err) => {
        console.log(err);
        alert("Something went wrong. Please try again later.");
        setDeletionLoading(false);
      });
  }

  const renderAccountDeletion = () => {
    return (
      <div className="account-deletion">
        <Dialog.Title>Delete Account</Dialog.Title>
        <div className="delete-account">
          <Dialog.Root>
            <Dialog.Trigger asChild>
              <button data-type={"danger"} disabled={userAccount.testAccount || false}>
                {userAccount.testAccount ? "Unavailable for test account" : "Delete Account"}
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="delete-account__overlay" />
              <Dialog.Content asChild>
                <div className="delete-account__content">
                  <Dialog.Title>Do you want to continue?</Dialog.Title>
                  <Dialog.Description className="warning">This action is irreversible and will delete all your data.</Dialog.Description>
                  <div className="delete-account__cta" data-no_cancel={deletionLoading}>
                    <button data-type={"danger"} data-in_progress={deletionLoading} onClick={deleteAccount}>
                      {deletionLoading ? <CircularLoader size={35} /> : "Confirm"}
                    </button>
                    <Dialog.Close asChild>
                      <button data-type={"cancel"}>Cancel</button>
                    </Dialog.Close>
                  </div>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    );
  };

  const setActive = (e) => {
    e.target.dataset.label && setPage(e.target.dataset.label);
  };
  return (
    <div className="update-profile">
      <div className="update-profile__header">
        <ul onClick={setActive}>
          <li data-active={renderedPage === "profile"} data-label="profile">
            Profile
          </li>
          <li data-active={renderedPage === "services"} data-label="services">
            Services
          </li>
          <li data-active={renderedPage === "delete"} data-label="delete">
            Delete Account
          </li>
        </ul>
        <Dialog.Close className="closeBtn">
          <Cross1Icon width={20} height={20} />
        </Dialog.Close>
      </div>
      <div className="update-profile__body">{{ profile: <UpdateForm userAccount={userAccount} />, services: <Services userAccount={userAccount} />, delete: renderAccountDeletion() }[renderedPage] || "NOTHING TO SHOW"}</div>
    </div>
  );
}

function BlockedListData() {
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
}

export default ProfileOptionDialog;
