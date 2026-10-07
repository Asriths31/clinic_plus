import { useState, useMemo } from 'react';
import {
  FiCalendar,
  FiPlus,
  FiClock,
  FiFilter,
  FiEdit2,
  FiTrash2,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiSearch,
  FiUserCheck,
  FiCheck,
} from 'react-icons/fi';
import {
  useAppointments,
  useCreateAppointment,
  useUpdateAppointment,
  useDeleteAppointment,
} from '../hooks/useAppointments';
import { usePatients } from '../hooks/usePatients';
import { useDoctors } from '../hooks/useDoctors';
import useAuthStore from '../store/authStore';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { TableSkeleton } from '../components/ui/Skeleton';
import toast from 'react-hot-toast';
import {
  CLINIC_TIMEZONE,
  getLocalDateString,
  formatLocalTime,
  formatLocalTime24,
  formatLocalDate,
  formatLocalDateLong,
  createUTCISOString
} from '../utils/dateUtils';

// 30-minute consultation slots with 15-minute grace period between sessions
const CLINICAL_SLOTS = [
  { startTime: '09:00', endTime: '09:30', label: '09:00 - 09:30 AM' },
  { startTime: '09:45', endTime: '10:15', label: '09:45 - 10:15 AM' },
  { startTime: '10:30', endTime: '11:00', label: '10:30 - 11:00 AM' },
  { startTime: '11:15', endTime: '11:45', label: '11:15 - 11:45 AM' },
  { startTime: '12:00', endTime: '12:30', label: '12:00 - 12:30 PM' },
  { startTime: '12:45', endTime: '13:15', label: '12:45 - 01:15 PM' },
  { startTime: '13:30', endTime: '14:00', label: '01:30 - 02:00 PM' },
  { startTime: '14:15', endTime: '14:45', label: '02:15 - 02:45 PM' },
  { startTime: '15:00', endTime: '15:30', label: '03:00 - 03:30 PM' },
  { startTime: '15:45', endTime: '16:15', label: '03:45 - 04:15 PM' },
  { startTime: '16:30', endTime: '17:00', label: '04:30 - 05:00 PM' },
  { startTime: '17:15', endTime: '17:45', label: '05:15 - 05:45 PM' },
];

const toMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

const isSunday = (dateStr) => {
  if (!dateStr) return false;
  const iso = createUTCISOString(dateStr, '12:00');
  const d = new Date(iso);
  const formatter = new Intl.DateTimeFormat('en-US', { timeZone: CLINIC_TIMEZONE, weekday: 'long' });
  return formatter.format(d) === 'Sunday';
};

const getNextAvailableDate = () => {
  const dStr = getLocalDateString(new Date());
  const iso = createUTCISOString(dStr, '12:00');
  const d = new Date(iso);
  const formatter = new Intl.DateTimeFormat('en-US', { timeZone: CLINIC_TIMEZONE, weekday: 'long' });
  if (formatter.format(d) === 'Sunday') {
    d.setTime(d.getTime() + 24 * 60 * 60 * 1000);
  }
  return getLocalDateString(d);
};

const getQuickDates = () => {
  const dates = [];
  const nowStr = getLocalDateString(new Date());
  const curr = new Date(createUTCISOString(nowStr, '12:00'));
  
  while (dates.length < 6) {
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: CLINIC_TIMEZONE, weekday: 'short' });
    if (formatter.format(curr) !== 'Sun') {
      const dateStr = getLocalDateString(curr);
      const dayName = formatter.format(curr);
      const displayDate = new Intl.DateTimeFormat('en-US', { timeZone: CLINIC_TIMEZONE, month: 'short', day: 'numeric' }).format(curr);
      dates.push({ dateStr, dayName, displayDate });
    }
    curr.setTime(curr.getTime() + 24 * 60 * 60 * 1000);
  }
  return dates;
};

