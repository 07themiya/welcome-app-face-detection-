import { BrowserRouter, Routes, Route } from "react-router-dom";
import Welcome from "./pages/Welcome";
import Register from "./pages/Register";
import Appointment from "./pages/Appointment";
import AppointmentHistory from "./pages/ApointmentHistory";
// import Welcome3D from "./pages/facedetection3D";
// import Register3D from "./pages/Register3D";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/appointment" element={<Appointment />} />
        <Route path="/appointment-history" element={<AppointmentHistory />} />
        <Route path="/register" element={<Register />} />

        {/* <Route path="/" element={<Welcome3D />} />
        <Route path="/appointment" element={<Appointment />} />
        <Route path="/register" element={<Register3D />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
