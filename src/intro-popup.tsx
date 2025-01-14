import React from "react";
import { CSSObject } from "@emotion/react";
import { useUserPreferences } from "./hooks/use-user-preferences";
import { motion } from "framer-motion";
interface IntroPopupProps {
  onClose: () => void;
}

const IntroPopup: React.FC<IntroPopupProps> = ({ onClose }) => {
  const { userPreferences, setUserPreferences } = useUserPreferences();

  return (
    <motion.div layoutId="container" css={styles.introPopup}>
      <p css={styles.marginBottom16}>Welcome to xReader,</p>
      <p css={styles.marginBottom16}>
        It reads your X timeline and show you a cleaner version of it. On the
        right you see your exact X timeline - just without ads and with more
        minimal UI.
      </p>
      <div css={styles.marginBottom12}>
        Also, it write summaries for up to 3 days of your timeline content.
        Describe your interests to increase the quality of the summaries:
      </div>
      <div css={styles.inputContainer}>
        <label css={styles.label} htmlFor="interests">
          INTERESTED:
        </label>
        <textarea
          css={styles.textarea}
          id="interests"
          placeholder="art, technology, self improvement, creativity..."
          value={userPreferences.interests}
          onChange={(e) =>
            setUserPreferences((prev) => ({
              ...prev,
              interests: e.target.value,
            }))
          }
        />
      </div>
      <label css={styles.label} htmlFor="not-interested">
        NOT INTERESTED:
      </label>
      <textarea
        css={styles.textarea}
        id="not-interested"
        placeholder="jokes, memes, politics, religion, sports..."
        value={userPreferences.notInterests}
        onChange={(e) =>
          setUserPreferences((prev) => ({
            ...prev,
            notInterests: e.target.value,
          }))
        }
      />
      <motion.button css={styles.button} onClick={onClose}>
        Continue
      </motion.button>
    </motion.div>
  );
};

const styles: Record<string, CSSObject> = {
  introPopup: {
    backgroundColor: "#121314",
    color: "white",
    padding: "20px",
    borderRadius: "4px",
    width: "310px",
    flexShrink: 0,
    fontSize: "14px",
    fontWeight: "300",
    lineHeight: "calc(20/14)",
    border: "0.5px solid #2E2E2E",
    display: "flex",
    flexDirection: "column",
  },
  marginBottom16: {
    marginBottom: "16px",
  },
  marginBottom12: {
    marginBottom: "12px",
  },
  inputContainer: {
    marginBottom: "16px",
  },
  label: {
    display: "block",
    color: "#71767A",
    lineHeight: "calc(13/11)",
    fontSize: "11px",
    marginBottom: "8px",
    letterSpacing: "0.5px",
  },
  textarea: {
    width: "100%",
    backgroundColor: "#202427",
    color: "#E7E9EA",
    padding: "8px",
    border: "0.5px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "5px",
    lineHeight: "calc(18/14)",
    resize: "none",
    fontFamily: "inherit",
    fontSize: "14px",
    display: "block",
  },
  button: {
    backgroundColor: "#0E80CE",
    color: "#E7E9EA",
    padding: "10px 24px",
    border: "0.5px solid rgba(255, 255, 255, 0.26)",
    lineHeight: "calc(18/14)",
    borderRadius: "4px",
    fontWeight: "500",
    marginTop: "16px",
    marginLeft: "auto",
    "&:hover": {
      backgroundColor: "#1092EA",
    },
  },
};

export default IntroPopup;
