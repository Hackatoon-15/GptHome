import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { Button, Form, Modal, Table, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';

interface Maintenance {
  maintenance_id: number;
  property_id: number;
  description: string;
  request_date: string;
  status: string;
}

interface Property {
  property_id: number;
  address: string;
}

const MaintenanceForm: React.FC = () => {
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyId, setPropertyId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [requestDate, setRequestDate] = useState<string>('');
  const [status, setStatus] = useState<string>('pending');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState<Maintenance | null>(null);
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
      const [maintenanceResponse, propertiesResponse] = await Promise.all([
        api.get('/api/maintenance'), // Use proxy path
        api.get('/api/properties'),  // Use proxy path
      ]);
      setMaintenance(maintenanceResponse.data);
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
      const fetchMaintenanceById = async () => {
        try {
          const response = await api.get(`/api/maintenance/${id}`); // Use proxy path
          const maint = response.data;
          setSelectedMaintenance(maint);
          setPropertyId(maint.property_id.toString());
          setDescription(maint.description);
          setRequestDate(maint.request_date.split('T')[0] || maint.request_date); // Handle date format
          setStatus(maint.status);
          setShowEditModal(true);
        } catch (err) {
          setError(`Failed to fetch maintenance request with ID ${id}.`);
          console.error('Error fetching maintenance:', err);
        }
      };
      fetchMaintenanceById();
    }
  }, [id]);

  const handleAddMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/maintenance', { // Use proxy path
        property_id: parseInt(propertyId),
        description,
        request_date: requestDate,
        status,
      });
      setMaintenance([...maintenance, response.data]);
      setPropertyId('');
      setDescription('');
      setRequestDate('');
      setStatus('pending');
      setShowAddModal(false);
    } catch (err) {
      setError('Failed to add maintenance request.');
      console.error('Error adding maintenance:', err);
    }
  };

  const handleUpdateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMaintenance) {
      try {
        const response = await api.put(`/api/maintenance/${selectedMaintenance.maintenance_id}`, { // Use proxy path
          property_id: parseInt(propertyId),
          description,
          request_date: requestDate,
          status,
        });
        setMaintenance(maintenance.map(m =>
          m.maintenance_id === selectedMaintenance.maintenance_id ? response.data : m
        ));
        setShowEditModal(false);
        navigate('/maintenance');
      } catch (err) {
        setError('Failed to update maintenance request.');
        console.error('Error updating maintenance:', err);
      }
    }
  };

  const handleDeleteMaintenance = async (maintenanceId: number) => {
    if (window.confirm('Are you sure you want to delete this maintenance request?')) {
      try {
        await api.delete(`/api/maintenance/${maintenanceId}`); // Use proxy path
        setMaintenance(maintenance.filter(m => m.maintenance_id !== maintenanceId));
      } catch (err) {
        setError('Failed to delete maintenance request.');
        console.error('Error deleting maintenance:', err);
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
      <h2 className="mb-4">Manage Maintenance Requests</h2>
      <Button variant="primary" onClick={() => setShowAddModal(true)} className="mb-3">
        Add New Maintenance Request
      </Button>

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>ID</th>
            <th>Property ID</th>
            <th>Description</th>
            <th>Request Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {maintenance.map(maint => (
            <tr key={maint.maintenance_id}>
              <td>{maint.maintenance_id}</td>
              <td>{maint.property_id}</td>
              <td>{maint.description}</td>
              <td>{maint.request_date.split('T')[0]}</td>
              <td>{maint.status}</td>
              <td>
                <Button
                  variant="warning"
                  size="sm"
                  onClick={() => {
                    setSelectedMaintenance(maint);
                    setPropertyId(maint.property_id.toString());
                    setDescription(maint.description);
                    setRequestDate(maint.request_date.split('T')[0]);
                    setStatus(maint.status);
                    setShowEditModal(true);
                  }}
                  className="me-2"
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteMaintenance(maint.maintenance_id)}
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
          <Modal.Title>Add Maintenance Request</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddMaintenance}>
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
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Request Date</Form.Label>
              <Form.Control
                type="date"
                value={requestDate}
                onChange={(e) => setRequestDate(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Control
                as="select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
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
          <Modal.Title>Edit Maintenance Request</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedMaintenance && (
            <Form onSubmit={handleUpdateMaintenance}>
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
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Request Date</Form.Label>
                <Form.Control
                  type="date"
                  value={requestDate}
                  onChange={(e) => setRequestDate(e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Control
                  as="select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
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

export default MaintenanceForm;