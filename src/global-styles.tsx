import { Global, css } from "@emotion/react";
import emotionReset from "emotion-reset";

export default function GlobalStyles() {
  return (
    <Global
      styles={css`
        ${emotionReset}
        *, *::after, *::before {
          box-sizing: border-box;
          -moz-osx-font-smoothing: grayscale;
          -webkit-font-smoothing: antialiased;
          font-smoothing: antialiased;
          font-family: "TwitterChirp", sans-serif;
        }
        button,
        input,
        textarea {
          border: none;
          outline: none;
          background: none;
          font-family: inherit;
          padding: 0;
          margin: 0;
        }
      `}
    />
  );
}
