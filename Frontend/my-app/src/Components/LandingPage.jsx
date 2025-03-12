import React from 'react';
import Dashboardimage from "C:\\Users\\aryan\\react_app\\my-app\\src\\Images\\Screenshot 2024-11-21 123114.png";
import Projectimage from "C:\\Users\\aryan\\react_app\\my-app\\src\\Images\\Screenshot 2024-11-21 123139.png";
import Reportimage from "C:\\Users\\aryan\\react_app\\my-app\\src\\Images\\Screenshot 2024-11-21 123430.png";
import Taskimage from "C:\\Users\\aryan\\react_app\\my-app\\src\\Images\\Screenshot 2024-11-21 123357.png";

const LandingPage = () => {
  return (
    <div style={styles.container}>
      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.title}>Welcome to Scantera</h1>
          <p style={styles.subtitle}>Innovative solutions by Indavian Technologies</p>
          <div style={styles.buttonContainer}>
            <a href="https://scantera.indavian.com/login" style={styles.button}>
              Manager Login
            </a>
            <a href="https://scantera.indavian.com/userlogin" style={styles.button}>
              Member Login
            </a>
          </div>
        </div>
        <div style={styles.heroImageContainer}>
          <img
            src={Dashboardimage} // Replace with your hero image
            alt="Scantera Software Preview"
            style={styles.heroImage}
          />
        </div>
      </section>

      {/* Feature Gallery Section */}
      <section style={styles.gallerySection}>
        <h2 style={styles.sectionTitle}>Discover Our Features</h2>
        <div style={styles.galleryGrid}>
          {/* Image 1 */}
          <div style={styles.galleryCard}>
            <img
              src={Dashboardimage} // Replace with your dashboard image
              alt="Dashboard View"
              style={styles.galleryImage}
            />
            <p style={styles.galleryCaption}>Dashboard: Overview of all projects</p>
          </div>

          {/* Image 2 */}
          <div style={styles.galleryCard}>
            <img
              src={Projectimage} // Replace with your project page image
              alt="Project Page"
              style={styles.galleryImage}
            />
            <p style={styles.galleryCaption}>Project Page: Detailed insights into projects</p>
          </div>

          {/* Image 3 */}
          <div style={styles.galleryCard}>
            <img
              src={Reportimage} // Replace with your report page image
              alt="Report Page"
              style={styles.galleryImage}
            />
            <p style={styles.galleryCaption}>Reports: AI-generated detailed reports</p>
          </div>

          {/* Image 4 */}
          {/* <div style={styles.galleryCard}>
            <img
              src="https://via.placeholder.com/300x200" // Replace with another image
              alt="Defect Detection"
              style={styles.galleryImage}
            />
            <p style={styles.galleryCaption}>Defect Detection: Highlighting critical issues</p>
          </div> */}

          {/* Image 5 */}
          <div style={styles.galleryCard}>
            <img
              src={Taskimage} // Replace with another image
              alt="Collaboration Tools"
              style={styles.galleryImage}
            />
            <p style={styles.galleryCaption}>Collaboration: Streamlined teamwork</p>
          </div>
        </div>
      </section>
    </div>
  );
};

const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f3fdf3',
    color: '#333',
    lineHeight: 1.6,
  },
  hero: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '2rem',
    backgroundColor: '#228B22',
    color: 'white',
  },
  heroContent: {
    maxWidth: '50%',
  },
  title: {
    fontSize: '3rem',
    marginBottom: '1rem',
  },
  subtitle: {
    fontSize: '1.2rem',
    marginBottom: '1.5rem',
  },
  buttonContainer: {
    display: 'flex',
    gap: '1rem',
  },
  button: {
    textDecoration: 'none',
    padding: '0.8rem 1.5rem',
    fontSize: '1rem',
    color: 'white',
    backgroundColor: '#1d6f1d',
    borderRadius: '5px',
    transition: 'background-color 0.3s',
  },
  heroImageContainer: {
    maxWidth: '45%',
  },
  heroImage: {
    width: '100%',
    borderRadius: '10px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
  },
  gallerySection: {
    padding: '2rem',
    backgroundColor: '#ffffff',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: '2rem',
    marginBottom: '1.5rem',
    color: '#228B22',
  },
  galleryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
  },
  galleryCard: {
    backgroundColor: 'white',
    padding: '1rem',
    borderRadius: '10px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
  },
  galleryImage: {
    width: '100%',
    borderRadius: '10px',
    marginBottom: '1rem',
  },
  galleryCaption: {
    fontSize: '1rem',
    color: '#555',
  },
};

export default LandingPage;
