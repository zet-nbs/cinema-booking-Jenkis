export const locationConfig = {
  title: 'Locations', singular: 'Lokasi', endpoint: '/locations',
  fields: [{ name: 'city', label: 'Kota', required: true }],
  columns: [{ name: 'city', label: 'Kota' }, { name: 'createdAt', label: 'Dibuat', render: (item) => new Date(item.createdAt).toLocaleDateString() }],
};

export const bioskopConfig = {
  title: 'Cinemas', singular: 'Bioskop', endpoint: '/bioskop',
  relations: [{ key: 'locations', endpoint: '/locations' }],
  fields: [{ name: 'name', label: 'Nama', required: true }, { name: 'address', label: 'Alamat', type: 'textarea', required: true }, { name: 'locationId', label: 'Lokasi', type: 'select', options: 'locations', optionLabel: (item) => item.city, required: true }],
  columns: [{ name: 'name', label: 'Nama' }, { name: 'locationId.city', label: 'Kota' }, { name: 'address', label: 'Alamat' }],
};

export const seatConfig = {
  title: 'Seats', singular: 'Kursi', endpoint: '/seats',
  relations: [{ key: 'studios', endpoint: '/studios' }],
  fields: [{ name: 'studioId', label: 'Studio', type: 'select', options: 'studios', optionLabel: (item) => item.name, required: true }, { name: 'code', label: 'Kode Kursi', required: true }],
  columns: [{ name: 'code', label: 'Kode' }, { name: 'studioId.name', label: 'Studio' }],
};

export const userConfig = {
  title: 'Users', singular: 'Pengguna', endpoint: '/admin/users',
  fields: [{ name: 'name', label: 'Nama', required: true }, { name: 'email', label: 'Email', type: 'email', required: true }, { name: 'password', label: 'Password', type: 'password' }, { name: 'role', label: 'Peran', type: 'select', options: 'roles', required: true }],
  relations: [{ key: 'roles', endpoint: '/admin/roles' }],
  columns: [{ name: 'name', label: 'Nama' }, { name: 'email', label: 'Email' }, { name: 'role', label: 'Peran' }],
};

export const transactionConfig = {
  title: 'Transactions', singular: 'Transaksi', endpoint: '/admin/transactions',
  relations: [{ key: 'bookings', endpoint: '/bookings' }, { key: 'methods', endpoint: '/admin/payment-methods' }, { key: 'statuses', endpoint: '/admin/transaction-statuses' }],
  fields: [{ name: 'bookingId', label: 'Booking', type: 'select', options: 'bookings', optionLabel: (item) => `#${item._id.slice(-6)} — IDR ${(item.totalPrice || 0).toLocaleString()}`, required: true }, { name: 'paymentMethod', label: 'Metode', type: 'select', options: 'methods', required: true }, { name: 'status', label: 'Status', type: 'select', options: 'statuses', required: true }],
  columns: [{ name: 'bookingId._id', label: 'Booking', render: (item) => `#${(item.bookingId?._id || item.bookingId || '').slice(-6)}` }, { name: 'userId.name', label: 'User' }, { name: 'amount', label: 'Jumlah', render: (item) => `IDR ${(item.amount ?? 0).toLocaleString()}` }, { name: 'paymentMethod', label: 'Metode' }, { name: 'status', label: 'Status' }],
};
