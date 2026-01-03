import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div className="container mx-auto p-4">PriceMe - Coming Soon</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
