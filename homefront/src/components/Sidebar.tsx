import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Sidebar: React.FC = () => {
  return (
    <div
      style={{
        width: '250px',
        backgroundColor: '#f8f9fa',
        height: '100vh',
        position: 'fixed',
        paddingTop: '20px',
      }}
    >
      <Nav className="flex-column">
        <Nav.Link as={Link} to="/" className="text-dark">
          <i className="bi bi-house-fill me-2"></i>Dashboard
        </Nav.Link>
        <Nav.Link as={Link} to="/properties" className="text-dark">
          <i className="bi bi-building me-2"></i>Manage Properties
        </Nav.Link>
        <Nav.Link as={Link} to="/tenants" className="text-dark">
          <i className="bi bi-people-fill me-2"></i>Manage Tenants
        </Nav.Link>
        <Nav.Link as={Link} to="/rent-collections" className="text-dark">
          <i className="bi bi-cash-stack me-2"></i>Rent Collections
        </Nav.Link>
        <Nav.Link as={Link} to="/maintenance" className="text-dark">
          <i className="bi bi-tools me-2"></i>Maintenance
        </Nav.Link>
      </Nav>
    </div>
  );
};

export default Sidebar;