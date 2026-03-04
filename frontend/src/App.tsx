import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LandingPage } from './components/LandingPage';
import { ReaderView } from './components/ReaderView';
import { Dashboard } from './components/Dashboard';
import { ProcessingView } from './components/ProcessingView';
import './App.css';

const LandingWrapper = () => {
  const navigate = useNavigate();
  return <LandingPage onUpload={() => navigate('/dashboard')} />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingWrapper />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/processing/:id" element={<ProcessingView />} />
          <Route path="/reader/:id" element={<ReaderView />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
