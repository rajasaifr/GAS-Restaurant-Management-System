import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import '../styles/user.css';

const ChefsPage = () => {
  const [chefs, setChefs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Array of placeholder chef photos
  const chefPhotos = [
    'https://randomuser.me/api/portraits/women/44.jpg',
    'https://randomuser.me/api/portraits/men/32.jpg',
    'https://randomuser.me/api/portraits/men/75.jpg',
    'https://randomuser.me/api/portraits/women/65.jpg',
    'https://randomuser.me/api/portraits/men/50.jpg',
    'https://randomuser.me/api/portraits/women/12.jpg',
    'https://randomuser.me/api/portraits/men/28.jpg',
  ];

  // Fake specialties to add more content
  const specialties = [
    'Italian Cuisine', 'French Pastry', 'Asian Fusion', 
    'Mediterranean', 'Molecular Gastronomy', 'Seafood', 'Vegan Delights'
  ];

  // Sample chef bios to make the page look fuller
  const chefBios = [
    "Bringing innovation and tradition together with over 15 years of culinary excellence. Specializes in creating unforgettable dining experiences with locally-sourced ingredients.",
    "Award-winning chef with a passion for sustainable cooking. Known for unexpected flavor combinations and artistic presentation that delights all the senses.",
    "Master of fusion cuisine who combines classical techniques with modern creativity. Every dish tells a story of cultural heritage and culinary adventure.",
    "Classically trained with experience in Michelin-starred restaurants across Europe. Believes that simplicity and quality ingredients are the foundation of exceptional cuisine.",
    "Culinary artist who approaches each dish as a canvas. Specializes in innovative techniques while respecting traditional flavors that comfort and inspire.",
    "Internationally recognized for a unique approach to seasonal ingredients. Creates dishes that highlight the natural flavors of each component with minimal intervention.",
    "Passionate about farm-to-table dining experiences. Works closely with local producers to create sustainable menus that change with the seasons."
  ];

  useEffect(() => {
    const fetchChefs = async () => {
      try {
        const response = await api.get('/api/chefs');
        setChefs(response.data.data || []);
      } catch (err) {
        console.error('Failed to fetch chefs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChefs();
  }, []);

  // Function to get a random photo for each chef
  const getRandomChefPhoto = (index) => {
    return chefPhotos[index % chefPhotos.length];
  };

  // Function to get a random specialty for each chef
  const getRandomSpecialty = (index) => {
    return specialties[index % specialties.length];
  };

  // Function to get a bio for each chef
  const getChefBio = (index) => {
    return chefBios[index % chefBios.length];
  };

  return (
    <>
      <Navbar />
      <div className="chefs-page">
        <div className="chefs-container">
          <div className="chefs-header">
            <h1 className="chefs-title">Our Culinary Team</h1>
            <p className="chefs-subtitle">Meet the talented chefs behind our exceptional cuisine</p>
          </div>
          
          <div className="chefs-intro">
            <p>At our restaurant, we believe that exceptional dining experiences start with passionate people. Our team of world-class chefs combines classical training with innovative techniques to create memorable dishes that delight the senses and nourish the soul.</p>
            <p>Each chef brings their unique background, specialties, and creative vision to our kitchen, working together to craft a menu that celebrates both tradition and innovation.</p>
          </div>

          {loading ? (
            <p className="loading-text">Preparing to introduce our talented chefs...</p>
          ) : (
            <div className="chefs-grid">
              {chefs.map((chef, index) => (
                <div key={chef.StaffID || index} className="chef-card">
                  <div className="chef-image-container">
                    <img 
                      src={getRandomChefPhoto(index)} 
                      alt={chef.Name}
                      className="chef-image"
                    />
                    <div className="chef-specialty">{getRandomSpecialty(index)}</div>
                  </div>
                  <div className="chef-info">
                    <h3 className="chef-name">{chef.Name || 'Chef Name'}</h3>
                    
                    <p className="chef-bio">{getChefBio(index)}</p>
                    
                    <div className="chef-quote">
                      "Cooking is an expression of love and creativity that brings people together."
                    </div>
                    
                    {chef.ContactInfo && (
                      <p className="chef-contact">
                        <span className="chef-contact-icon">✉</span> 
                        {chef.ContactInfo}
                      </p>
                    )}
                    
                    <div className="chef-awards">
                      <span className="chef-award">Best Chef 2023</span>
                      <span className="chef-award">Culinary Excellence</span>
                    </div>
                    
                    <div className="chef-signature">
                      {chef.Name?.split(' ')[0] || 'Chef'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ChefsPage;