import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { Button, Form, Modal, Table, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';

interface Tenant {
  tenant_id: number;
  name: string;
  property_id: number;
}

interface Property {
  property_id: number;
  address: string;
}

const TenantForm: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [name, setName] = useState<string>('');
  const [propertyId, setPropertyId] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
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
      const [tenantsResponse, propertiesResponse] = await Promise.all([
        api.get('/api/tenants'), // Use proxy path
        api.get('/api/properties'), // Use proxy path
      ]);
      setTenants(tenantsResponse.data);
      setProperties(propertiesResponse.data);
    } catch (err) {
      setError('Failed to fetch data. Please check your connection or try again.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      const fetchTenantById = async () => {
        try {
          const response = await api.get(`/api/tenants/${id}`); // Use proxy path
          const tenant = response.data;
          setSelectedTenant(tenant);
          setName(tenant.name);
          setPropertyId(tenant.property_id.toString());
          setShowEditModal(true);
        } catch (err) {
          setError(`Failed to fetch tenant with ID ${id}.`);
          console.error('Error fetching tenant:', err);
        }
      };
      fetchTenantById();
    }
  }, [id]);

  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/tenants', { // Use proxy path
        name,
        property_id: parseInt(propertyId),
      });
      setTenants([...tenants, response.data]);
      setName('');
      setPropertyId('');
      setShowAddModal(false);
    } catch (err) {
      setError('Failed to add tenant.');
      console.error('Error adding tenant:', err);
    }
  };

  const handleUpdateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTenant) {
      try {
        const response = await api.put(`/api/tenants/${selectedTenant.tenant_id}`, { // Use proxy path
          name,
          property_id: parseInt(propertyId),
        });
        setTenants(tenants.map(t =>
          t.tenant_id === selectedTenant.tenant_id ? response.data : t
        ));
        setShowEditModal(false);
        navigate('/tenants');
      } catch (err) {
        setError('Failed to update tenant.');
        console.error('Error updating tenant:', err);
      }
    }
  };

  const handleDeleteTenant = async (tenantId: number) => {
    if (window.confirm('Are you sure you want to delete this tenant?')) {
      try {
        await api.delete(`/api/tenants/${tenantId}`); // Use proxy path
        setTenants(tenants.filter(t => t.tenant_id !== tenantId));
      } catch (err) {
        setError('Failed to delete tenant.');
        console.error('Error deleting tenant:', err);
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
      <h2 className="mb-4">Manage Tenants</h2>
      <Button variant="primary" onClick={() => setShowAddModal(true)} className="mb-3">
        Add New Tenant
      </Button>

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Property ID</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tenants.map(tenant => (
            <tr key={tenant.tenant_id}>
              <td>{tenant.tenant_id}</td>
              <td>{tenant.name}</td>
              <td>{tenant.property_id}</td>
              <td>
                <Button
                  variant="warning"
                  size="sm"
                  onClick={() => {
                    setSelectedTenant(tenant);
                    setName(tenant.name);
                    setPropertyId(tenant.property_id.toString());
                    setShowEditModal(true);
                  }}
                  className="me-2"
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteTenant(tenant.tenant_id)}
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
          <Modal.Title>Add Tenant</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddTenant}>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Property ID</Form.Label>
              <Form.Control
                as="select"
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                required
              >
                <option value="">Select Property</option>
                {properties.map(property => (
                  <option key={property.property_id} value={property.property_id}>
                    {property.address} (ID: {property.property_id})
                  </option>
                ))}
              </Form.Control>
            </Form.Group>
            <Button variant="primary" type="submit">
              Save
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Tenant</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTenant && (
            <Form onSubmit={handleUpdateTenant}>
              <Form.Group className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Property ID</Form.Label>
                <Form.Control
                  as="select"
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  required
                >
                  <option value="">Select Property</option>
                  {properties.map(property => (
                    <option key={property.property_id} value={property.property_id}>
                      {property.address} (ID: {property.property_id})
                    </option>
                  ))}
                </Form.Control>
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

export default TenantForm;