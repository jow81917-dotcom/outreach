import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Prospects from './pages/Prospects';
import ProspectDetail from './pages/ProspectDetail';
import FollowUps from './pages/FollowUps';
import Activity from './pages/Activity';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/prospects" element={<Prospects />} />
        <Route path="/prospects/:id" element={<ProspectDetail />} />
        <Route path="/followups" element={<FollowUps />} />
        <Route path="/activity" element={<Activity />} />
      </Routes>
    </Layout>
  );
}
