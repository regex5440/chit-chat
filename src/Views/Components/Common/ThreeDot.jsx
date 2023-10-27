import React, { forwardRef } from "react";
import "./style/three_dot.sass";

const ThreeDot = forwardRef(({ onClick, title }, ref) => {
  return (
    <button className="three-dot" onClick={onClick} title={title} ref={ref}>
      <span></span>
      <span></span>
      <span></span>
    </button>
  );
});

export default ThreeDot;
