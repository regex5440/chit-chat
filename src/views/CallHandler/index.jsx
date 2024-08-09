import { useSelector } from "react-redux";
import Caller from "../../components/Call";
import { getCallUIDetails } from "../../library/redux/selectors";

const CallUIHandler = () => {
  const callUI = useSelector(getCallUIDetails);

  return (
    <>
      {callUI.showCaller && (
        <div className="caller-handler" style={{ position: "fixed", inset: 0, height: "100%", width: "100%" }} data-size={callUI.isMinimized ? "min" : "max"}>
          <Caller />
        </div>
      )}
    </>
  );
};

export default CallUIHandler;
