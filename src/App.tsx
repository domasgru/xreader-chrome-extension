import AppContent from "./app-content";
import { TweetsProvider } from "./context/tweets-context";
import GlobalStyles from "./global-styles";

export default function App() {
  return (
    <TweetsProvider>
      <GlobalStyles />
      <AppContent />
    </TweetsProvider>
  );
}
