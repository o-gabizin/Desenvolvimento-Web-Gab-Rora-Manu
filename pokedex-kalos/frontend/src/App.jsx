import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dex from './pages/Dex';
import Times from './pages/Times';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Dex />} />
        <Route path="/times" element={<Times />} />
      </Routes>
    </>
  );
}

export default App;