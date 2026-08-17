import { WallpaperProvider } from "./context/WallpaperContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Navigate, Route, Routes, useNavigate } from "react-router";
import LobbyPage from "./pages/LobbyPage";
import ChatRoomPage from "./pages/ChatRoomPage";
import ConversationEndedPage from "./pages/ConversationEndedPage";
import AuthPage from "./pages/AuthPage";
import { useAuth } from "@clerk/react";
import PageLoader from "./components/PageLoader";
import { useAuthStore } from "./store/useAuthStore";
import { useChatStore } from "./store/useChatStore";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";

function App() {
  const { isSignedIn, isLoaded } = useAuth();

  const clearAuth = useAuthStore((s) => s.clearAuth);
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const isCheckingAuth = useAuthStore((s) => s.isCheckingAuth);
  const activeConversation = useChatStore((s) => s.activeConversation);

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) checkAuth();
    else clearAuth();
  }, [checkAuth, clearAuth, isLoaded, isSignedIn]);

  if (!isLoaded || (isSignedIn && isCheckingAuth)) return <PageLoader />;

  return (
    <ThemeProvider>
      <WallpaperProvider>
        <Routes>
          {/* Auth */}
          <Route
            path="/auth"
            element={!isSignedIn ? <AuthPage /> : <Navigate to="/" replace />}
          />

          {/* Lobby */}
          <Route
            path="/"
            element={isSignedIn ? <LobbyPage /> : <Navigate to="/auth" replace />}
          />

          {/* Active chat room — only accessible with an active conversation */}
          <Route
            path="/chat"
            element={
              isSignedIn
                ? activeConversation
                  ? <ChatRoomPage />
                  : <Navigate to="/" replace />
                : <Navigate to="/auth" replace />
            }
          />

          {/* Post-conversation screen */}
          <Route
            path="/ended"
            element={isSignedIn ? <ConversationEndedPage /> : <Navigate to="/auth" replace />}
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-center" />
      </WallpaperProvider>
    </ThemeProvider>
  );
}

export default App;