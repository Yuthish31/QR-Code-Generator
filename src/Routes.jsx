import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import FileUploader from "./FileUploader";
import SystemPage from "./SystemPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FileUploader />} />
        <Route path="/system/:id" element={<SystemPage />} />
      </Routes>
    </Router>
  );
}

export default App;