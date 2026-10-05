import { Link } from 'react-router-dom';
import { FiCalendar, FiUsers, FiShield, FiClock, FiCheckCircle, FiArrowRight, FiHeart, FiUserCheck } from 'react-icons/fi';

export default function Landing() {
  return (
    <div className="landing">
      {/* Navbar */}
      <nav className="landing__nav">
        <div className="landing__nav-inner">
          <div className="landing__brand">
            <span className="landing__brand-icon">✚</span>
            <span className="landing__brand-text">Clinic Plus</span>
          </div>
          <div className="landing__nav-links">
            <a href="#services">Services</a>
            <a href="#how-it-works">How it works</a>
            <Link to="/login" className="btn btn--outline btn--sm">Log in</Link>
            <Link to="/signup" className="btn btn--primary btn--sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing__hero">
        <div className="landing__hero-content">
          <div className="landing__hero-badge">🏥 Modern Healthcare Management</div>
          <h1 className="landing__hero-title">
            Streamline Your <span className="text-gradient">Clinic Operations</span>
          </h1>
          <p className="landing__hero-subtitle">
            Effortlessly manage patients, doctors, and appointments with our intuitive platform.
            Prevent scheduling conflicts, track records, and deliver better care.
          </p>
          <div className="landing__hero-actions">
            <Link to="/signup" className="btn btn--primary btn--lg">
              Get Started Free <FiArrowRight />
            </Link>
            <Link to="/login" className="btn btn--ghost btn--lg">
              Sign In
            </Link>
          </div>
        </div>
        <div className="landing__hero-visual">
          <div className="landing__hero-card landing__hero-card--1">
            <FiCalendar size={24} />
            <div>
              <strong>Smart Scheduling</strong>
              <small>Automatic conflict detection</small>
            </div>
          </div>
          <div className="landing__hero-card landing__hero-card--2">
            <FiUsers size={24} />
            <div>
              <strong>Patient Records</strong>
              <small>Complete management</small>
            </div>
          </div>
          <div className="landing__hero-card landing__hero-card--3">
            <FiShield size={24} />
            <div>
              <strong>Secure Access</strong>
              <small>Role-based permissions</small>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="landing__stats">
        <div className="landing__stat">
          <span className="landing__stat-number">99.9%</span>
          <span className="landing__stat-label">Uptime</span>
        </div>
        <div className="landing__stat">
          <span className="landing__stat-number">0</span>
          <span className="landing__stat-label">Scheduling Conflicts</span>
        </div>
        <div className="landing__stat">
          <span className="landing__stat-number">24/7</span>
          <span className="landing__stat-label">Access</span>
        </div>
        <div className="landing__stat">
          <span className="landing__stat-number">HIPAA</span>
          <span className="landing__stat-label">Compliant Ready</span>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="landing__services">
        <div className="landing__section-header">
          <h2>Everything Your Clinic Needs</h2>
          <p>A comprehensive suite of tools designed for modern healthcare practice management.</p>
        </div>
        <div className="landing__services-grid">
          <div className="landing__service-card">
            <div className="landing__service-icon" style={{ background: 'var(--accent-patient-bg)' }}><FiUsers size={24} color="var(--accent-patient)" /></div>
            <h3>Patient Management</h3>
            <p>Register, search, update, and manage complete patient records with ease. Track medical history and contact information.</p>
          </div>
          <div className="landing__service-card">
            <div className="landing__service-icon" style={{ background: 'var(--accent-doctor-bg)' }}><FiUserCheck size={24} color="var(--accent-doctor)" /></div>
            <h3>Doctor Directory</h3>
            <p>Maintain an organized directory of all doctors, their specializations, and availability across your clinic.</p>
          </div>
          <div className="landing__service-card">
            <div className="landing__service-icon" style={{ background: 'var(--accent-appt-bg)' }}><FiCalendar size={24} color="var(--accent-appt)" /></div>
            <h3>Smart Scheduling</h3>
            <p>Book appointments with automatic conflict detection. No double bookings, no scheduling headaches.</p>
          </div>
          <div className="landing__service-card">
            <div className="landing__service-icon" style={{ background: 'var(--accent-success-bg)' }}><FiShield size={24} color="var(--color-success)" /></div>
            <h3>Secure & Role-Based</h3>
            <p>JWT authentication with HTTP-only cookies. Admin, Receptionist, Doctor, and Patient roles with proper access control.</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="landing__how">
        <div className="landing__section-header">
          <h2>How It Works</h2>
          <p>Get started in three simple steps.</p>
        </div>
        <div className="landing__steps">
          <div className="landing__step">
            <div className="landing__step-number">1</div>
            <FiUserCheck size={32} className="landing__step-icon" />
            <h3>Choose a Doctor</h3>
            <p>Browse our directory and select the specialist you need.</p>
          </div>
          <div className="landing__step-connector" />
          <div className="landing__step">
            <div className="landing__step-number">2</div>
            <FiClock size={32} className="landing__step-icon" />
            <h3>Select a Time</h3>
            <p>Pick a date and time that works for you — conflicts are prevented automatically.</p>
          </div>
          <div className="landing__step-connector" />
          <div className="landing__step">
            <div className="landing__step-number">3</div>
            <FiCheckCircle size={32} className="landing__step-icon" />
            <h3>Confirm Booking</h3>
            <p>Your appointment is instantly confirmed and tracked in the system.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing__cta">
        <div className="landing__cta-content">
          <h2>Ready to Transform Your Clinic?</h2>
          <p>Join modern clinics managing their appointments without scheduling conflicts.</p>
          <Link to="/signup" className="btn btn--primary btn--lg">
            Start Now — It's Free <FiArrowRight />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing__footer">
        <div className="landing__footer-inner">
          <div className="landing__footer-brand">
            <span className="landing__brand-icon">✚</span>
            <span className="landing__brand-text">Clinic Plus</span>
          </div>
          <p className="landing__footer-text">
            Modern clinic appointment management. Built with <FiHeart size={14} style={{ verticalAlign: 'middle', color: 'var(--color-danger)' }} /> for healthcare professionals.
          </p>
          <p className="landing__footer-copy">&copy; {new Date().getFullYear()} Clinic Plus. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
