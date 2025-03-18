import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { Card, Button, Row, Col, Spinner, Alert, Form } from 'react-bootstrap';
import { ChartOptions } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import Chartboard from './Chartboard';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Property {
  property_id: number;
  address: string;
  owner_id: number;
}

interface Tenant {
  tenant_id: number;
  name: string;
  property_id: number;
}

interface RentCollection {
  rent_id: number;
  tenant_id: number;
  amount: number;
  payment_date: string;
}

interface Maintenance {
  maintenance_id: number;
  property_id: number;
  description: string;
  request_date: string;
  status: string;
}

const Dashboard: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [rentCollections, setRentCollections] = useState<RentCollection[]>([]);
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [ownerFilter, setOwnerFilter] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [propertiesResponse, tenantsResponse, rentResponse, maintenanceResponse] = await Promise.all([
          api.get('/api/properties'), 
          api.get('/api/tenants'),
          api.get('/api/rent-collections'),
          api.get('/api/maintenance'),
        ]);
        setProperties(propertiesResponse.data);
        setTenants(tenantsResponse.data);
        setRentCollections(rentResponse.data);
        setMaintenance(maintenanceResponse.data);
        setFilteredProperties(propertiesResponse.data);
      } catch (err) {
        setError('Failed to fetch data. Please try again later.');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let result = properties;
    if (searchTerm) {
      result = result.filter(p =>
        p.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (ownerFilter) {
      result = result.filter(p => p.owner_id.toString() === ownerFilter);
    }
    setFilteredProperties(result);
  }, [searchTerm, ownerFilter, properties]);

  const chartData = filteredProperties.length > 0
    ? {
        labels: filteredProperties.map(p => p.address.substring(0, 10)),
        datasets: [
          {
            label: 'Properties',
            data: filteredProperties.map(() => 1),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          },
          {
            label: 'Tenants',
            data: filteredProperties.map(p =>
              tenants.filter(t => t.property_id === p.property_id).length
            ),
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
          },
          {
            label: 'Maintenance Requests',
            data: filteredProperties.map(p =>
              maintenance.filter(m => m.property_id === p.property_id).length
            ),
            backgroundColor: 'rgba(255, 206, 86, 0.6)',
            borderColor: 'rgba(255, 206, 86, 1)',
            borderWidth: 1,
          },
          {
            label: 'Total Rent ($)',
            data: filteredProperties.map(p =>
              rentCollections
                .filter(r => tenants.some(t => t.tenant_id === r.tenant_id && t.property_id === p.property_id))
                .reduce((sum, r) => sum + r.amount, 0)
            ),
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
            yAxisID: 'y1',
          },
        ],
      }
    : { labels: [], datasets: [] };
    const chartOptions: ChartOptions<'bar'> = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top', // TypeScript now recognizes this as a valid literal value
          labels: { boxWidth: 12, font: { size: 12 } },
        },
        title: { display: true, text: 'Property Metrics Overview', font: { size: 16 } },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Count' },
          position: 'left',
        },
        y1: {
          beginAtZero: true,
          title: { display: true, text: 'Total Rent ($)' },
          position: 'right',
          grid: { drawOnChartArea: false },
          ticks: {
            callback: (tickValue: string | number) => {
              const value = typeof tickValue === 'string' ? parseFloat(tickValue) : tickValue;
              return `$${value.toFixed(2)}`;
            },
          },
        },
      },
    };

  if (loading) {
    return (
      <div className="text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <div>
      <Row className="mb-4">
        <Col md={6}>
          <Form.Control
            type="text"
            placeholder="Search by address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-2"
          />
        </Col>
        <Col md={6}>
          <Form.Control
            as="select"
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="mb-2"
          >
            <option value="">All Owners</option>
            {[...new Set(properties.map(p => p.owner_id))].map(ownerId => (
              <option key={ownerId} value={ownerId}>{ownerId}</option>
            ))}
          </Form.Control>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center bg-primary text-white">
            <Card.Body>
              <Card.Title>Total Properties</Card.Title>
              <Card.Text>{properties.length}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center bg-success text-white">
            <Card.Body>
              <Card.Title>Total Tenants</Card.Title>
              <Card.Text>{tenants.length}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center bg-info text-white">
            <Card.Body>
              <Card.Title>Total Rent Collected</Card.Title>
              <Card.Text>${rentCollections.reduce((sum, r) => sum + r.amount, 0).toFixed(2)}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center bg-warning text-white">
            <Card.Body>
              <Card.Title>Pending Maintenance</Card.Title>
              <Card.Text>{maintenance.filter(m => m.status === 'pending').length}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <Bar data={chartData} options={chartOptions} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row xs={1} md={2} lg={3} className="g-4">
        {filteredProperties.map(property => (
          <Col key={property.property_id}>
            <Card className="h-100 shadow-sm border-0">
              <Card.Body>
                <Card.Title className="text-primary">{property.address}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">
                  Property ID: {property.property_id}
                </Card.Subtitle>
                <Card.Text>
                  <strong>Owner ID:</strong> {property.owner_id}<br />
                  <strong>Tenants:</strong> {tenants.filter(t => t.property_id === property.property_id).length}<br />
                  <strong>Maintenance:</strong> {maintenance.filter(m => m.property_id === property.property_id).length}<br />
                  <strong>Rent Collected:</strong> ${rentCollections
                    .filter(r => tenants.some(t => t.tenant_id === r.tenant_id && t.property_id === property.property_id))
                    .reduce((sum, r) => sum + r.amount, 0)
                    .toFixed(2)}
                </Card.Text>
                <Button variant="info" size="sm" className="me-2">
                  View Details
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
      <Chartboard />
    </div>
  );
};

export default Dashboard;