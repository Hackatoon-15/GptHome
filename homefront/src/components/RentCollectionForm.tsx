import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { Button, Form, Modal, Table, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';


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

const RentCollectionForm: React.FC = () => {
  const [rentCollections, setRentCollections] = useState<RentCollection[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [selectedRent, setSelectedRent] = useState<RentCollection | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rentResponse, tenantsResponse] = await Promise.all([
        api.get('/api/rent-collections'), // Use proxy path
        api.get('/api/tenants'), // Use proxy path
      ]);
      setRentCollections(rentResponse.data);
      setTenants(tenantsResponse.data);
    } catch (err) {
      setError('Failed to fetch data. Please check your connection or try again.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      const fetchRentById = async () => {
        try {
          const response = await api.get(`/api/rent-collections/${id}`); // Use proxy path
          const rent = response.data;
          setSelectedRent(rent);
          setTenantId(rent.tenant_id.toString());
          setAmount(rent.amount.toString());
          setPaymentDate(rent.payment_date.split('T')[0] || rent.payment_date); // Handle date format
          setShowEditModal(true);
        } catch (err) {
          setError(`Failed to fetch rent collection with ID ${id}.`);
          console.error('Error fetching rent collection:', err);
        }
      };
      fetchRentById();
    }
  }, [id]);

  const handleAddRentCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/rent-collections', { // Use proxy path
        tenant_id: parseInt(tenantId),
        amount: parseFloat(amount),
        payment_date: paymentDate,
      });
      setRentCollections([...rentCollections, response.data]);
      setTenantId('');
      setAmount('');
      setPaymentDate('');
      setShowAddModal(false);
    } catch (err) {
      setError('Failed to add rent collection.');
      console.error('Error adding rent collection:', err);
    }
  };

  const handleUpdateRentCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRent) {
      try {
        const response = await api.put(`/api/rent-collections/${selectedRent.rent_id}`, { // Use proxy path
          tenant_id: parseInt(tenantId),
          amount: parseFloat(amount),
          payment_date: paymentDate,
        });
        setRentCollections(rentCollections.map(r =>
          r.rent_id === selectedRent.rent_id ? response.data : r
        ));
        setShowEditModal(false);
        navigate('/rent-collections');
      } catch (err) {
        setError('Failed to update rent collection.');
        console.error('Error updating rent collection:', err);
      }
    }
  };

  const handleDeleteRentCollection = async (rentId: number) => {
    if (window.confirm('Are you sure you want to delete this rent collection?')) {
      try {
        await api.delete(`/api/rent-collections/${rentId}`); // Use proxy path
        setRentCollections(rentCollections.filter(r => r.rent_id !== rentId));
      } catch (err) {
        setError('Failed to delete rent collection.');
        console.error('Error deleting rent collection:', err);
      }
    }
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
    return (
      <div>
        <Alert variant="danger">{error}</Alert>
        <Button variant="secondary" onClick={fetchData} className="mb-3">
          Retry
        </Button>
      </div>
    );
  }

  return (
    
    <div>
      <h2 className="mb-4">Manage Rent Collections</h2>
      <Button variant="primary" onClick={() => setShowAddModal(true)} className="mb-3">
        Add New Rent Collection
      </Button>

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>ID</th>
            <th>Tenant ID</th>
            <th>Amount</th>
            <th>Payment Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rentCollections.map(rent => (
            <tr key={rent.rent_id}>
              <td>{rent.rent_id}</td>
              <td>{rent.tenant_id}</td>
              <td>${rent.amount.toFixed(2)}</td>
              <td>{rent.payment_date.split('T')[0]}</td>
              <td>
                <Button
                  variant="warning"
                  size="sm"
                  onClick={() => {
                    setSelectedRent(rent);
                    setTenantId(rent.tenant_id.toString());
                    setAmount(rent.amount.toString());
                    setPaymentDate(rent.payment_date.split('T')[0]);
                    setShowEditModal(true);
                  }}
                  className="me-2"
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteRentCollection(rent.rent_id)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Rent Collection</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddRentCollection}>
            <Form.Group className="mb-3">
              <Form.Label>Tenant ID</Form.Label>
              <Form.Control
                as="select"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                required
              >
                <option value="">Select Tenant</option>
                {tenants.map(tenant => (
                  <option key={tenant.tenant_id} value={tenant.tenant_id}>
                    {tenant.name} (ID: {tenant.tenant_id})
                  </option>
                ))}
              </Form.Control>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Amount</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Payment Date</Form.Label>
              <Form.Control
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
            </Form.Group>
            <Button variant="primary" type="submit">
              Save
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Rent Collection</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRent && (
            <Form onSubmit={handleUpdateRentCollection}>
              <Form.Group className="mb-3">
                <Form.Label>Tenant ID</Form.Label>
                <Form.Control
                  as="select"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  required
                >
                  <option value="">Select Tenant</option>
                  {tenants.map(tenant => (
                    <option key={tenant.tenant_id} value={tenant.tenant_id}>
                      {tenant.name} (ID: {tenant.tenant_id})
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Amount</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Payment Date</Form.Label>
                <Form.Control
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                />
              </Form.Group>
              <Button variant="primary" type="submit">
                Update
              </Button>
            </Form>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default RentCollectionForm;