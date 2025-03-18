import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import PropertyForm from './components/PropertyForm';
import TenantForm from './components/TenantForm';
import RentCollectionForm from './components/RentCollectionForm';
import MaintenanceForm from './components/MaintenanceForm';
import Chartboard from './components/Chartboard';

function App() {
  return (
    <Router>
      <div className="d-flex">
        <Sidebar />
        <div className="flex-grow-1 p-3" style={{ marginLeft: '250px' }}>
          <h1 className="text-center mb-4">Property Management System</h1>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chartboard" element={<Chartboard />} />
            <Route path="/properties" element={<PropertyForm />} />
            <Route path="/tenants" element={<TenantForm />} />
            <Route path="/rent-collections" element={<RentCollectionForm />} />
            <Route path="/maintenance" element={<MaintenanceForm />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;