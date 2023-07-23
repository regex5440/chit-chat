import { Link, Outlet, useLocation, useNavigate, useNavigation, useOutletContext } from "react-router-dom";
import "./login_signup.sass";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { CircularLoader } from "hd-ui";
import { useDebounce, useUniqueGet } from "../../../utils";
import ImageSelector from "../Common/ImageSelector";

const maxSignupSteps = 3;
const emailRegEx = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

const LoginContent = () => {
  const [loginProgress, setProgress] = useState(false);
  const [errorState, updateError] = useOutletContext();

  const loginHandler = async (e) => {
    e.preventDefault();
    const [username, password] = [e.target.username.value, e.target.password.value];
    if (username.length > 3 && password.length > 0) {
      try {
        setProgress(true);
        const response = await axios.post(`${import.meta.env.VITE_CC_ServerDomain}/login`, {
          username,
          password,
        });
        if (response.status === 202) {
          updateError({ showError: false, message: "" });
          localStorage.setItem(`user.auth.token`, response.data.token);
          navigate("/app");
        } else {
          updateError({ message: response.data, showError: true });
        }
      } catch (e) {
        updateError({ showError: true, message: "Something's wrong!" });
      } finally {
        setProgress(false);
      }
    }
  };

  return (
    <form onSubmit={loginHandler} className="login-form">
      <input type="text" name="username" id="username" placeholder="Username or Email" data-error={errorState.showError} spellCheck={false} />
      <input type="password" name="password" id="password" placeholder="Password" data-error={errorState.showError} />
      <div className="forgot-password-cta">Forgot Password?</div> {/*//TODO: Forgot password popup */}
      <div className="action-buttons">
        <button type="submit" className="cta" style={loginProgress ? { pointerEvents: "none" } : {}}>
          {loginProgress ? <CircularLoader width={30} loaderColor="#fff" /> : "Login"}
        </button>
        <Link className="cta" to="/signup">
          Signup
        </Link>
      </div>
    </form>
  );
};

