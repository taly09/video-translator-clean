import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import UploadPage from "./Pages/Upload";
import Landing from "./Pages/Landing";
import Dashboard from "./Pages/Dashboard";
import Layout from "./Pages/Layout";
import SettingsPage from "./Pages/SettingsPage";
import TranscriptionView from "./Pages/TranscriptionView";
import LoginPage from "./Pages/Login";
import Transcriptions from "./Pages/Transcriptions";
import LiveTranscription from "./Pages/LiveTranscription"; // 👈 חדש
import UploadTest from "./Pages/UploadTest";
import UploadSimpleTest from "./Pages/UploadSimpleTest";
import Pricing from "./Pages/Pricing"; // ודא שהנתיב נכון






export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/TranscriptionView" element={<TranscriptionView />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/transcriptions" element={<Transcriptions />} />
            <Route path="/live" element={<LiveTranscription />} /> 👈 חדש
            <Route path="/upload-test" element={<UploadTest />} />
            <Route path="/upload-simple-test" element={<UploadSimpleTest />} />
            <Route path="/pricing" element={<Pricing />} />




        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
