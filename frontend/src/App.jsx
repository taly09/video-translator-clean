import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "@/context/UserContext";
import { ThemeProvider } from "@/components/ThemeProvider"; // 👈 הוספה חשובה
import PrivateRoute from "@/components/PrivateRoute";

import Layout from "./Pages/Layout";
import Landing from "./Pages/Landing";
import UploadPage from "./Pages/Upload";
import Dashboard from "./Pages/Dashboard";
import Transcriptions from "./Pages/Transcriptions";
import LoginPage from "./Pages/Login";
import TranscriptionView from "./Pages/TranscriptionView";
import SettingsPage from "./Pages/SettingsPage";
import LiveTranscription from "./Pages/LiveTranscription";
import UploadTest from "./Pages/UploadTest";
import UploadSimpleTest from "./Pages/UploadSimpleTest";
import Pricing from "./Pages/Pricing";

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider> {/* 👈 עוטף הכל כדי לאפשר useTheme */}
        <UserProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/pricing" element={<Pricing />} />

              {/* Protected Routes */}
              <Route path="/upload" element={<PrivateRoute><UploadPage /></PrivateRoute>} />
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/transcriptions" element={<PrivateRoute><Transcriptions /></PrivateRoute>} />
              <Route path="/TranscriptionView" element={<PrivateRoute><TranscriptionView /></PrivateRoute>} />
              <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
              <Route path="/live" element={<PrivateRoute><LiveTranscription /></PrivateRoute>} />
              <Route path="/upload-test" element={<PrivateRoute><UploadTest /></PrivateRoute>} />
              <Route path="/upload-simple-test" element={<PrivateRoute><UploadSimpleTest /></PrivateRoute>} />
            </Routes>
          </Layout>
        </UserProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
