import { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '../services/apiServices/userService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineX,
  HiOutlineOfficeBuilding,
  HiOutlineUserGroup
} from 'react-icons/hi';
import PageHeader from '../components/PageHeader';
import { Card } from '../components/Card';
import Button from '../components/Button';
import { Table, Thead, Th, Tbody, Tr, Td } from '../components/Table';
import Badge from '../components/Badge';
import { ModalOverlay, Modal, ModalHeader, ModalBody, ModalFooter } from '../components/Modal';
import { Input, Select } from '../components/Form';

export default function Settings() {
  const { user, hasRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', role: 'mechanic'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Could not load users');
    } finally {
      setLoading(false);
    }
  };

  const openAddUser = () => {
    setEditingUser(null);
    setForm({ name: '', email: '', phone: '', password: '', role: 'mechanic' });
    setShowUserModal(true);
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await updateUser(editingUser._id, form);
        toast.success('User updated!');
      } else {
        await createUser(form);
        toast.success('User added!');
      }
      setShowUserModal(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save user');
    }
  };

  const toggleUserActive = async (userId, isActive) => {
    try {
      await updateUser(userId, { isActive: !isActive });
      toast.success(`User ${isActive ? 'deactivated' : 'activated'}`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const roleColors = {
    owner: 'var(--primary-600)',
    admin: '#7c3aed',
    service_advisor: 'var(--success)',
    mechanic: 'var(--accent-600)',
    receptionist: '#0f766e'
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <PageHeader 
        title="Settings" 
        subtitle="Manage your garage profile and staff members"
      />

      {/* Garage Info Card */}
      <Card title="Garage Information" icon={HiOutlineOfficeBuilding}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Garage Name</span>
            <span className="font-bold text-gray-900 text-lg">{user?.garage?.name || '—'}</span>
          </div>
          <div>
            <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">GST Number</span>
            <span className="font-medium text-gray-900">{user?.garage?.gstNumber || 'Not set'}</span>
          </div>
          <div>
            <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Default Tax Rate</span>
            <span className="font-medium text-gray-900">{user?.garage?.settings?.taxRate || 18}%</span>
          </div>
          <div>
            <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Labor Rate/Hour</span>
            <span className="font-medium text-gray-900">₹{user?.garage?.settings?.laborRatePerHour || 500}</span>
          </div>
        </div>
      </Card>

      {/* Staff Management */}
      <Card 
        title="Staff Management" 
        icon={HiOutlineUserGroup}
        action={
          <Button variant="primary" size="sm" onClick={openAddUser} icon={HiOutlinePlus}>
            Add Staff
          </Button>
        }
        noPadding
      >
        {loading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Phone</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {users.map(u => (
                <Tr key={u._id}>
                  <Td className="font-semibold text-gray-900">{u.name}</Td>
                  <Td>{u.email}</Td>
                  <Td>{u.phone}</Td>
                  <Td>
                    <span 
                      className="px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{
                        background: `${roleColors[u.role]}15`,
                        color: roleColors[u.role]
                      }}
                    >
                      {u.role?.replace(/_/g, ' ')}
                    </span>
                  </Td>
                  <Td>
                    <Badge intent={u.isActive ? 'approved' : 'cancelled'}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </Td>
                  <Td>
                    {u.role !== 'owner' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={u.isActive ? 'text-danger hover:text-danger hover:bg-danger-light' : 'text-primary-600 hover:bg-primary-50'}
                        onClick={() => toggleUserActive(u._id, u.isActive)}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      {/* Add User Modal */}
      {showUserModal && (
        <ModalOverlay onClose={() => setShowUserModal(false)}>
          <Modal className="max-w-xl">
            <ModalHeader title="Add Staff Member" onClose={() => setShowUserModal(false)} />
            <form onSubmit={handleSubmitUser}>
              <ModalBody>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
                    <Input 
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="Staff member name" 
                      required 
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email *</label>
                      <Input 
                        type="email" 
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        placeholder="email@example.com" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone *</label>
                      <Input 
                        type="tel" 
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        placeholder="9876543210" 
                        required 
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password *</label>
                      <Input 
                        type="password" 
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                        placeholder="Min 6 characters" 
                        required 
                        minLength={6} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Role *</label>
                      <Select 
                        value={form.role}
                        onChange={e => setForm({ ...form, role: e.target.value })}
                      >
                        <option value="mechanic">Mechanic</option>
                        <option value="service_advisor">Service Advisor</option>
                        <option value="receptionist">Receptionist</option>
                        {hasRole('owner') && <option value="admin">Admin</option>}
                      </Select>
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <div className="flex justify-end gap-3 w-full">
                  <Button type="button" variant="ghost" onClick={() => setShowUserModal(false)}>Cancel</Button>
                  <Button type="submit" variant="primary">Add Staff Member</Button>
                </div>
              </ModalFooter>
            </form>
          </Modal>
        </ModalOverlay>
      )}
    </div>
  );
}
