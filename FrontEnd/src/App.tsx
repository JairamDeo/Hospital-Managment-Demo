
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginForm from "./auth/Login";


const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginForm/>} />
  
      </Routes>
    </Router>
  );
};

export default App;

