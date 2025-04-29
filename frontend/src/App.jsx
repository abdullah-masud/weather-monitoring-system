import Footer from "./Pages/Shared/Footer";
import Navbar from "./Pages/Shared/Navbar";
import { Outlet } from "react-router-dom";

function App() {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
}

export default App;
