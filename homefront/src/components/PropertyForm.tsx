import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { Button, Form, Modal, Table, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';


interface Property {
  property_id: number;
  address: string;
  owner_id: number;
}

const PropertyForm: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [address, setAddress] = useState<string>('');
  const [ownerId, setOwnerId] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/properties'); // Use proxy path
      setProperties(response.data);
    } catch (err) {
      setError('Failed to fetch properties. Please check your connection or try again.');
      console.error('Error fetching properties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      const fetchPropertyById = async () => {
        try {
          const response = await api.get(`/api/properties/${id}`); // Use proxy path
          const property = response.data;
          setSelectedProperty(property);
          setAddress(property.address);
          setOwnerId(property.owner_id.toString());
          setShowEditModal(true);
        } catch (err) {
          setError(`Failed to fetch property with ID ${id}.`);
          console.error('Error fetching property:', err);
        }
      };
      fetchPropertyById();
    }
  }, [id]);

  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/properties', { // Use proxy path
        address,
        owner_id: parseInt(ownerId),
      });
      setProperties([...properties, response.data]);
      setAddress('');
      setOwnerId('');
      setShowAddModal(false);
    } catch (err) {
      setError('Failed to add property.');
      console.error('Error adding property:', err);
    }
  };

  const handleUpdateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProperty) {
      try {
        const response = await api.put(`/api/properties/${selectedProperty.property_id}`, { // Use proxy path
          address,
          owner_id: parseInt(ownerId),
        });
        setProperties(properties.map(p =>
          p.property_id === selectedProperty.property_id ? response.data : p
        ));
        setShowEditModal(false);
        navigate('/properties');
      } catch (err) {
        setError('Failed to update property.');
        console.error('Error updating property:', err);
      }
    }
  };

  const handleDeleteProperty = async (propertyId: number) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await api.delete(`/api/properties/${propertyId}`); // Use proxy path
        setProperties(properties.filter(p => p.property_id !== propertyId));
      } catch (err) {
        setError('Failed to delete property.');
        console.error('Error deleting property:', err);
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
        <Button variant="secondary" onClick={fetchProperties} className="mb-3">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4">Manage Properties</h2>
      <Button variant="primary" onClick={() => setShowAddModal(true)} className="mb-3">
        Add New Property
      </Button>

      {/* Properties Table */}
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>ID</th>
            <th>Address</th>
            <th>Owner ID</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {properties.map(property => (
            <tr key={property.property_id}>
              <td>{property.property_id}</td>
              <td>{property.address}</td>
              <td>{property.owner_id}</td>
              <td>
                <Button
                  variant="warning"
                  size="sm"
                  onClick={() => {
                    setSelectedProperty(property);
                    setAddress(property.address);
                    setOwnerId(property.owner_id.toString());
                    setShowEditModal(true);
                  }}
                  className="me-2"
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteProperty(property.property_id)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Add Property Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Property</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddProperty}>
            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Owner ID</Form.Label>
              <Form.Control
                type="number"
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                required
              />
            </Form.Group>
            <Button variant="primary" type="submit">
              Save
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Edit Property Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Property</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProperty && (
            <Form onSubmit={handleUpdateProperty}>
              <Form.Group className="mb-3">
                <Form.Label>Address</Form.Label>
                <Form.Control
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Owner ID</Form.Label>
                <Form.Control
                  type="number"
                  value={ownerId}
                  onChange={(e) => setOwnerId(e.target.value)}
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

export default PropertyForm;