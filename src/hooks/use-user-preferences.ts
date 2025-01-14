import { useLocalStorage } from "usehooks-ts";
import { UserPreferences } from "../types";

const LOCAL_STORAGE_KEY = "xReaderUserPreferences";
const FALLBACK_USER_PREFERENCES = {
  interests:
    "design, art, products, technology, self improvement, creating, building",
  notInterests: "jokes, memes, politics, religion, sports",
};

export function useUserPreferences() {
  const [userPreferences, setUserPreferences] =
    useLocalStorage<UserPreferences>(
      LOCAL_STORAGE_KEY,
      FALLBACK_USER_PREFERENCES
    );

  return {
    userPreferences,
    setUserPreferences,
  };
}

export function getUserPreferences(): UserPreferences {
  const userPreferencesFromLocalStorage =
    localStorage.getItem(LOCAL_STORAGE_KEY);

  if (userPreferencesFromLocalStorage) {
    return JSON.parse(userPreferencesFromLocalStorage);
  } else {
    return FALLBACK_USER_PREFERENCES;
  }
}
