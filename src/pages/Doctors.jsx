import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { FiUserCheck, FiPlus, FiSearch, FiEdit2, FiTrash2, FiMail, FiPhone, FiActivity, FiAward } from 'react-icons/fi';
import { useDoctors, useCreateDoctor, useUpdateDoctor, useDeleteDoctor } from '../hooks/useDoctors';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { TableSkeleton } from '../components/ui/Skeleton';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

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

export default function Doctors() {
  const { user } = useAuthStore();
  if (user?.role === 'PATIENT' || user?.role === 'DOCTOR') {
    return <Navigate to="/dashboard" replace />;
  }
  const isAdmin = user?.role === 'ADMIN';

  const { data: res, isLoading, error, refetch } = useDoctors();
  const createMutation = useCreateDoctor();
  const updateMutation = useUpdateDoctor();
  const deleteMutation = useDeleteDoctor();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('ALL');
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [currentDoctor, setCurrentDoctor] = useState(null);
  const [deleteDoctorId, setDeleteDoctorId] = useState(null);

  const initialForm = {
    name: '',
    email: '',
    phone: '',
    specialization: 'General Medicine',
  };
  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});

  const doctors = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);

  const filteredDoctors = doctors.filter((doc) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      doc.name?.toLowerCase().includes(term) ||
      doc.email?.toLowerCase().includes(term) ||
      doc.specialization?.toLowerCase().includes(term);

    const matchesSpec = selectedSpec === 'ALL' || doc.specialization === selectedSpec;

    return matchesSearch && matchesSpec;
  });

  const openCreateModal = () => {
    setForm(initialForm);
    setFormErrors({});
    setCurrentDoctor(null);
    setModalMode('create');
  };

  const openEditModal = (doctor) => {
    setCurrentDoctor(doctor);
    setForm({
      name: doctor.name || '',
      email: doctor.email || '',
      phone: doctor.phone || '',
      specialization: doctor.specialization || 'General Medicine',
    });
    setFormErrors({});
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setCurrentDoctor(null);
    setFormErrors({});
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Doctor name is required';
    if (!form.email.trim()) errs.email = 'Email address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email address';
    if (!form.specialization.trim()) errs.specialization = 'Specialization is required';
    if (form.phone && form.phone.length !== 10) errs.phone = 'Phone number must be exactly 10 digits';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (modalMode === 'create') {
        await createMutation.mutateAsync(form);
        toast.success('Doctor registered successfully');
      } else {
        await updateMutation.mutateAsync({ id: currentDoctor.id, data: form });
        toast.success('Doctor profile updated successfully');
      }
      closeModal();
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const confirmDelete = async () => {
    if (!deleteDoctorId) return;
    try {
      await deleteMutation.mutateAsync(deleteDoctorId);
      toast.success('Doctor record deleted');
      setDeleteDoctorId(null);
    } catch (err) {
      toast.error(err.message || 'Failed to delete doctor');
    }
  };

  return (
    <div className="page-container">
      {/* Header bar */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Medical Staff & Doctors</h1>
          <p className="page-subtitle">View and manage clinical practitioners and specialties</p>
        </div>
        {isAdmin && (
          <button className="btn btn--primary" onClick={openCreateModal}>
            <FiPlus size={16} /> Add Doctor
          </button>
        )}
      </div>

      {/* Filter / Search Bar */}
      <div className="filter-bar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, email, or specialty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="search-clear" onClick={() => setSearchTerm('')}>&times;</button>
          )}
        </div>

        <div className="filter-select-wrap">
          <select
            value={selectedSpec}
            onChange={(e) => setSelectedSpec(e.target.value)}
            className="select-input select-input--filter"
          >
            <option value="ALL">All Specializations</option>
            {SPECIALIZATIONS.map((spec) => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
        </div>

        <div className="filter-info">
          Showing <strong>{filteredDoctors.length}</strong> of {doctors.length} doctors
        </div>
      </div>

      {/* Doctors Table */}
      <div className="panel">
        {isLoading ? (
          <TableSkeleton rows={4} cols={5} />
        ) : error ? (
          <div className="alert-card alert-card--error">
            <p>Error loading doctors: {error.message}</p>
            <button className="btn btn--sm btn--outline" onClick={() => refetch()}>Retry</button>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">🩺</div>
            <h3>No doctors found</h3>
            <p>{searchTerm || selectedSpec !== 'ALL' ? 'No practitioners match your current filters' : 'No doctors have been registered yet.'}</p>
            {!searchTerm && selectedSpec === 'ALL' && isAdmin && (
              <button className="btn btn--primary btn--sm" onClick={openCreateModal}>
                <FiPlus /> Add Doctor
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Doctor Name</th>
                  <th>Specialization</th>
                  <th>Contact Email</th>
                  <th>Phone Number</th>
                  {isAdmin && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredDoctors.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div className="user-cell">
                        <div className="avatar-circle avatar-circle--doctor">
                          {doc.name ? doc.name[0].toUpperCase() : 'D'}
                        </div>
                        <div>
                          <strong>{doc.name.startsWith('Dr.') ? doc.name : `Dr. ${doc.name}`}</strong>
                          <small>Staff ID: #{doc.id}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge--specialty">
                        <FiAward size={12} /> {doc.specialization || 'General Practice'}
                      </span>
                    </td>
                    <td>
                      <div className="contact-cell">
                        <span title={doc.email}><FiMail size={12} /> {doc.email}</span>
                      </div>
                    </td>
                    <td>
                      <div className="contact-cell">
                        {doc.phone ? (
                          <span title={doc.phone}><FiPhone size={12} /> {doc.phone}</span>
                        ) : (
                          <span className="meta-text text-muted">—</span>
                        )}
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="text-right">
                        <div className="action-buttons">
                          <button
                            className="icon-btn icon-btn--edit"
                            onClick={() => openEditModal(doc)}
                            title="Edit Doctor"
                          >
                            <FiEdit2 size={15} />
                          </button>
                          <button
                            className="icon-btn icon-btn--delete"
                            onClick={() => setDeleteDoctorId(doc.id)}
                            title="Delete Doctor"
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

      {/* Add / Edit Doctor Modal */}
      <Modal
        isOpen={modalMode !== null}
        onClose={closeModal}
        title={modalMode === 'create' ? 'Add Clinical Specialist' : 'Edit Doctor Profile'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="d-name">Doctor Full Name *</label>
            <input
              id="d-name"
              type="text"
              placeholder="Dr. Gregory House"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={formErrors.name ? 'input-error' : ''}
            />
            {formErrors.name && <span className="field-error">{formErrors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="d-email">Email Address *</label>
            <input
              id="d-email"
              type="email"
              placeholder="doctor@clinic.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={formErrors.email ? 'input-error' : ''}
            />
            {formErrors.email && <span className="field-error">{formErrors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="d-spec">Specialization *</label>
            <select
              id="d-spec"
              value={form.specialization}
              onChange={(e) => setForm({ ...form, specialization: e.target.value })}
              className="select-input"
            >
              {SPECIALIZATIONS.map((spec) => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="d-phone">Phone Number</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#666', zIndex: 1, fontSize: '0.9rem', fontWeight: 500 }}>+91</span>
              <input
                id="d-phone"
                type="tel"
                placeholder="XXXXXXXXXX"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                className={formErrors.phone ? 'input-error' : ''}
                style={{ paddingLeft: '2.5rem', width: '100%' }}
              />
            </div>
            {formErrors.phone && <span className="field-error">{formErrors.phone}</span>}
          </div>

          {modalMode === 'create' && (
            <div className="form-group">
              <label htmlFor="d-password">Portal Login Password (Defaults to Doctor@123)</label>
              <input
                id="d-password"
                type="text"
                placeholder="Doctor@123"
                value={form.password || ''}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
          )}

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
                  <span className="spinner spinner--sm" /> Saving...
                </>
              ) : (
                modalMode === 'create' ? 'Add Doctor' : 'Save Changes'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteDoctorId !== null}
        onClose={() => setDeleteDoctorId(null)}
        onConfirm={confirmDelete}
        title="Delete Doctor Profile?"
        message="Are you sure you want to remove this doctor? Existing appointments associated with this doctor may be affected."
        confirmText="Yes, Delete"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