const SignupContent = () => {
  const [errorState, updateError] = useOutletContext();
  const emailModal = useRef(null);
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
  });

  const [signupFormState, setSignupForm] = useState({
    usernameSelected: "",
    firstname: "",
    lastname: "",
    email: "",
    password: "",
  });

  const backButtonOnPicturePage = useRef(null);
  const signupButton = useRef(null);

  useEffect(() => {
    if (signupFlags.allowedSignup) {
      backButtonOnPicturePage.current.style = `transition: transform 0.3s ease-in, opacity 0.3s ease-in; transform: translate(0, -10px) rotate3d(1, 0, 0, 30deg); opacity: 0`;
      new Promise((resolve) => {
        setTimeout(() => {
          backButtonOnPicturePage.current.style.display = "none";
          signupButton.current.style.display = "block";
          resolve();
        }, 300);
      })
        .then(() => {
          signupButton.current.style.opacity = `1`;
        })
        .then(() => {
          signupButton.current.style.transform = `translateY(-36px)`;
        });
    }
  }, [signupFlags.allowedSignup]);

  const fetchOnce = useUniqueGet();
  const usernameChecker = useDebounce(async (e) => {
    const value = e.target.value;
    updateError({ showError: false, message: "" });
    setSignupFlags((state) => ({ ...state, usernameAvailable: null }));
    if (/^[a-zA-Z0-\_\.]{3,20}$/.test(value)) {
      try {
        setProgress((state) => ({ ...state, checkingUsername: true }));
        const response = await fetchOnce(`${import.meta.env.VITE_CC_ServerDomain}/username_checker?username=${value}`, {
          Headers: {
            // Authentication: `Bearer ${localStorage.getItem()}`, // TODO: AUTH TOKEN REQUIRED
          },
        });
        console.log(response);
        if (response.data.available) {
          setSignupFlags((state) => ({ ...state, usernameAvailable: "available" }));
          setSignupForm((state) => ({ ...state, usernameSelected: e.target.value }));
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

  const renderNextCTA = (
    // @attr disabled is used for the first form [disabled button till username validates]
    <button type="submit" style={{ marginLeft: "auto" }} className="travel-button">
      Next
    </button>
  );

  const renderBackCTA = (
    <button type="button" onClick={() => signupSlideHandler("back")} className="travel-button">
      Back
    </button>
  );

  const submitHandler = (e) => {
    e.preventDefault();
    updateError({ showError: false, message: "" });
    const form = e.target;
    switch (form.dataset.name) {
      case "user-info":
        //Username is handled by above @function usernameChecker
        if (form.firstname.value && form.username.value && signupFlags.usernameAvailable === "available") {
          signupSlideHandler("forth");
          setSignupForm((state) => ({ ...state, firstname: form.firstname.value, lastname: form.lastname.value }));
        } else {
          updateError({ showError: true, message: "A valid username is required!" });
        }
        break;
      case "user-credentials":
        if (form.password.value !== "" && signupFlags.verifiedEmail) {
          setSignupForm((state) => ({ ...state, password: form.password.value, email: form.email.value }));

          signupSlideHandler("forth");
        } else if (form.password.value === "") {
          updateError({ showError: true, message: "Please create a new password" });
        } else if (!signupFlags.verifiedEmail) {
          updateError({ showError: true, message: "Email verification required!" });
        }
        break;
      default:
        setSignupFlags({ step: 0, usernameAvailable: null });
        window.alert("Something is wrong, please retry signing up");
    }
  };

  const imageUploadHandler = (imageBlob, setProgress) => {
    let progress = 0;
    //TODO: Remove dummy setInterval
    //TODO: Add a upload function for image
    const timer = setInterval(() => {
      if (progress == 100) {
        setSignupFlags((state) => ({ ...state, allowedSignup: true }));
        clearInterval(timer);
      }
      setProgress(progress++);
    }, 50);
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
  const openVerifierModal = () => {
    emailModal.current.showModal();
    //TODO: For Dialog, Any changes in email value after verification, changes to not verified
    //TODO: On successful verification, remove the error
  };

  const signupHandler = () => {
    setProgress((state) => ({ ...state, signup: true }));
    try {
    } catch {
      setProgress((state) => ({ ...state, signup: false }));
      updateError({ showError: true, message: "Something went wrong, please try again!" });
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
        <div className="signup-input">
          <form className={`user-credentials-input ${signupFlags.step === 0 && "active"}`} onSubmit={submitHandler} data-name="user-credentials">
            <div>
              <input type="email" name="email" spellCheck={false} placeholder="Your Email address" required autoFocus onBlur={allowVerification} />{" "}
              {showVerification && (
                <button type="button" className="email-verifier-btn" onClick={openVerifierModal} data-verified={signupFlags.verifiedEmail}>
                  {signupFlags.verifiedEmail ? "Verified" : "Not Verified"}
                </button>
              )}
            </div>
            <input type="password" name="password" placeholder="Create a new password" />
            <div className="route-ctas">{renderNextCTA}</div>
            <dialog
              className="email-verification-modal"
              ref={emailModal}
              aria-modal={true}
              onClose={() => {
                setSignupFlags((state) => ({ ...state, verifiedEmail: true }));
              }}
            >
              Dialog
            </dialog>
            <div className="action-buttons">
              <Link to="/login" className="cta">
                Login
              </Link>
            </div>
          </form>

          <form className={`user-info-input ${signupFlags.step === 1 && "active"}`} onSubmit={submitHandler} data-name="user-info">
            <div className="name-container">
              <input type="text" name="firstname" spellCheck={false} placeholder="First Name" autoFocus required /> <input type="text" name="lastname" spellCheck={false} placeholder="Last Name" />
            </div>
            <div className="username-container">
              <input type="text" name="username" placeholder="Select a username" data-valid={signupFlags.usernameAvailable === "available"} spellCheck={false} onChange={usernameChecker} autoFocus />
              {progressIn.checkingUsername && (
                <span>
                  <CircularLoader width="15" loaderColor="#fff" />
                </span>
              )}
            </div>
            <div className="route-ctas">
              <div className={`availability  ${signupFlags.usernameAvailable !== null && signupFlags.usernameAvailable}`}>{signupFormState.usernameSelected !== "" && signupFlags.usernameAvailable === "available" ? `Username available!` : signupFlags.usernameAvailable === "unavailable" ? `Username not available!` : ""}</div>
              {renderNextCTA}
            </div>
          </form>

          <form className={`user-picture ${signupFlags.step === 2 && "active"}`} data-name="user-picture">
            <ImageSelector style={{ margin: "auto", height: "400px", width: "400px" }} uploadHandler={imageUploadHandler} />

            <div className="route-ctas" ref={backButtonOnPicturePage}>
              {renderBackCTA}
            </div>

            <div className="action-buttons" ref={signupButton}>
              <div className="cta" style={(progressIn.signup && { pointerEvents: "none" }) || {}} onClick={signupHandler}>
                {progressIn.signup ? <CircularLoader width={30} loaderColor="#fff" /> : "Signup"}
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

  useEffect(() => {
    document.title = "Login/Signup - Chit Chat";
    if (location.pathname === "/") {
      navigate("/login");
    }
    updateError({ showError: false, message: "" });
  }, [location.pathname]);

  const signupHandler = async (e) => {
    e.preventDefault();
    console.log("Signup");
    //TODO: Send the signup POST and configure the server to handle the same
  };

  return (
    <div className="chit-chat-login-signup">
      <section className="chit-chat-info">
        <h1>Chit Chat</h1>
        <p>Connecting people through conversations: Join the Chit Chat community and start chatting with friends and loved ones.</p>
      </section>
      <div className={`login-form-container ${location.pathname === "/signup" && "full-width"}`}>
        <h2>Login/Signup</h2>
        <div className="user-form">
          {errorState.showError && <div className="error-message">{errorState.message}</div>}
          <Outlet context={[errorState, updateError]} />
        </div>
      </div>
    </div>
  );
};

export { LandingPage, LoginContent, SignupContent };
