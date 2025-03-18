import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import api from '../api/api';
import { Alert, Button, Spinner } from 'react-bootstrap';

interface RentCollection {
  rent_id: number;
  tenant_id: number;
  amount: number;
  payment_date: string;
}

interface Tenant {
  tenant_id: number;
  name: string;
}

interface Maintenance {
  maintenance_id: number;
  status: string;
}

const Chartboard: React.FC = () => {
  const [rentCollections, setRentCollections] = useState<RentCollection[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Define fetchData outside useEffect
  const fetchData = async () => {
    try {
      setLoading(true);
      const [rentResponse, tenantsResponse, maintenanceResponse] = await Promise.all([
        api.get('/api/rent-collections'), // Use proxy path
        api.get('/api/tenants'),          // Use proxy path
        api.get('/api/maintenance'),      // Use proxy path
      ]);
      setRentCollections(rentResponse.data);
      setTenants(tenantsResponse.data);
      setMaintenance(maintenanceResponse.data);
    } catch (err) {
      setError('Failed to fetch data for chartboard. Please try again.');
      console.error('Error fetching chart data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Prepare data for line chart (rent amount over time, aggregated by day)
  const lineData = Object.entries(
    rentCollections.reduce((acc: { [key: string]: number }, curr) => {
      const date = curr.payment_date.split('T')[0];
      acc[date] = (acc[date] || 0) + curr.amount;
      return acc;
    }, {})
  ).map(([date, total]) => ({ date, total: Number(total.toFixed(2)) }));

  // Prepare data for pie chart (rent contribution by tenant)
  const tenantTotals = rentCollections.reduce((acc: { [key: number]: number }, curr) => {
    acc[curr.tenant_id] = (acc[curr.tenant_id] || 0) + curr.amount;
    return acc;
  }, {});
  const pieData = tenants.map(tenant => ({
    name: tenant.name,
    value: tenantTotals[tenant.tenant_id] || 0,
  })).filter(d => d.value > 0);

  // Prepare data for bar chart (maintenance status distribution)
  const maintenanceStatus = maintenance.reduce((acc: { [key: string]: number }, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {});
  const barData = Object.entries(maintenanceStatus).map(([status, count]) => ({ status, count }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (loading) {
    return <div className="text-center"><Spinner animation="border" role="status"><span className="visually-hidden">Loading...</span></Spinner></div>;
  }

  if (error) {
    return (
      <div>
        <Alert variant="danger">{error}</Alert>
        <Button variant="secondary" onClick={() => fetchData()}>Retry</Button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4">Dashboard Overview</h2>
      <div className="row">
        <div className="col-md-6">
          <h3>Rent Collected Over Time</h3>
          <LineChart width={500} height={300} data={lineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
            <Legend />
            <Line type="monotone" dataKey="total" stroke="#8884d8" activeDot={{ r: 8 }} />
          </LineChart>
        </div>
        <div className="col-md-6">
          <h3>Rent Contribution by Tenant</h3>
          <PieChart width={400} height={300}>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: $${value.toFixed(2)}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
            <Legend />
          </PieChart>
        </div>
      </div>
      <div className="row mt-4">
        <div className="col-md-12">
          <h3>Maintenance Status Distribution</h3>
          <BarChart width={600} height={300} data={barData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="status" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </div>
      </div>
    </div>
  );
};

export default Chartboard;