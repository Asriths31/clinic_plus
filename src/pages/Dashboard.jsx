import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FiUsers,
  FiUserCheck,
  FiCalendar,
  FiClock,
  FiPlus,
  FiArrowRight,
  FiCheckCircle,
  FiActivity,
  FiCheck,
  FiMail,
  FiPhone,
  FiAward,
  FiShield,
  FiX,
  FiSearch,
} from 'react-icons/fi';
import { useDashboard } from '../hooks/useDashboard';
import { useAppointments, useUpdateAppointment } from '../hooks/useAppointments';
import { useDoctors, useCreateDoctor } from '../hooks/useDoctors';
import { usePatients } from '../hooks/usePatients';
import useAuthStore from '../store/authStore';
import Modal from '../components/ui/Modal';
import { CardSkeleton, TableSkeleton } from '../components/ui/Skeleton';
import toast from 'react-hot-toast';
import { getLocalDateString, formatLocalTime, formatLocalDate } from '../utils/dateUtils';

const SPECIALIZATIONS = [
  'General Medicine',
  'Cardiology',
  'Pediatrics',
  'Dermatology',
  'Neurology',
  'Orthopedics',
  'Gynecology',
  'Psychiatry',
  'Ophthalmology',
];

export default function Dashboard() {
  const { user } = useAuthStore();
  const isPatient = user?.role === 'PATIENT';
  const isDoctor = user?.role === 'DOCTOR';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST';

  // Data fetching queries
  const { data: statsRes, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useDashboard();
  const { data: apptsRes, isLoading: apptsLoading, refetch: refetchAppts } = useAppointments();
  const { data: doctorsRes, isLoading: docsLoading } = useDoctors();
  const { data: patientsRes, isLoading: patientsLoading } = usePatients();

  const updateApptMutation = useUpdateAppointment();
  const createDoctorMutation = useCreateDoctor();

  // Admin section tab state: 'appointments' | 'doctors' | 'patients'
  const [adminTab, setAdminTab] = useState('appointments');
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);

  // Add doctor form state
  const initialDoctorForm = {
    name: '',
    email: '',
    phone: '',
    specialization: 'General Medicine',
    password: 'Doctor@123',
  };
  const [doctorForm, setDoctorForm] = useState(initialDoctorForm);
  const [doctorFormErrors, setDoctorFormErrors] = useState({});

  const stats = statsRes?.data || { totalPatients: 0, totalDoctors: 0, upcomingAppointments: 0 };
  const allAppointments = Array.isArray(apptsRes?.data) ? apptsRes.data : [];
  const doctors = Array.isArray(doctorsRes?.data) ? doctorsRes.data : [];
  const patients = Array.isArray(patientsRes?.data) ? patientsRes.data : [];

  const todayStr = getLocalDateString(new Date());

  // Role-scoped appointments
  const appointments = useMemo(() => {
    if (isPatient) {
      return allAppointments.filter(
        (a) => a.patientId === user?.id || a.patient_email === user?.email
      );
    }
    if (isDoctor) {
      return allAppointments.filter(
        (a) =>
          a.doctorId === user?.id ||
          a.doctor_name?.toLowerCase() === user?.name?.toLowerCase() ||
          a.doctor_email?.toLowerCase() === user?.email?.toLowerCase()
      );
    }
    return allAppointments;
  }, [allAppointments, isPatient, isDoctor, user]);

  // Doctor metrics calculations
  const doctorTodayAppointments = useMemo(() => {
    if (!isDoctor) return [];
    return appointments.filter((a) => getLocalDateString(a.startTime) === todayStr);
  }, [appointments, isDoctor, todayStr]);

  const doctorUpcomingAppointments = useMemo(() => {
    if (!isDoctor) return [];
    return appointments.filter(
      (a) => getLocalDateString(a.startTime) >= todayStr && a.status === 'SCHEDULED'
    );
  }, [appointments, isDoctor, todayStr]);

  const doctorCompletedAppointments = useMemo(() => {
    if (!isDoctor) return [];
    return appointments.filter((a) => a.status === 'COMPLETED');
  }, [appointments, isDoctor]);

  // Patient metrics calculations
  const upcomingPatientAppointments = useMemo(() => {
    if (!isPatient) return 0;
    return appointments.filter(
      (a) => a.status === 'SCHEDULED' && getLocalDateString(a.startTime) >= todayStr
    ).length;
  }, [appointments, isPatient, todayStr]);

  const completedPatientAppointments = useMemo(() => {
    if (!isPatient) return 0;
    return appointments.filter((a) => a.status === 'COMPLETED').length;
  }, [appointments, isPatient]);

  // Admin metrics
  const adminTodayAppointmentsCount = useMemo(() => {
    return allAppointments.filter((a) => getLocalDateString(a.startTime) === todayStr).length;
  }, [allAppointments, todayStr]);

  // fast 1-click status update for Doctor & Admin
  const handleQuickStatus = async (appt, newStatus) => {
    try {
      await updateApptMutation.mutateAsync({
        id: appt.id,
        data: {
          patientId: appt.patientId,
          doctorId: appt.doctorId,
          startTime: appt.startTime,
          endTime: appt.endTime,
          reason: appt.reason,
          status: newStatus,
        },
      });
      toast.success(`Appointment marked as ${newStatus}`);
    } catch (err) {
      toast.error(err.message || 'Failed to update appointment status');
    }
  };

  // Add doctor modal submit
  const validateDoctorForm = () => {
    const errs = {};
    if (!doctorForm.name.trim()) errs.name = 'Doctor name is required';
    if (!doctorForm.email.trim()) errs.email = 'Email address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(doctorForm.email)) errs.email = 'Invalid email address';
    if (!doctorForm.specialization.trim()) errs.specialization = 'Specialization is required';
    if (doctorForm.phone && doctorForm.phone.length !== 10) errs.phone = 'Phone number must be exactly 10 digits';
    setDoctorFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateDoctorSubmit = async (e) => {
    e.preventDefault();
    if (!validateDoctorForm()) return;
    try {
      await createDoctorMutation.mutateAsync(doctorForm);
      toast.success(`Doctor Dr. ${doctorForm.name} created! They can now log in at /doctor/login`);
      setShowAddDoctorModal(false);
      setDoctorForm(initialDoctorForm);
      setDoctorFormErrors({});
    } catch (err) {
      toast.error(err.message || 'Failed to create doctor');
    }
  };

  return (
    <div className="dashboard-page">
      {/* 1. WELCOME BANNER */}
      <div className="dashboard-banner">
        <div className="dashboard-banner__text">
          <h1>
            {isDoctor
              ? `Welcome back, ${user?.name || 'Practitioner'} `
              : isAdmin
              ? `Clinic Administration Portal`
              : `Welcome back, ${user?.name || 'Patient'}`}
          </h1>
          <p>
            {isDoctor
              ? 'Review your assigned consultations, patient visits, and daily clinical schedule.'
              : isAdmin
              ? 'Manage patients, medical staff & doctors, and oversee clinical appointment bookings.'
              : 'View your scheduled appointments and upcoming clinic consultations.'}
          </p>
        </div>

        <div className="dashboard-banner__actions">
          {isAdmin && (
            <>
              <button
                className="btn btn--primary"
                onClick={() => setShowAddDoctorModal(true)}
              >
                <FiPlus size={16} /> Add Doctor
              </button>
              <Link to="/patients" className="btn btn--outline">
                <FiPlus size={16} /> New Patient
              </Link>
              <Link to="/appointments" className="btn btn--secondary">
                <FiCalendar size={16} /> Book Appointment
              </Link>
            </>
          )}

          {isDoctor && (
            <Link to="/appointments" className="btn btn--primary">
              <FiCalendar size={16} /> View My Schedule
            </Link>
          )}

          {isPatient && (
            <Link to="/appointments" className="btn btn--primary">
              <FiPlus size={16} /> Book Appointment
            </Link>
          )}
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      {statsLoading ? (
        <CardSkeleton count={isDoctor ? 3 : 4} />
      ) : statsError ? (
        <div className="alert-card alert-card--error">
          <p>Failed to load dashboard metrics.</p>
          <button className="btn btn--sm btn--outline" onClick={() => refetchStats()}>
            Retry
          </button>
        </div>
      ) : isDoctor ? (
        /* DOCTOR STATS */
        <div className="stats-grid">
          <div className="stat-card stat-card--appointments">
            <div className="stat-card__icon">
              <FiClock size={26} />
            </div>
            <div className="stat-card__info">
              <span className="stat-card__value">{doctorTodayAppointments.length}</span>
              <span className="stat-card__label">Today's Consultations</span>
            </div>
            <div className="stat-card__arrow">
              <FiArrowRight />
            </div>
          </div>

          <div className="stat-card stat-card--doctors">
            <div className="stat-card__icon">
              <FiCalendar size={26} />
            </div>
            <div className="stat-card__info">
              <span className="stat-card__value">{doctorUpcomingAppointments.length}</span>
              <span className="stat-card__label">Upcoming Consultations</span>
            </div>
            <div className="stat-card__arrow">
              <FiArrowRight />
            </div>
          </div>

          <div className="stat-card stat-card--patients">
            <div className="stat-card__icon">
              <FiCheckCircle size={26} />
            </div>
            <div className="stat-card__info">
              <span className="stat-card__value">{doctorCompletedAppointments.length}</span>
              <span className="stat-card__label">Completed Sessions</span>
            </div>
            <div className="stat-card__arrow">
              <FiArrowRight />
            </div>
          </div>
        </div>
      ) : isPatient ? (
        /* PATIENT STATS */
        <div className="stats-grid">
          <Link to="/appointments" className="stat-card stat-card--appointments">
            <div className="stat-card__icon">
              <FiCalendar size={26} />
            </div>
            <div className="stat-card__info">
              <span className="stat-card__value">{upcomingPatientAppointments}</span>
              <span className="stat-card__label">Upcoming Consultations</span>
            </div>
            <div className="stat-card__arrow">
              <FiArrowRight />
            </div>
          </Link>

          <Link to="/appointments" className="stat-card stat-card--patients">
            <div className="stat-card__icon">
              <FiCheckCircle size={26} />
            </div>
            <div className="stat-card__info">
              <span className="stat-card__value">{completedPatientAppointments}</span>
              <span className="stat-card__label">Past Consultations</span>
            </div>
            <div className="stat-card__arrow">
              <FiArrowRight />
            </div>
          </Link>

          <Link to="/appointments" className="stat-card stat-card--doctors">
            <div className="stat-card__icon">
              <FiActivity size={26} />
            </div>
            <div className="stat-card__info">
              <span className="stat-card__value">{appointments.length}</span>
              <span className="stat-card__label">Total Consultations</span>
            </div>
            <div className="stat-card__arrow">
              <FiArrowRight />
            </div>
          </Link>
        </div>
      ) : (
        /* ADMIN STATS (4 Cards) */
        <div className="stats-grid stats-grid--4">
          <Link to="/patients" className="stat-card stat-card--patients">
            <div className="stat-card__icon">
              <FiUsers size={26} />
            </div>
            <div className="stat-card__info">
              <span className="stat-card__value">{stats.totalPatients}</span>
              <span className="stat-card__label">Total Patients</span>
            </div>
            <div className="stat-card__arrow">
              <FiArrowRight />
            </div>
          </Link>

          <Link to="/doctors" className="stat-card stat-card--doctors">
            <div className="stat-card__icon">
              <FiUserCheck size={26} />
            </div>
            <div className="stat-card__info">
              <span className="stat-card__value">{stats.totalDoctors}</span>
              <span className="stat-card__label">Active Doctors</span>
            </div>
            <div className="stat-card__arrow">
              <FiArrowRight />
            </div>
          </Link>

          <Link to="/appointments" className="stat-card stat-card--appointments">
            <div className="stat-card__icon">
              <FiCalendar size={26} />
            </div>
            <div className="stat-card__info">
              <span className="stat-card__value">{allAppointments.length}</span>
              <span className="stat-card__label">Total Appointments</span>
            </div>
            <div className="stat-card__arrow">
              <FiArrowRight />
            </div>
          </Link>

          <div className="stat-card stat-card--today">
            <div className="stat-card__icon" style={{ background: '#fef3c7', color: '#d97706' }}>
              <FiClock size={26} />
            </div>
            <div className="stat-card__info">
              <span className="stat-card__value">{adminTodayAppointmentsCount}</span>
              <span className="stat-card__label">Today's Visits</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. DOCTOR VIEW: TODAY'S CONSULTATIONS & APPOINTMENTS */}
      {isDoctor && (
        <div className="panel" style={{ marginTop: '1.5rem' }}>
          <div className="panel__header">
            <div>
              <h2 className="panel__title">My Assigned Consultations</h2>
              <p className="panel__subtitle">
                Appointments booked with you. Mark sessions completed as patients finish consultations.
              </p>
            </div>
            <Link to="/appointments" className="panel__link">
              View Schedule ({appointments.length}) <FiArrowRight size={14} />
            </Link>
          </div>

          {apptsLoading ? (
            <TableSkeleton rows={4} cols={5} />
          ) : appointments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">🩺</div>
              <h3>No appointments scheduled</h3>
              <p>You have no consultations assigned right now.</p>
              <Link to="/appointments" className="btn btn--primary btn--sm">
                <FiCalendar /> Check Schedule
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Patient Name</th>
                    <th>Session Date</th>
                    <th>Time Slot</th>
                    <th>Reason / Chief Complaint</th>
                    <th>Status</th>
                    <th className="text-right">Consultation Action</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.slice(0, 8).map((appt) => (
                    <tr key={appt.id}>
                      <td>
                        <div className="user-cell">
                          <div className="avatar-circle avatar-circle--patient">
                            {appt.patient_name ? appt.patient_name[0].toUpperCase() : 'P'}
                          </div>
                          <div>
                            <strong>{appt.patient_name || `Patient #${appt.patientId}`}</strong>
                            {appt.patient_email && <small>{appt.patient_email}</small>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="font-medium">{formatLocalDate(appt.startTime)}</span>
                      </td>
                      <td>
                        <div className="time-badge">
                          <FiClock size={13} />
                          <span>
                            {formatLocalTime(appt.startTime)} - {formatLocalTime(appt.endTime)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="text-truncate" title={appt.reason || 'General Consultation'}>
                          {appt.reason || 'General Consultation'}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status-badge status-badge--${
                            appt.status?.toLowerCase() || 'scheduled'
                          }`}
                        >
                          {appt.status || 'SCHEDULED'}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="action-buttons">
                          {appt.status === 'SCHEDULED' ? (
                            <button
                              className="btn btn--xs btn--primary"
                              onClick={() => handleQuickStatus(appt, 'COMPLETED')}
                              title="Mark consultation completed"
                            >
                              <FiCheck size={14} /> Complete
                            </button>
                          ) : (
                            <span className="meta-text text-muted">
                              {appt.status === 'COMPLETED' ? '✓ Finished' : 'Cancelled'}
                            </span>
                          )}
                          <Link
                            to="/appointments"
                            className="icon-btn icon-btn--edit"
                            title="View / Reschedule"
                          >
                            <FiArrowRight size={14} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 4. ADMIN VIEW: MANAGEMENT PANELS WITH TABS */}
      {isAdmin && (
        <div className="panel" style={{ marginTop: '1.5rem' }}>
          {/* Admin Sub-navigation Header */}
          <div className="panel__header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 className="panel__title">Clinic Master Management</h2>
              <p className="panel__subtitle">Manage patients, doctors, and appointments in real-time</p>
            </div>

            <div className="tab-buttons-group">
              <button
                type="button"
                className={`tab-btn ${adminTab === 'appointments' ? 'tab-btn--active' : ''}`}
                onClick={() => setAdminTab('appointments')}
              >
                <FiCalendar size={14} /> Appointments ({allAppointments.length})
              </button>
              <button
                type="button"
                className={`tab-btn ${adminTab === 'doctors' ? 'tab-btn--active' : ''}`}
                onClick={() => setAdminTab('doctors')}
              >
                <FiUserCheck size={14} /> Doctors ({doctors.length})
              </button>
              <button
                type="button"
                className={`tab-btn ${adminTab === 'patients' ? 'tab-btn--active' : ''}`}
                onClick={() => setAdminTab('patients')}
              >
                <FiUsers size={14} /> Patients ({patients.length})
              </button>
            </div>
          </div>

          {/* TAB 1: APPOINTMENTS MANAGEMENT */}
          {adminTab === 'appointments' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span className="text-muted" style={{ fontSize: '0.875rem' }}>
                  Showing recent clinical appointments across all doctors
                </span>
                <Link to="/appointments" className="btn btn--outline btn--xs">
                  Full Appointment Manager <FiArrowRight size={12} />
                </Link>
              </div>

              {apptsLoading ? (
                <TableSkeleton rows={5} cols={6} />
              ) : allAppointments.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state__icon">🗓️</div>
                  <h3>No appointments registered</h3>
                  <p>Book a consultation to monitor clinic activity.</p>
                  <Link to="/appointments" className="btn btn--primary btn--sm">
                    <FiPlus /> Book Appointment
                  </Link>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Assigned Doctor</th>
                        <th>Date</th>
                        <th>Time Slot</th>
                        <th>Status</th>
                        <th>Reason</th>
                        <th className="text-right">Quick Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allAppointments.slice(0, 6).map((appt) => (
                        <tr key={appt.id}>
                          <td>
                            <div className="user-cell">
                              <div className="avatar-circle avatar-circle--patient">
                                {appt.patient_name ? appt.patient_name[0].toUpperCase() : 'P'}
                              </div>
                              <div>
                                <strong>{appt.patient_name || `Patient #${appt.patientId}`}</strong>
                                {appt.patient_email && <small>{appt.patient_email}</small>}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="user-cell">
                              <div className="avatar-circle avatar-circle--doctor">
                                {appt.doctor_name ? appt.doctor_name[0].toUpperCase() : 'D'}
                              </div>
                              <div>
                                <strong>{appt.doctor_name || `Doctor #${appt.doctorId}`}</strong>
                                <small>{appt.doctor_specialization || 'Clinical Specialist'}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="font-medium">{formatLocalDate(appt.startTime)}</span>
                          </td>
                          <td>
                            <div className="time-badge">
                              <FiClock size={12} />
                              <span>{formatLocalTime(appt.startTime)} - {formatLocalTime(appt.endTime)}</span>
                            </div>
                          </td>
                          <td>
                            <span
                              className={`status-badge status-badge--${
                                appt.status?.toLowerCase() || 'scheduled'
                              }`}
                            >
                              {appt.status || 'SCHEDULED'}
                            </span>
                          </td>
                          <td>
                            <span className="text-truncate" style={{ maxWidth: '180px' }} title={appt.reason}>
                              {appt.reason || 'General Consultation'}
                            </span>
                          </td>
                          <td className="text-right">
                            <div className="action-buttons">
                              {appt.status === 'SCHEDULED' && (
                                <button
                                  className="icon-btn icon-btn--success"
                                  onClick={() => handleQuickStatus(appt, 'COMPLETED')}
                                  title="Mark as Completed"
                                >
                                  <FiCheck size={14} />
                                </button>
                              )}
                              <Link
                                to="/appointments"
                                className="icon-btn icon-btn--edit"
                                title="Manage in Appointments"
                              >
                                <FiArrowRight size={14} />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DOCTORS MANAGEMENT */}
          {adminTab === 'doctors' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span className="text-muted" style={{ fontSize: '0.875rem' }}>
                  Registered practitioners and medical specialists ({doctors.length} doctors)
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn btn--primary btn--xs"
                    onClick={() => setShowAddDoctorModal(true)}
                  >
                    <FiPlus size={14} /> Add Doctor
                  </button>
                  <Link to="/doctors" className="btn btn--outline btn--xs">
                    Manage Doctors <FiArrowRight size={12} />
                  </Link>
                </div>
              </div>

              {docsLoading ? (
                <TableSkeleton rows={4} cols={5} />
              ) : doctors.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state__icon">🩺</div>
                  <h3>No doctors registered</h3>
                  <p>Add doctors to start scheduling clinic consultations.</p>
                  <button
                    className="btn btn--primary btn--sm"
                    onClick={() => setShowAddDoctorModal(true)}
                  >
                    <FiPlus /> Add Doctor
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Doctor Name</th>
                        <th>Specialization</th>
                        <th>Email Address</th>
                        <th>Phone Number</th>
                        <th className="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doctors.slice(0, 6).map((doc) => (
                        <tr key={doc.id}>
                          <td>
                            <div className="user-cell">
                              <div className="avatar-circle avatar-circle--doctor">
                                {doc.name ? doc.name[0].toUpperCase() : 'D'}
                              </div>
                              <div>
                                <strong>{doc.name.startsWith('Dr.') ? doc.name : `Dr. ${doc.name}`}</strong>
                                <small>ID: #{doc.id}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="badge badge--specialty">
                              <FiAward size={12} /> {doc.specialization || 'General Practice'}
                            </span>
                          </td>
                          <td>
                            <span className="contact-cell">
                              <FiMail size={12} /> {doc.email}
                            </span>
                          </td>
                          <td>
                            <span className="contact-cell">
                              {doc.phone ? <><FiPhone size={12} /> {doc.phone}</> : '—'}
                            </span>
                          </td>
                          <td className="text-right">
                            <Link to="/doctors" className="btn btn--ghost btn--xs">
                              Manage Profile <FiArrowRight size={12} />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PATIENTS MANAGEMENT */}
          {adminTab === 'patients' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span className="text-muted" style={{ fontSize: '0.875rem' }}>
                  Registered patient records ({patients.length} patients)
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link to="/patients" className="btn btn--primary btn--xs">
                    <FiPlus size={14} /> New Patient
                  </Link>
                  <Link to="/patients" className="btn btn--outline btn--xs">
                    Full Patient Directory <FiArrowRight size={12} />
                  </Link>
                </div>
              </div>

              {patientsLoading ? (
                <TableSkeleton rows={4} cols={5} />
              ) : patients.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state__icon">👥</div>
                  <h3>No patients registered</h3>
                  <p>Register patients to track their medical history and bookings.</p>
                  <Link to="/patients" className="btn btn--primary btn--sm">
                    <FiPlus /> New Patient
                  </Link>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Patient Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Gender</th>
                        <th className="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patients.slice(0, 6).map((pat) => (
                        <tr key={pat.id}>
                          <td>
                            <div className="user-cell">
                              <div className="avatar-circle avatar-circle--patient">
                                {pat.userName ? pat.userName[0].toUpperCase() : 'P'}
                              </div>
                              <div>
                                <strong>{pat.userName}</strong>
                                <small>Patient ID: #{pat.id}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="contact-cell">
                              <FiMail size={12} /> {pat.email}
                            </span>
                          </td>
                          <td>
                            <span className="contact-cell">
                              {pat.phone ? <><FiPhone size={12} /> {pat.phone}</> : '—'}
                            </span>
                          </td>
                          <td>
                            <span className="badge badge--gender">
                              {pat.gender || 'Not specified'}
                            </span>
                          </td>
                          <td className="text-right">
                            <Link to="/patients" className="btn btn--ghost btn--xs">
                              Manage Record <FiArrowRight size={12} />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. PATIENT VIEW: RECENT APPOINTMENTS */}
      {isPatient && (
        <div className="panel" style={{ marginTop: '1.5rem' }}>
          <div className="panel__header">
            <div>
              <h2 className="panel__title">My Consultations</h2>
              <p className="panel__subtitle">Your scheduled clinical consultations</p>
            </div>
            <Link to="/appointments" className="panel__link">
              View All ({appointments.length}) <FiArrowRight size={14} />
            </Link>
          </div>

          {apptsLoading ? (
            <TableSkeleton rows={4} cols={5} />
          ) : appointments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">🗓️</div>
              <h3>No appointments booked yet</h3>
              <p>You do not have any appointments scheduled.</p>
              <Link to="/appointments" className="btn btn--primary btn--sm">
                <FiPlus /> Book Consultation
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Doctor</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                    <th>Reason</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.slice(0, 5).map((appt) => (
                    <tr key={appt.id}>
                      <td>
                        <div className="user-cell">
                          <div className="avatar-circle avatar-circle--doctor">
                            {appt.doctor_name ? appt.doctor_name[0].toUpperCase() : 'D'}
                          </div>
                          <div>
                            <strong>{appt.doctor_name || `Doctor #${appt.doctorId}`}</strong>
                            <small>{appt.doctor_specialization || 'Clinical Specialist'}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="datetime-cell">
                          <span>{formatLocalDate(appt.startTime)}</span>
                          <small className="time-badge">
                            <FiClock size={12} /> {formatLocalTime(appt.startTime)} - {formatLocalTime(appt.endTime)}
                          </small>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`status-badge status-badge--${
                            appt.status?.toLowerCase() || 'scheduled'
                          }`}
                        >
                          {appt.status || 'SCHEDULED'}
                        </span>
                      </td>
                      <td>
                        <span className="text-truncate" title={appt.reason || 'General Consultation'}>
                          {appt.reason || 'General Consultation'}
                        </span>
                      </td>
                      <td className="text-right">
                        <Link to="/appointments" className="btn btn--ghost btn--xs">
                          Details <FiArrowRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 6. ADMIN MODAL: ADD DOCTOR (DIRECT CREATION ON ADMIN DASHBOARD) */}
      <Modal
        isOpen={showAddDoctorModal}
        onClose={() => {
          setShowAddDoctorModal(false);
          setDoctorForm(initialDoctorForm);
          setDoctorFormErrors({});
        }}
        title="Add Clinical Specialist / Doctor"
        size="md"
      >
        <form onSubmit={handleCreateDoctorSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="ad-name">Doctor Full Name *</label>
            <input
              id="ad-name"
              type="text"
              placeholder="Dr. Gregory House"
              value={doctorForm.name}
              onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
              className={doctorFormErrors.name ? 'input-error' : ''}
            />
            {doctorFormErrors.name && <span className="field-error">{doctorFormErrors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="ad-email">Email Address *</label>
            <input
              id="ad-email"
              type="email"
              placeholder="doctor@clinic.com"
              value={doctorForm.email}
              onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
              className={doctorFormErrors.email ? 'input-error' : ''}
            />
            {doctorFormErrors.email && <span className="field-error">{doctorFormErrors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="ad-spec">Specialization *</label>
            <select
              id="ad-spec"
              value={doctorForm.specialization}
              onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
              className="select-input"
            >
              {SPECIALIZATIONS.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="ad-phone">Phone Number</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#666', zIndex: 1, fontSize: '0.9rem', fontWeight: 500 }}>+91</span>
              <input
                id="ad-phone"
                type="tel"
                placeholder="XXXXXXXXXX"
                value={doctorForm.phone}
                onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                className={doctorFormErrors.phone ? 'input-error' : ''}
                style={{ paddingLeft: '2.5rem', width: '100%' }}
              />
            </div>
            {doctorFormErrors.phone && <span className="field-error">{doctorFormErrors.phone}</span>}
          </div>

          <div className="form-group">
            <div className="label-with-hint">
              <label htmlFor="ad-pw">Doctor Portal Password</label>
              <span className="input-hint text-muted">Used to sign in at /doctor/login</span>
            </div>
            <input
              id="ad-pw"
              type="text"
              placeholder="Doctor@123"
              value={doctorForm.password}
              onChange={(e) => setDoctorForm({ ...doctorForm, password: e.target.value })}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn--outline"
              onClick={() => {
                setShowAddDoctorModal(false);
                setDoctorForm(initialDoctorForm);
                setDoctorFormErrors({});
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={createDoctorMutation.isPending}
            >
              {createDoctorMutation.isPending ? (
                <>
                  <span className="spinner spinner--sm" /> Creating Doctor...
                </>
              ) : (
                'Create Doctor'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