export default function Appointments() {
  const { user } = useAuthStore();
  const isPatient = user?.role === 'PATIENT';
  const isDoctor = user?.role === 'DOCTOR';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST';

  const [selectedDate, setSelectedDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: res, isLoading, error, refetch } = useAppointments(selectedDate || null);
  const { data: patientsRes } = usePatients();
  const { data: doctorsRes } = useDoctors();

  const createMutation = useCreateAppointment();
  const updateMutation = useUpdateAppointment();
  const deleteMutation = useDeleteAppointment();

  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [currentAppt, setCurrentAppt] = useState(null);
  const [deleteApptId, setDeleteApptId] = useState(null);
  const [conflictError, setConflictError] = useState(null);

  const patients = !isPatient && Array.isArray(patientsRes?.data) ? patientsRes.data : [];
  const doctors = Array.isArray(doctorsRes?.data) ? doctorsRes.data : [];
  const allAppointments = Array.isArray(res?.data) ? res.data : [];

  // Scoped appointments: Patients see their bookings, Doctors see their assigned schedule, Admins see all
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

  const initialForm = {
    patientId: isPatient ? (user?.id || '') : '',
    doctorId: isDoctor ? (user?.id || '') : '',
    appointmentDate: getNextAvailableDate(),
    startTime: '',
    endTime: '',
    reason: '',
    status: 'SCHEDULED',
  };
  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        appt.patient_name?.toLowerCase().includes(term) ||
        appt.doctor_name?.toLowerCase().includes(term) ||
        appt.reason?.toLowerCase().includes(term);

      const matchesStatus = statusFilter === 'ALL' || appt.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [appointments, searchTerm, statusFilter]);

  const openCreateModal = () => {
    const defaultDate = getNextAvailableDate();
    setForm({
      ...initialForm,
      appointmentDate: defaultDate,
      patientId: isPatient ? (user?.id || '') : (patients[0]?.id || ''),
      doctorId: isDoctor ? (user?.id || '') : (doctors[0]?.id || ''),
    });
    setFormErrors({});
    setConflictError(null);
    setCurrentAppt(null);
    setModalMode('create');
  };

  const handleQuickStatus = async (appt, newStatus) => {
    try {
      await updateMutation.mutateAsync({
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
      toast.error(err.message || 'Failed to update status');
    }
  };

  const openEditModal = (appt) => {
    setCurrentAppt(appt);
    setForm({
      patientId: appt.patientId,
      doctorId: appt.doctorId,
      appointmentDate: getLocalDateString(appt.startTime),
      startTime: formatLocalTime24(appt.startTime),
      endTime: formatLocalTime24(appt.endTime),
      reason: appt.reason || '',
      status: appt.status || 'SCHEDULED',
    });
    setFormErrors({});
    setConflictError(null);
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setCurrentAppt(null);
    setFormErrors({});
    setConflictError(null);
  };

  const handleDateChange = (newDate) => {
    if (isSunday(newDate)) {
      setFormErrors((prev) => ({
        ...prev,
        appointmentDate: '⚠️ Sundays are closed. Clinic operates Monday through Saturday.',
      }));
      toast.error('The clinic is closed on Sundays. Please select Monday through Saturday.');
      setForm((prev) => ({ ...prev, appointmentDate: '', startTime: '', endTime: '' }));
      return;
    }
    setFormErrors((prev) => ({ ...prev, appointmentDate: '' }));
    setForm((prev) => ({ ...prev, appointmentDate: newDate, startTime: '', endTime: '' }));
    setConflictError(null);
  };

  const handleSlotSelect = (slot) => {
    setForm((prev) => ({
      ...prev,
      startTime: slot.startTime,
      endTime: slot.endTime,
    }));
    setFormErrors((prev) => ({ ...prev, startTime: '', endTime: '' }));
    setConflictError(null);
  };

  // Check if a specific slot is available for doctor on form.appointmentDate
  const checkSlotAvailability = (slot) => {
    if (!form.doctorId || !form.appointmentDate) {
      return { isAvailable: false, reason: 'Select doctor & date' };
    }

    if (isSunday(form.appointmentDate)) {
      return { isAvailable: false, reason: 'Closed (Sunday)' };
    }

    // Check if slot has already passed today
    const todayStr = getLocalDateString(new Date());
    if (form.appointmentDate === todayStr) {
      const nowStr = formatLocalTime24(new Date().toISOString());
      const currentMins = toMinutes(nowStr);
      if (toMinutes(slot.startTime) <= currentMins) {
        return { isAvailable: false, reason: 'Past Time' };
      }
    }

    // Check against existing appointments for this doctor on this date
    // Note: includes the 15-minute grace period buffer
    const doctorAppts = allAppointments.filter(
      (a) =>
        a.doctorId === parseInt(form.doctorId) &&
        getLocalDateString(a.startTime) === form.appointmentDate &&
        a.status !== 'CANCELLED' &&
        a.id !== currentAppt?.id
    );

    const slotStartMin = toMinutes(slot.startTime);
    const slotEndMin = toMinutes(slot.endTime);

    for (const appt of doctorAppts) {
      const apptStartMin = toMinutes(formatLocalTime24(appt.startTime));
      const apptEndMin = toMinutes(formatLocalTime24(appt.endTime));

      // Interval overlap with 15-min grace:
      // slot conflicts if slotStart < apptEnd + 15 AND slotEnd + 15 > apptStart
      if (slotStartMin < apptEndMin + 15 && slotEndMin + 15 > apptStartMin) {
        return { isAvailable: false, reason: 'Booked' };
      }
    }

    return { isAvailable: true, reason: 'Available' };
  };

  const validate = () => {
    const errs = {};
    const patientIdToValidate = isPatient ? user?.id : form.patientId;
    if (!patientIdToValidate) errs.patientId = 'Please select a patient';
    if (!form.doctorId) errs.doctorId = 'Please select a doctor';
    if (!form.appointmentDate) {
      errs.appointmentDate = 'Appointment date is required';
    } else if (isSunday(form.appointmentDate)) {
      errs.appointmentDate = 'The clinic is closed on Sundays. Please select Monday – Saturday.';
    }
    if (!form.startTime || !form.endTime) {
      errs.startTime = 'Please select an available time slot';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setConflictError(null);
    if (!validate()) return;

    try {
      const payload = {
        patientId: parseInt(isPatient ? user.id : form.patientId),
        doctorId: parseInt(form.doctorId),
        startTime: createUTCISOString(form.appointmentDate, form.startTime),
        endTime: createUTCISOString(form.appointmentDate, form.endTime),
        reason: form.reason || 'General Consultation',
        ...(modalMode === 'edit' ? { status: form.status } : {}),
      };

      if (modalMode === 'create') {
        await createMutation.mutateAsync(payload);
        toast.success('Appointment scheduled successfully');
      } else {
        await updateMutation.mutateAsync({ id: currentAppt.id, data: payload });
        toast.success('Appointment updated successfully');
      }
      closeModal();
    } catch (err) {
      if (err.status === 409 || err.message?.includes('conflict')) {
        setConflictError(err.message || 'Scheduling conflict detected for this doctor.');
      } else {
        toast.error(err.message || 'Failed to save appointment');
      }
    }
  };

  const confirmDelete = async () => {
    if (!deleteApptId) return;
    try {
      await deleteMutation.mutateAsync(deleteApptId);
      toast.success('Appointment deleted');
      setDeleteApptId(null);
    } catch (err) {
      toast.error(err.message || 'Failed to cancel appointment');
    }
  };



  const quickDates = useMemo(() => getQuickDates(), []);

  return (
    <div className="page-container">
      {/* Header bar */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {isPatient ? 'My Appointments' : isDoctor ? 'My Consultations & Schedule' : 'Appointment Management'}
          </h1>
          <p className="page-subtitle">
            {isPatient
              ? 'View, book, and manage your clinical consultations'
              : isDoctor
              ? 'Review your patient schedule and complete consultations'
              : 'Schedule, reschedule, and monitor clinical visits'}
          </p>
        </div>
        {!isDoctor&&<button className="btn btn--primary" onClick={openCreateModal}>
          <FiPlus size={16} /> Book Appointment
        </button>}
      </div>

      {/* Filter and Date Search Bar */}
      <div className="filter-bar filter-bar--wrap">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder={
              isPatient
                ? 'Search doctor or reason...'
                : isDoctor
                ? 'Search patient or reason...'
                : 'Search by patient, doctor, or reason...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="search-clear" onClick={() => setSearchTerm('')}>&times;</button>
          )}
        </div>

        <div className="filter-group">
          <label className="filter-label">
            <FiCalendar size={14} /> Date:
          </label>
          <input
            type="date"
            className="date-input"
            value={selectedDate}
            onChange={(e) => {
              if (isSunday(e.target.value)) {
                toast.error('The clinic is closed on Sundays.');
                return;
              }
              setSelectedDate(e.target.value);
            }}
          />
          {selectedDate && (
            <button
              className="btn btn--ghost btn--xs"
              onClick={() => setSelectedDate('')}
              title="Show All Dates"
            >
              All Dates
            </button>
          )}
        </div>

        <div className="filter-select-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select-input select-input--filter"
          >
            <option value="ALL">All Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="filter-info">
          Found <strong>{filteredAppointments.length}</strong> bookings
        </div>
      </div>

      {/* Appointments Table */}
      <div className="panel">
        {isLoading ? (
          <TableSkeleton rows={5} cols={isPatient || isDoctor ? 5 : 6} />
        ) : error ? (
          <div className="alert-card alert-card--error">
            <p>Error loading appointments: {error.message}</p>
            <button className="btn btn--sm btn--outline" onClick={() => refetch()}>Retry</button>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">🗓️</div>
            <h3>No appointments found</h3>
            <p>
              {selectedDate || searchTerm || statusFilter !== 'ALL'
                ? 'No appointments match the selected filters.'
                : isPatient
                ? 'You do not have any clinical consultations booked.'
                : isDoctor
                ? 'No consultations scheduled on your calendar.'
                : 'No clinic sessions are scheduled yet.'}
            </p>
            {!isDoctor&&<button className="btn btn--primary btn--sm" onClick={openCreateModal}>
              <FiPlus /> Book Consultation
            </button>}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  {!isPatient && <th>Patient</th>}
                  {!isDoctor && <th>Doctor</th>}
                  <th>Session Date</th>
                  <th>Time Slot</th>
                  <th>Status</th>
                  <th>Reason / Notes</th>
                  {!isPatient && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((appt) => (
                  <tr key={appt.id}>
                    {!isPatient && (
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
                    )}
                    {!isDoctor && (
                      <td>
                        <div className="user-cell">
                          <div className="avatar-circle avatar-circle--doctor">
                            {appt.doctor_name ? appt.doctor_name[0].toUpperCase() : 'D'}
                          </div>
                          <div>
                            <strong>{appt.doctor_name || `Doctor #${appt.doctorId}`}</strong>
                            <small>{appt.doctor_specialization || 'Clinical Doctor'}</small>
                          </div>
                        </div>
                      </td>
                    )}
                    <td>
                      <span className="font-medium">{formatLocalDateLong(appt.startTime)}</span>
                    </td>
                    <td>
                      <div className="time-badge">
                        <FiClock size={13} />
                        <span>{formatLocalTime(appt.startTime)} - {formatLocalTime(appt.endTime)}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge status-badge--${appt.status?.toLowerCase() || 'scheduled'}`}>
                        {appt.status || 'SCHEDULED'}
                      </span>
                    </td>
                    <td>
                      <span className="text-truncate" style={{ maxWidth: '200px' }} title={appt.reason || 'General Consultation'}>
                        {appt.reason || 'General Consultation'}
                      </span>
                    </td>
                    {!isPatient && (
<td className="text-right">
                      <div className="action-buttons">
                        {(isDoctor || isAdmin) && appt.status === 'SCHEDULED' && (
                          <button
                            className="icon-btn icon-btn--success"
                            onClick={() => handleQuickStatus(appt, 'COMPLETED')}
                            title="Mark as Completed"
                          >
                            <FiCheck size={16} />
                          </button>
                        )}
                        <button
                          className="icon-btn icon-btn--edit"
                          onClick={() => openEditModal(appt)}
                          title="Reschedule / Edit"
                        >
                          <FiEdit2 size={15} />
                        </button>
                        <button
                          className="icon-btn icon-btn--delete"
                          onClick={() => setDeleteApptId(appt.id)}
                          title="Cancel / Delete"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </td>
)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking / Reschedule Modal */}
      <Modal
        isOpen={modalMode !== null}
        onClose={closeModal}
        title={modalMode === 'create' ? 'Book Clinical Appointment' : 'Reschedule / Edit Appointment'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="modal-form">
          {/* Conflict Warning Alert Box */}
          {conflictError && (
            <div className="conflict-alert">
              <FiAlertTriangle className="conflict-alert__icon" size={20} />
              <div className="conflict-alert__content">
                <strong>Doctor Unavailable / Conflict Detected</strong>
                <p>{conflictError}</p>
              </div>
            </div>
          )}

          {/* Patient Selection: Locked to logged-in user if role is PATIENT */}
          {isPatient ? (
            <div className="form-group">
              <label>Patient</label>
              <input
                type="text"
                value={`${user?.name || 'You'}`}
                disabled
                style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#475569' }}
              />
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="appt-patient">Select Patient *</label>
              <select
                id="appt-patient"
                value={form.patientId}
                onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                className={`select-input ${formErrors.patientId ? 'input-error' : ''}`}
              >
                <option value="">-- Choose Patient --</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.userName} ({p.email})
                  </option>
                ))}
              </select>
              {formErrors.patientId && <span className="field-error">{formErrors.patientId}</span>}
            </div>
          )}

          {/* Doctor Selection */}
          {isDoctor ? (
            <div className="form-group">
              <label>Assigned Doctor</label>
              <input
                type="text"
                value={`${user?.name || 'You'} (Your Calendar)`}
                disabled
                style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#475569' }}
              />
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="appt-doctor">Select Doctor *</label>
              <select
                id="appt-doctor"
                value={form.doctorId}
                onChange={(e) => {
                  setForm({ ...form, doctorId: e.target.value, startTime: '', endTime: '' });
                  setConflictError(null);
                }}
                className={`select-input ${formErrors.doctorId ? 'input-error' : ''}`}
              >
                <option value="">-- Choose Doctor --</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                     {d.name} — {d.specialization}
                  </option>
                ))}
              </select>
              {formErrors.doctorId && <span className="field-error">{formErrors.doctorId}</span>}
            </div>
          )}

          {/* Date Picker (Sundays Disallowed) */}
          <div className="form-group">
            <div className="label-with-hint">
              <label htmlFor="appt-date">Appointment Date *</label>
              <span className="input-hint text-muted">Closed on Sundays (Mon – Sat only)</span>
            </div>

            {/* Quick date selector pills for next 6 operating days */}
            <div className="quick-dates-row">
              {quickDates.map((qd) => (
                <button
                  key={qd.dateStr}
                  type="button"
                  className={`quick-date-pill ${
                    form.appointmentDate === qd.dateStr ? 'quick-date-pill--active' : ''
                  }`}
                  onClick={() => handleDateChange(qd.dateStr)}
                >
                  <span className="quick-date-pill__day">{qd.dayName}</span>
                  <span className="quick-date-pill__date">{qd.displayDate}</span>
                </button>
              ))}
            </div>

            <input
              id="appt-date"
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={form.appointmentDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className={formErrors.appointmentDate ? 'input-error' : ''}
            />
            {formErrors.appointmentDate && (
              <span className="field-error">{formErrors.appointmentDate}</span>
            )}
          </div>

          {/* Time Slots as Interactive Availability Buttons */}
          <div className="form-group">
            <div className="label-with-hint">
              <label>Select Time Slot *</label>
              {form.startTime && (
                <span className="badge badge--specialty">
                  Selected: {formatLocalTime(`1970-01-01T${form.startTime}:00Z`)} - {formatLocalTime(`1970-01-01T${form.endTime}:00Z`)}
                </span>
              )}
            </div>

            {/* Legend */}
            <div className="slots-legend">
              <span className="legend-item">
                <span className="legend-dot legend-dot--available"></span> Available
              </span>
              <span className="legend-item">
                <span className="legend-dot legend-dot--selected"></span> Selected
              </span>
              <span className="legend-item">
                <span className="legend-dot legend-dot--booked"></span> Booked / Unavailable
              </span>
            </div>

            {!form.appointmentDate ? (
              <div className="slots-placeholder">
                <FiCalendar /> Please select an operating date to view available slots.
              </div>
            ) : !form.doctorId ? (
              <div className="slots-placeholder">
                <FiUserCheck /> Please select a doctor to view their schedule.
              </div>
            ) : (
              <div className="slots-grid">
                {CLINICAL_SLOTS.map((slot) => {
                  const { isAvailable, reason } = checkSlotAvailability(slot);
                  const isSelected =
                    form.startTime === slot.startTime && form.endTime === slot.endTime;

                  return (
                    <button
                      key={slot.startTime}
                      type="button"
                      disabled={!isAvailable}
                      className={`slot-btn ${
                        isSelected
                          ? 'slot-btn--selected'
                          : !isAvailable
                          ? 'slot-btn--disabled'
                          : 'slot-btn--available'
                      }`}
                      onClick={() => handleSlotSelect(slot)}
                    >
                      <div className="slot-btn__time">{slot.label}</div>
                      <div className="slot-btn__status">
                        {isSelected ? '✓ Selected' : isAvailable ? 'Available' : reason}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {formErrors.startTime && <span className="field-error">{formErrors.startTime}</span>}
          </div>

          {modalMode === 'edit' && (
            <div className="form-group">
              <label htmlFor="appt-status">Status</label>
              <select
                id="appt-status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="select-input"
              >
                <option value="SCHEDULED">SCHEDULED</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="appt-reason">Reason for Visit / Chief Complaint</label>
            <textarea
              id="appt-reason"
              rows={2}
              placeholder="e.g. Annual physical, follow-up consultation, fever and cough..."
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn--outline" onClick={closeModal}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <span className="spinner spinner--sm" /> Verifying slot...
                </>
              ) : (
                modalMode === 'create' ? 'Confirm Appointment' : 'Save Changes'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete / Cancel Confirmation */}
      <ConfirmDialog
        isOpen={deleteApptId !== null}
        onClose={() => setDeleteApptId(null)}
        onConfirm={confirmDelete}
        title="Cancel Appointment?"
        message="Are you sure you want to remove this appointment? This time slot will be made available for other patients."
        confirmText="Yes, Cancel Booking"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
