
import './App.css';
import Layout from './Layout/Layout';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Ensure the CSS is imported

function App() {
  return (
    <>
      <Layout />
      <ToastContainer />
    </>
  );
}

export default App;
