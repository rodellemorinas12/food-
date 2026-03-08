import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ColorModeContext, useMode } from "./theme";

// Layout components
import { Topbar, Sidebar } from "./components/layout";

// Page components
import { Dashboard, Orders, Menu, Onboarding, Earnings, Auth } from "./pages";

function App() {
  const [theme, colorMode] = useMode();
  const [isSidebar, setIsSidebar] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = checking
  const [redirectPath, setRedirectPath] = useState(null);

  useEffect(() => {
    // Check if user is authenticated
    const auth = localStorage.getItem("isAuthenticated");
    const redirect = localStorage.getItem("redirectAfterAuth");
    const merchantSubmitted = localStorage.getItem("merchantSubmitted");
    const merchantStatus = localStorage.getItem("merchantStatus");
    
    if (auth === "true") {
      setIsAuthenticated(true);
      // If merchant hasn't submitted onboarding with documents yet, redirect to onboarding
      // merchantSubmitted is "false" or null/undefined means they need to complete onboarding
      if (merchantSubmitted !== "true") {
        setRedirectPath("/onboarding");
      }
      // If merchant submitted but not yet approved, redirect to onboarding
      // Handle both "active" and "approved" status
      else if (merchantStatus && merchantStatus.toLowerCase() !== "active" && merchantStatus.toLowerCase() !== "approved") {
        setRedirectPath("/onboarding");
      } else if (redirect) {
        setRedirectPath(redirect);
        localStorage.removeItem("redirectAfterAuth");
      }
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  // Show loading while checking auth
  if (isAuthenticated === null) {
    return null;
  }

  // If not authenticated, show auth page
  if (!isAuthenticated) {
    return (
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Routes future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Route path="/auth" element={<Auth />} />
            <Route path="*" element={<Navigate to="/auth" replace />} />
          </Routes>
        </ThemeProvider>
      </ColorModeContext.Provider>
    );
  }

  // Authenticated app
  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className="app">
          <Sidebar isSidebar={isSidebar} />
          <main className="content">
            <Topbar isSidebar={isSidebar} setIsSidebar={setIsSidebar} />
            <Routes future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <Route path="/" element={redirectPath ? <Navigate to={redirectPath} replace /> : <Dashboard />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/earnings" element={<Earnings />} />
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to={redirectPath || "/"} replace />} />
            </Routes>
          </main>
        </div>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
