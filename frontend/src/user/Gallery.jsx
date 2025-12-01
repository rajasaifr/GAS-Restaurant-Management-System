import React from 'react';
//import api from '../api/axios';
import '../styles/Gallery.css'; // Optional styling file
import Navbar from '../components/Navbar';

const Gallery = () => {
 
  // Sample gallery images (replace with your actual images)
  const galleryImages = [
    {
      id: 1,
      src: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
      alt: 'Restaurant interior',
      caption: 'Elegant Dining Area'
    },
    {
      id: 2,
      src: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1374&q=80',
      alt: 'Chef preparing food',
      caption: 'Our Master Chef'
    },
    {
      id: 3,
      src: 'https://images.unsplash.com/photo-1544025162-d76694265947?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1469&q=80',
      alt: 'Delicious food',
      caption: 'Signature Dish'
    },
    {
      id: 4,
      src: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1374&q=80',
      alt: 'Restaurant bar',
      caption: 'Cocktail Bar'
    },
    {
      id: 5,
      src: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
      alt: 'Plated dish',
      caption: 'Gourmet Presentation'
    },
    {
      id: 6,
      src: 'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1450&q=80',
      alt: 'Outdoor seating',
      caption: 'Al Fresco Dining'
    }
  ];

  return (
    <>
    <Navbar />
    <div className="gallery-container">
      <h1 className="gallery-title">Our Gallery</h1>
      <p className="gallery-subtitle">Take a look at our restaurant ambiance and delicious dishes</p>
      
      <div className="image-grid">
        {galleryImages.map((image) => (
          <div key={image.id} className="gallery-item">
            <p className="image-caption">{image.caption}</p>
            <img 
              src={image.src} 
              alt={image.alt} 
              className="gallery-image"
            />
          </div>
        ))}
      </div>
    </div>
    </>
  );
};


export default Gallery;