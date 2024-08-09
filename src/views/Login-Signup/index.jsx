import { Link, Outlet, redirect, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import "./login_signup.sass";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { CircularLoader } from "hd-ui";
import { getLoginStateToken, setLoginStateToken, useDebounce, useUniqueRequest } from "../../utils";
import ImageSelector from "../../components/Common/ImageSelector";
import CCSignupPoint, { setSignupAuthToken } from "../../client/signup_api";
import { Cross2Icon } from "@radix-ui/react-icons";

const maxSignupSteps = 3;
const emailRegEx = /^[\w.!#$%&'*+/=?^_`{|}~-]+@[\w-]+(\.[\w-]+)+$/;

const LoginContent = () => {
  const [loginProgress, setProgress] = useState(false);
  const navigate = useNavigate();
  const {
    state: [errorState, updateError],
    AuthButton,
  } = useOutletContext();

  const loginHandler = async (e) => {
    e.preventDefault();
    const [username, password] = [e.target.username.value?.trim()?.toLowerCase(), e.target.password.value?.trim()];
    if (username.length > 3 && password.length > 0) {
      try {
        setProgress(true);
        const response = await axios.post(`${import.meta.env.CC_ServerDomain}/login`, {
          username,
          password,
        });
        if (response.data?.success) {
          updateError({ showError: false, message: "" });
          setLoginStateToken(response.data.data);
          navigate("/app");
        } else {
          updateError({ message: response.data.message, showError: true });
          setProgress(false);
        }
      } catch (e) {
        updateError({ showError: true, message: "Something's wrong!" });
        console.error("LoginFailed:", e);
        setProgress(false);
      }
    }
  };

  return (
    <form onSubmit={loginHandler} className="login-form">
      <input type="text" name="username" id="username" placeholder="Username or Email" data-error={errorState.showError} spellCheck={false} autoComplete="username" />
      <input type="password" name="password" id="password" placeholder="Password" data-error={errorState.showError} autoComplete="current-password" />
      <div className="forgot-password-cta">Forgot Password?</div> {/*//TODO: Forgot password popup */}
      <div className="action-buttons">
        <button type="submit" className="cta" style={loginProgress ? { pointerEvents: "none" } : {}} data-in_progress={loginProgress}>
          {loginProgress ? <CircularLoader size={30} riderColor="#fff" /> : "Login"}
        </button>
        <Link className="cta" to="/signup">
          Signup
        </Link>
      </div>
      <br />
      <div style={{ fontSize: "small", fontStyle: "italic", margin: "auto" }}>Or</div>
      <br />
      {AuthButton}
    </form>
  );
};

const SignupContent = () => {
  const {
    state: [errorState, updateError],
    dataForSignup,
  } = useOutletContext();
  const navigate = useNavigate();
  const emailModal = useRef(null);
  const emailInput = useRef(null);
  const imageBlob = useRef(null);
  const step1Form = useRef(null);
  const imageProgressBar = useRef(null);
  const [signupFlags, setSignupFlags] = useState({
    step: 0,
    usernameAvailable: null,
    verifiedEmail: false,
    allowedSignup: false, // Changes based on upload status of profile picture
  });
  const [showVerification, setShowVerification] = useState(false);

  const [progressIn, setProgress] = useState({
    checkingUsername: false,
    signup: false,
    emailVerification: false,
    codeVerification: false,
  });

  const [signupFormState, setSignupForm] = useState({
    usernameSelected: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    about: "",
    hasImage: false,
    oAuth: false,
  });
  useEffect(() => {
    if (dataForSignup) {
      setSignupForm((state) => ({
        ...state,
        firstName: dataForSignup.firstName,
        lastName: dataForSignup.lastName || "",
        email: dataForSignup.email,
        oAuth: {
          service: "google",
          email: dataForSignup.email,
        },
      }));
      step1Form.current.firstname.value = dataForSignup.firstName;
      step1Form.current.lastname.value = dataForSignup.lastName || "";
      step1Form.current.email.value = dataForSignup.email;
      if (dataForSignup.emailVerified) {
        setSignupAuthToken(dataForSignup.token);
        setSignupFlags((state) => ({ ...state, verifiedEmail: true, step: 1 }));
      }
    }
  }, [dataForSignup, step1Form.current]);

  const [dialogError, setDialogError] = useState("");

  const fetchOnce = useUniqueRequest(CCSignupPoint);
  const usernameChecker = useDebounce(async (e) => {
    const value = e.target.value?.trim()?.toLowerCase();
    updateError({ showError: false, message: "" });
    setSignupFlags((state) => ({ ...state, usernameAvailable: null }));
    if (/^[a-zA-Z0-\_\.]{3,20}$/.test(value)) {
      try {
        setProgress((state) => ({ ...state, checkingUsername: true }));
        const { success, data, message } = await fetchOnce(`/username_checker?username=${value}`, "GET");
        if (success && data.available) {
          setSignupFlags((state) => ({ ...state, usernameAvailable: "available" }));
          setSignupForm((state) => ({ ...state, usernameSelected: value }));
          updateError({ showError: false });
        } else {
          setSignupFlags((state) => ({ ...state, usernameAvailable: "unavailable" }));
          setSignupForm((state) => ({ ...state, usernameSelected: "" }));
          setSignupFlags((state) => ({ ...state, step: 1 }));
        }
      } catch (e) {
        console.error("UsernameCheckFailed: ", e);
        if (e.code !== "ERR_CANCELED") updateError({ showError: true, message: "Something went wrong! Please try later" });
      } finally {
        setProgress((state) => ({ ...state, checkingUsername: false }));
      }
    } else {
      updateError({ showError: true, message: "Username should be alphanumeric (including . and _ ) and between 3 to 20 letters" });
      setSignupForm((state) => ({ ...state, usernameSelected: "" }));
      setSignupFlags((state) => ({ ...state, step: 1 }));
    }
  }, 1000);

  function signupSlideHandler(type) {
    if (type === "back" && signupFlags.step > 0) {
      setSignupFlags((state) => ({ ...state, step: state.step - 1 }));
    } else if (type === "forth" && signupFlags.step <= maxSignupSteps) {
      setSignupFlags((state) => ({ ...state, step: state.step + 1 }));
    }
  }

  const openDialog = () => {
    emailModal.current.showModal();
  };
  const closeDialog = () => {
    emailModal.current.close();
  };

  const renderNextCTA = (
    // @attr disabled is used for the first form [disabled button till username validates]
    <button type="submit" style={{ marginLeft: "auto" }} className="travel-button">
      Next
    </button>
  );

  const submitHandler = (e) => {
    e.preventDefault();
    updateError({ showError: false, message: "" });
    const form = e.target;
    switch (form.dataset.name) {
      case "user-info":
        if (form.firstname.value && form.email.value && signupFlags.verifiedEmail) {
          signupSlideHandler("forth");
          setSignupForm((state) => ({ ...state, firstName: form.firstname.value, lastName: form.lastname.value || "", email: form.email.value }));
        } else if (!signupFlags.verifiedEmail) {
          updateError({ showError: true, message: "Email verification required!" });
        }
        break;
      case "user-credentials":
        if (form.password.value !== "" && form.username.value && signupFlags.usernameAvailable === "available") {
          signupSlideHandler("forth");
          setSignupForm((state) => ({ ...state, password: form.password.value, about: form.about.value || "" }));
        } else if (form.password.value === "") {
          updateError({ showError: true, message: "Please create a new password" });
        } else {
          updateError({ showError: true, message: "A valid username is required!" });
        }
        break;
      default:
        setSignupFlags({ step: 0, usernameAvailable: null });
        window.alert("Something is wrong, please retry signing up");
    }
  };

  const imageBlobHandler = (blob) => {
    setSignupForm((state) => ({ ...state, hasImage: blob ? true : false }));
    if (blob) {
      imageBlob.current = blob;
    }
  };

  const allowVerification = (e) => {
    if (e.target.value && emailRegEx.test(e.target.value)) {
      updateError({ showError: false, message: "" });
      setShowVerification(true);
    } else {
      updateError({ showError: true, message: "Invalid email!" });
      setShowVerification(false);
    }
  };
  const openVerifierModal = (e) => {
    openDialog();
    setProgress((state) => ({ ...state, emailVerification: true }));
    updateError({ showError: false, message: "" });
    setDialogError("");
    axios
      .post(`${import.meta.env.CC_ServerDomain}/email_verifier`, { emailAddress: emailInput.current.value?.trim(), resend: e.resend || false })
      .then((res) => {
        const { message, error } = res.data;
        if (error) {
          closeDialog();
          updateError({ showError: true, message: message });
        }
      })
      .catch((err) => {
        console.error(err);
        updateError({ showError: true, message: "Unable to verify Email, please try later!" });
        closeDialog();
      })
      .finally(() => {
        setProgress((state) => ({ ...state, emailVerification: false }));
      });
  };

  const signupHandler = async () => {
    setProgress((state) => ({ ...state, signup: true }));
    try {
      const response = await CCSignupPoint.post("/register", signupFormState);
      if (response.success) {
        setLoginStateToken(response.data.token || response.data);
        if (imageBlob.current && response.data.signedURL) {
          await axios.put(response.data.signedURL, imageBlob.current, {
            headers: {
              "Content-Type": imageBlob.current.type,
            },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              imageProgressBar.current?.style.setProperty("max-width", `${percentCompleted.toFixed(2)}%`);
              console.log(percentCompleted);
            },
          });
        }
        navigate("/app");
      } else {
        throw new Error(response.data || response.message);
      }
    } catch (e) {
      setProgress((state) => ({ ...state, signup: false }));
      updateError({ showError: true, message: e });
      throw new Error("Something went wrong, please try again!");
    }
  };

  return (
    <>
      <div className="signup-steps-container">
        {new Array(maxSignupSteps).fill(0).map((value, index) => (
          <div key={index} className="signup-step" data-active={index === signupFlags.step}></div>
        ))}
      </div>
      <div style={{ transition: "transform 0.4s ease", height: "100%", width: "100%", transform: `translateX(-${signupFlags.step * 100}%)` }}>
        <dialog className="email-verification-modal" ref={emailModal} aria-modal={true}>
          <button className="email-verification-modal__close" onClick={closeDialog}>
            <Cross2Icon height={30} width={30} />
          </button>
          <div className="email-verification-modal__container">
            {progressIn.emailVerification ? (
              <CircularLoader size={40} />
            ) : (
              <form
                method="dialog"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (e.target.code.value) {
                    setProgress((state) => ({ ...state, codeVerification: true }));
                    axios
                      .post(`${import.meta.env.CC_ServerDomain}/email_verifier`, {
                        emailAddress: emailInput.current.value?.trim(),
                        code: e.target.code.value,
                      })
                      .then((res) => {
                        const { data, success } = res.data;
                        if (success) {
                          setSignupAuthToken(data);
                          updateError({ showError: false });
                          setSignupFlags((state) => ({ ...state, verifiedEmail: true }));
                          emailModal.current.close(true);
                        } else {
                          setDialogError("Invalid OTP!");
                        }
                      })
                      .catch((err) => {
                        setDialogError("Something went wrong!");
                        console.log("EmailVerificationError:", err);
                      })
                      .finally(() => {
                        setProgress((state) => ({ ...state, codeVerification: false }));
                      });
                  }
                }}
              >
                <div className="modal-heading">Email Authentication</div>
                <hr />
                <p>
                  Enter the OTP from the email{" "}
                  <strong>
                    <em>{emailInput.current?.value}</em>
                  </strong>
                  .
                  <br />
                  If not received, check spam/junk folder.
                </p>
                {dialogError && <div className="verification__error">{dialogError}</div>}
                <input id="otp-code" type="text" placeholder="OTP" name="code" autoFocus data-error={dialogError && true} />
                <div className="action-button">
                  <button type="submit">{progressIn.codeVerification ? <CircularLoader size={20} riderColor="white" /> : "Submit"}</button>
                  <button className="resend-otp" onClick={() => openVerifierModal({ resend: true })}>
                    Resend OTP
                  </button>
                </div>
              </form>
            )}
          </div>
        </dialog>
        <div className="signup-input">
          <form className={`user-info-input ${signupFlags.step === 0 && "active"}`} onSubmit={submitHandler} data-name="user-info" ref={step1Form}>
            <div>
              <input type="email" name="email" spellCheck={false} placeholder="Your Email address" required autoFocus onBlur={allowVerification} onChange={() => !signupFlags.verifiedEmail && setSignupFlags((state) => ({ ...state, verifiedEmail: false }))} ref={emailInput} disabled={signupFlags.verifiedEmail} />{" "}
              {showVerification &&
                (signupFlags.verifiedEmail ? (
                  <span className="email-verifier notify">Verified</span>
                ) : (
                  <button type="button" className="email-verifier btn" onClick={openVerifierModal}>
                    Not Verified
                  </button>
                ))}
            </div>
            <div className="name-container">
              <input type="text" name="firstname" spellCheck={false} placeholder="First Name" required /> <input type="text" name="lastname" spellCheck={false} placeholder="Last Name" />
            </div>
            <div className="route-ctas">{renderNextCTA}</div>
            <div className="action-buttons">
              Already has an account?
              <br />
              <br />
              <Link to="/login" className="cta">
                Login
              </Link>
            </div>
          </form>

          <form className={`user-credentials-input ${signupFlags.step === 1 && "active"}`} onSubmit={submitHandler} data-name="user-credentials">
            <div className="username-container">
              <input type="text" name="username" placeholder="Select a username" data-valid={signupFlags.usernameAvailable === "available"} spellCheck={false} onChange={usernameChecker} autoFocus />
              {progressIn.checkingUsername && (
                <span>
                  <CircularLoader size={15} riderColor="#fff" />
                </span>
              )}
            </div>
            <input type="password" name="password" placeholder="Create a new password" autoComplete="current-password" />
            <input type="text" name="about" placeholder="About" defaultValue={"Hey! I am new to Chit-Chat"} />

            <div className="route-ctas">
              <div className={`availability  ${signupFlags.usernameAvailable !== null && signupFlags.usernameAvailable}`}>{signupFormState.usernameSelected !== "" && signupFlags.usernameAvailable === "available" ? `Username available!` : signupFlags.usernameAvailable === "unavailable" ? `Username not available!` : ""}</div>
              {renderNextCTA}
            </div>
          </form>

          <form className={`user-picture ${signupFlags.step === 2 && "active"}`} data-name="user-picture">
            <ImageSelector style={{ margin: "auto", height: "fit-content", width: "100%" }} blobHandler={imageBlobHandler} />

            <div className="action-buttons">
              <div className="cta" style={(progressIn.signup && { pointerEvents: "none" }) || {}} onClick={signupHandler} data-in_progress={progressIn.signup}>
                <div className="progress_bar" ref={imageProgressBar}></div>
                {progressIn.signup ? <CircularLoader size={30} riderColor="#fff" /> : "Signup"}
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

const LandingPage = () => {
  const [errorState, updateError] = useState({ showError: false, message: "" });
  const location = useLocation();
  const navigate = useNavigate();
  const gSigninButton = useRef();
  const signUpOAuthData = useRef(null);
  const [authInProgress, setAuthInProgress] = useState(false);
  useEffect(() => {
    document.title = "Login/Signup - Chit Chat";
    if (location.pathname === "/") {
      navigate("/login");
    }
    updateError({ showError: false, message: "" });
  }, [location.pathname]);

  useEffect(() => {
    // if (location.pathname !== "/login" || location.pathname !== "/signup") return;
    if (window.google) {
      google.accounts.id.initialize({
        client_id: import.meta.env.CC_OAuthClientID,
        callback: handleOAuth,
      });
      google.accounts.id.renderButton(gSigninButton.current, { theme: "filled_blue", size: "large", text: "continue_with", type: "standard", shape: "rectangular", logo_alignment: "center", width: "295" });
      google.accounts.id.prompt(); // also display the One Tap dialog
    }
  }, [gSigninButton, window.google, location.pathname]);

  const handleOAuth = async (data) => {
    if (data?.credential) {
      setAuthInProgress(true);
      try {
        const response = await axios.post(`${import.meta.env.CC_ServerDomain}/oauth_process`, { credential: data.credential });
        if (response.data) {
          switch (response.data.message) {
            case "login":
              setLoginStateToken(response.data.data);
              navigate("/app");
              break;
            case "signup":
              signUpOAuthData.current = response.data.data;
              navigate("/signup");
              break;
          }
        }
      } catch (e) {
        console.log("OathError", e);
        setAuthInProgress(false);
        updateError({ showError: true, message: "Something went wrong. Try again later!" });
      }
    }
  };

  return (
    <div className="chit-chat-login-signup">
      <section className="chit-chat-info chit-chat-logo">
        <h1>Chit Chat</h1>
        <p>Connecting people through conversations: Join the Chit Chat community and start chatting with friends and loved ones.</p>
      </section>
      <div className={`login-form-container ${location.pathname === "/signup" && "full-width"}`}>
        <section className="chit-chat-info mobile">
          <h1>Chit Chat</h1>
        </section>
        <h2>Login/Signup</h2>
        <div className="user-form" data-forpage={location.pathname.replace("/", "")}>
          {errorState.showError && <div className="error-message">{errorState.message}</div>}
          <Outlet
            context={{
              state: [errorState, updateError],
              AuthButton: (
                <>
                  {authInProgress && <CircularLoader size={40} riderColor="lightgrey" />}
                  <div className="signin_cta" ref={gSigninButton} style={{ colorScheme: "light" }} aria-hidden={authInProgress}></div>
                </>
              ),
              dataForSignup: signUpOAuthData.current,
            }}
          />
        </div>
      </div>
    </div>
  );
};

const landingPageLoader = () => {
  const loginToken = getLoginStateToken();
  if (loginToken) {
    return redirect("/app");
  }
  return null;
};

export { LandingPage, LoginContent, SignupContent, landingPageLoader };
