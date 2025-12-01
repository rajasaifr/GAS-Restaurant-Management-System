import React from 'react';
import Navbar from '../components/Navbar';
import '../styles/user.css';

const AboutPage = () => {
  return (
    <>
      <Navbar />
      <div className="about-container">
        <section className="about-hero">
          <div className="hero-overlay">
            <h1>Our Story</h1>
            <p className="hero-subtitle">Crafting memorable dining experiences since 2010</p>
          </div>
        </section>

        <section className="about-mission">
          <div className="mission-content">
            <h2>Our Philosophy</h2>
            <div className="mission-statement">
              <p>At GAS, we believe dining should engage all senses. Our chefs combine seasonal ingredients with innovative techniques to create dishes that tell a story.</p>
              <p>We source 90% of our produce from local farms within 50 miles, ensuring peak freshness while supporting our community.</p>
            </div>
          </div>
          <div className="mission-image"></div>
        </section>

        <section className="team-section">
          <h2>Meet Our Culinary Team</h2>
          <div className="team-grid">
            <div className="team-member">
              <div className="member-photo chef-1"></div>
              <h3>Chef Marco Vialli</h3>
              <p className="position">Executive Chef</p>
              <p className="bio">With 15 years at Michelin-starred restaurants across Europe, Chef Marco brings classical training with modern flair.</p>
            </div>
            <div className="team-member">
              <div className="member-photo chef-2"></div>
              <h3>Sophia Chen</h3>
              <p className="position">Pastry Chef</p>
              <p className="bio">Award-winning pastry chef specializing in contemporary desserts with Asian influences.</p>
            </div>
            <div className="team-member">
              <div className="member-photo chef-3"></div>
              <h3>Antonio Rodriguez</h3>
              <p className="position">Sommelier</p>
              <p className="bio">Certified Master Sommelier curating our 500-bottle wine cellar featuring boutique vineyards.</p>
            </div>
          </div>
        </section>

        <section className="awards-section">
          <h2>Recognition & Awards</h2>
          <div className="awards-grid">
            <div className="award">
              <div className="award-icon">★</div>
              <h3>Michelin Star</h3>
              <p>2022, 2023</p>
            </div>
            <div className="award">
              <div className="award-icon">🏆</div>
              <h3>Best New Restaurant</h3>
              <p>Food & Wine Magazine, 2021</p>
            </div>
            <div className="award">
              <div className="award-icon">🍽️</div>
              <h3>3-Star Sustainability</h3>
              <p>Green Restaurant Association</p>
            </div>
          </div>
        </section>

        <section className="visit-section">
          <div className="visit-info">
            <h2>Visit Us</h2>
            <address>
              123 Culinary Avenue<br />
              Food District, NY 10001<br /><br />
              <strong>Hours:</strong><br />
              Tuesday-Thursday: 5PM-10PM<br />
              Friday-Saturday: 5PM-11PM<br />
              Sunday: 5PM-9PM<br />
              Closed Mondays<br /><br />
              <a href="tel:+15551234567">(555) 123-4567</a><br />
              <a href="mailto:reservations@urbee.com">reservations@urbee.com</a>
            </address>
          </div>
          <div className="map-container"></div>
        </section>
      </div>
    </>
  );
};

export default AboutPage;