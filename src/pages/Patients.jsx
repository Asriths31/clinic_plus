import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { FiUsers, FiPlus, FiSearch, FiEdit2, FiTrash2, FiMail, FiPhone, FiMapPin, FiCalendar } from 'react-icons/fi';
import { usePatients, useCreatePatient, useUpdatePatient, useDeletePatient } from '../hooks/usePatients';
import useAuthStore from '../store/authStore';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { TableSkeleton } from '../components/ui/Skeleton';
import toast from 'react-hot-toast';

export default function Patients() {
  const { user } = useAuthStore();
  if (user?.role === 'PATIENT' || user?.role === 'DOCTOR') {
    return <Navigate to="/dashboard" replace />;
  }

  const { data: res, isLoading, error, refetch } = usePatients();
  const createMutation = useCreatePatient();
  const updateMutation = useUpdatePatient();
  const deleteMutation = useDeletePatient();

  const [searchTerm, setSearchTerm] = useState('');
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [currentPatient, setCurrentPatient] = useState(null);
  const [deletePatientId, setDeletePatientId] = useState(null);

  // Form State
  const initialForm = {
    userName: '',
    email: '',
    phone: '',
    gender: 'MALE',
    dob: '',
    bloodGroup: 'O+',
    isMarried: false,
    address: '',
    password: '',
  };
  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});

  const patients = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);

  const filteredPatients = patients.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.userName?.toLowerCase().includes(term) ||
      p.email?.toLowerCase().includes(term) ||
      p.phone?.toLowerCase().includes(term)
    );
  });

  const openCreateModal = () => {
    setForm(initialForm);
    setFormErrors({});
    setCurrentPatient(null);
    setModalMode('create');
  };

  const openEditModal = (patient) => {
    setCurrentPatient(patient);
    setForm({
      userName: patient.userName || '',
      email: patient.email || '',
      phone: patient.phone || '',
      gender: patient.gender || 'MALE',
      dob: patient.dob ? patient.dob.split('T')[0] : '',
      bloodGroup: patient.bloodGroup || 'O+',
      isMarried: !!patient.isMarried,
      address: patient.address || '',
      password: '',
    });
    setFormErrors({});
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setCurrentPatient(null);
    setFormErrors({});
  };

  const validate = () => {
    const errs = {};
    if (!form.userName.trim()) errs.userName = 'Full name is required';
    if (!form.email.trim()) errs.email = 'Email address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email address';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (modalMode === 'create') {
        await createMutation.mutateAsync(form);
        toast.success('Patient registered successfully');
      } else {
        const updateData = { ...form };
        if (!updateData.password) delete updateData.password;
        await updateMutation.mutateAsync({ id: currentPatient.id, data: updateData });
        toast.success('Patient details updated successfully');
      }
      closeModal();
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const confirmDelete = async () => {
    if (!deletePatientId) return;
    try {
      await deleteMutation.mutateAsync(deletePatientId);
      toast.success('Patient record removed');
      setDeletePatientId(null);
    } catch (err) {
      toast.error(err.message || 'Failed to delete patient');
    }
  };

  return (
    <div className="page-container">
      {/* Header bar */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Patients Directory</h1>
          <p className="page-subtitle">Manage patient medical profiles and records</p>
        </div>
        <button className="btn btn--primary" onClick={openCreateModal}>
          <FiPlus size={16} /> Register Patient
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="filter-bar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="search-clear" onClick={() => setSearchTerm('')}>&times;</button>
          )}
        </div>
        <div className="filter-info">
          Showing <strong>{filteredPatients.length}</strong> of {patients.length} patients
        </div>
      </div>

      {/* Patients Table */}
      <div className="panel">
        {isLoading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : error ? (
          <div className="alert-card alert-card--error">
            <p>Error loading patients: {error.message}</p>
            <button className="btn btn--sm btn--outline" onClick={() => refetch()}>Retry</button>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">👥</div>
            <h3>No patients found</h3>
            <p>{searchTerm ? 'Try adjusting your search query' : 'Register your first patient to get started.'}</p>
            {!searchTerm && (
              <button className="btn btn--primary btn--sm" onClick={openCreateModal}>
                <FiPlus /> Register Patient
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Contact</th>
                  <th>Gender / Age</th>
                  <th>Blood Group</th>
                  <th>Marital Status</th>
                  <th>Address</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => {
                  const age = patient.dob
                    ? Math.floor((new Date() - new Date(patient.dob)) / 31557600000)
                    : null;

                  return (
                    <tr key={patient.id}>
                      <td>
                        <div className="user-cell">
                          <div className="avatar-circle avatar-circle--patient">
                            {patient.userName ? patient.userName[0].toUpperCase() : 'P'}
                          </div>
                          <div>
                            <strong>{patient.userName}</strong>
                            <small>ID: #{patient.id}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="contact-cell">
                          <span title={patient.email}><FiMail size={12} /> {patient.email}</span>
                          {patient.phone && (
                            <span title={patient.phone}><FiPhone size={12} /> {patient.phone}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="meta-text">
                          {patient.gender || 'N/A'}{age !== null ? `, ${age} yrs` : ''}
                        </span>
                      </td>
                      <td>
                        {patient.bloodGroup ? (
                          <span className="badge badge--blood">{patient.bloodGroup}</span>
                        ) : (
                          <span className="meta-text text-muted">—</span>
                        )}
                      </td>
                      <td>
                        <span className="meta-text">{patient.isMarried ? 'Married' : 'Single'}</span>
                      </td>
                      <td>
                        <span className="text-truncate" style={{ maxWidth: '160px' }} title={patient.address || ''}>
                          {patient.address || '—'}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="action-buttons">
                          <button
                            className="icon-btn icon-btn--edit"
                            onClick={() => openEditModal(patient)}
                            title="Edit Patient"
                          >
                            <FiEdit2 size={15} />
                          </button>
                          <button
                            className="icon-btn icon-btn--delete"
                            onClick={() => setDeletePatientId(patient.id)}
                            title="Delete Patient"
                          >
                            <FiTrash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Patient Modal */}
      <Modal
        isOpen={modalMode !== null}
        onClose={closeModal}
        title={modalMode === 'create' ? 'Register New Patient' : 'Edit Patient Profile'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="p-name">Full Name *</label>
              <input
                id="p-name"
                type="text"
                placeholder="John Doe"
                value={form.userName}
                onChange={(e) => setForm({ ...form, userName: e.target.value })}
                className={formErrors.userName ? 'input-error' : ''}
              />
              {formErrors.userName && <span className="field-error">{formErrors.userName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="p-email">Email Address *</label>
              <input
                id="p-email"
                type="email"
                placeholder="john@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={formErrors.email ? 'input-error' : ''}
              />
              {formErrors.email && <span className="field-error">{formErrors.email}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="p-phone">Phone Number</label>
              <input
                id="p-phone"
                type="tel"
                placeholder="+1 555-0199"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="p-gender">Gender</label>
              <select
                id="p-gender"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="select-input"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="p-dob">Date of Birth</label>
              <input
                id="p-dob"
                type="date"
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="p-blood">Blood Group</label>
              <select
                id="p-blood"
                value={form.bloodGroup}
                onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                className="select-input"
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div className="form-group form-group--checkbox">
              <label className="checkbox-label" htmlFor="p-married">
                <input
                  id="p-married"
                  type="checkbox"
                  checked={form.isMarried}
                  onChange={(e) => setForm({ ...form, isMarried: e.target.checked })}
                />
                <span>Married</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="p-address">Residential Address</label>
            <textarea
              id="p-address"
              rows={2}
              placeholder="123 Health Ave, Suite 400..."
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>

          {modalMode === 'create' && (
            <div className="form-group">
              <label htmlFor="p-password">Account Password (Optional)</label>
              <input
                id="p-password"
                type="password"
                placeholder="Optional login password for portal"
                value={form.password}
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
                modalMode === 'create' ? 'Register Patient' : 'Save Changes'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deletePatientId !== null}
        onClose={() => setDeletePatientId(null)}
        onConfirm={confirmDelete}
        title="Delete Patient Record?"
        message="Are you sure you want to delete this patient? All related appointment history will also be permanently deleted."
        confirmText="Yes, Delete"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
