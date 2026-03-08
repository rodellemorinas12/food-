import { useState, memo } from "react";
import { Routes, Route } from "react-router-dom";
import Topbar from "./scenes/global/Topbar";
import Sidebar from "./scenes/global/Sidebar";
import Dashboard from "./scenes/dashboard";
import Team from "./scenes/team";
import Invoices from "./scenes/invoices";
import Contacts from "./scenes/contacts";
import Bar from "./scenes/bar";
import Form from "./scenes/form";
import Line from "./scenes/line";
import Pie from "./scenes/pie";
import FAQ from "./scenes/faq";
import Geography from "./scenes/geography";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ColorModeContext, useMode } from "./theme";
import Calendar from "./scenes/calendar/calendar";
import ErrorBoundary from "./components/ErrorBoundary";
import Orders from "./scenes/orders";
import Customers from "./scenes/customers";
import Riders from "./scenes/riders";
import Merchants from "./scenes/merchants";
import CommissionSettings from "./scenes/commissions";
import Support from "./scenes/support";

// Memoized components for performance
const MemoizedTopbar = memo(Topbar);
const MemoizedSidebar = memo(Sidebar);

function App() {
  const [theme, colorMode] = useMode();
  const [isSidebar, setIsSidebar] = useState(true);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className="app">
          <ErrorBoundary>
            <MemoizedSidebar isSidebar={isSidebar} />
            <main className="content">
              <MemoizedTopbar setIsSidebar={setIsSidebar} />
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/team" element={<Team />} />
                <Route path="/contacts" element={<Contacts />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/form" element={<Form />} />
                <Route path="/bar" element={<Bar />} />
                <Route path="/pie" element={<Pie />} />
                <Route path="/line" element={<Line />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/geography" element={<Geography />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/riders" element={<Riders />} />
                <Route path="/merchants" element={<Merchants />} />
                <Route path="/commissions" element={<CommissionSettings />} />
                <Route path="/support" element={<Support />} />
              </Routes>
            </main>
          </ErrorBoundary>
        </div>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default memo(App);
