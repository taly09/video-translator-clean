// src/App.jsx
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { UserProvider, useUser } from "@/context/UserContext";
import { ThemeProvider } from "@/components/ThemeProvider";
// ⚠️ אין PrivateRoute יותר
// import PrivateRoute from "@/components/PrivateRoute";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Layout from "./Pages/Layout";
import Landing from "./Pages/Landing";
// אם לא צריך לוגין בכלל, אפשר למחוק גם את הקובץ LoginPage ואת ה־Route שלו
// import LoginPage from "./Pages/Login";
import Pricing from "./Pages/Pricing";
import UploadPage from "./Pages/Upload";
import Dashboard from "./Pages/Dashboard";
import Transcriptions from "./Pages/Transcriptions";
import Studio from "./Pages/Studio";
import TranscriptionResult from "./Pages/TranscriptionResult";
import SettingsPage from "./Pages/SettingsPage";
import LiveTranscription from "./Pages/LiveTranscription";
import UploadTest from "./Pages/UploadTest";
import UploadSimpleTest from "./Pages/UploadSimpleTest";
import PreviewPage from "./Pages/PreviewPage";
import TranscriptionList from "./Pages/TranscriptionList";

import "./style/video.css";

const queryClient = new QueryClient();

// טיפול ב־?logged_in=true (אפשר להשאיר, לא מפריע גם לאורחים)
function AutoLoginHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loadUser } = useUser();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("logged_in") === "true") {
      loadUser();
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, loadUser, navigate, location.pathname]);

  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <UserProvider>
            <AutoLoginHandler />

            <Layout>
              <Routes>
                <Route path="/" element={<Landing />} />
                {/* אם לא רוצים עמוד לוגין בכלל — נמחק את ה־Route */}
                {/* <Route path="/login" element={<LoginPage />} /> */}
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/upload" element={<UploadPage />} />

                {/* כל המסלולים פתוחים, בלי PrivateRoute */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/transcriptions" element={<Transcriptions />} />
                <Route path="/studio" element={<Studio />} />
                <Route path="/transcriptions/:taskId" element={<TranscriptionResult />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/live" element={<LiveTranscription />} />
                <Route path="/upload-test" element={<UploadTest />} />
                <Route path="/upload-simple-test" element={<UploadSimpleTest />} />
                <Route path="/preview" element={<PreviewPage />} />
                <Route path="/transcription-list" element={<TranscriptionList />} />
              </Routes>
            </Layout>

            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              closeOnClick
              pauseOnHoverךםען
              draggable
              theme="dark"
            />
          </UserProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
