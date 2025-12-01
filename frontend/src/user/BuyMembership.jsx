import React from 'react';
import Navbar from '../components/Navbar';
import '../styles/user.css';

const MembershipPage = () => {
  return (
    <>
      <Navbar />
      <div className="membership-container">
        <h1 className="membership-title">Become a Member</h1>
        
        <div className="membership-card">
          <div className="membership-header">
            <h2>Premium Dining Membership</h2>
            <div className="price-highlight">$200/year</div>
          </div>
          
          <div className="membership-benefits">
            <h3>Membership Benefits:</h3>
            <ul>
              <li>20% discount on all food orders</li>
              <li>Priority reservations</li>
              <li>Exclusive member-only events</li>
              <li>Free dessert on your birthday</li>
              <li>Monthly member newsletter with special offers</li>
            </ul>
          </div>
          
          <button className="purchase-btn">Purchase Membership</button>
        </div>
      </div>
    </>
  );
};

export default MembershipPage;