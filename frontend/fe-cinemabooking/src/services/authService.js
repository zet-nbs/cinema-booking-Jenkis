import api, { saveToken, clearToken } from "./api";

const USER_KEY = "cinematix_user";

const toPublicUser = (user) => ({
  id: user._id || user.id,
  _id: user._id || user.id,
  email: user.email,
  username: user.email, // backend tidak punya username terpisah
  fullName: user.name, // backend pakai 'name', frontend pakai 'fullName'
  role: user.role,
  avatarUrl: user.avatarUrl || null,
});

export const authService = {
  async login(email, password) {
    const { data } = await api.post("/auth/login", { email, password });
    if (!data.success) throw new Error(data.message || "Login gagal");

    // 👇 UBAH BAGIAN INI (tambahkan .data)
    const actualToken = data.token || data.data?.token;
    const actualUser = data.user || data.data?.user;

    saveToken(actualToken);
    const publicUser = toPublicUser(actualUser);
    localStorage.setItem(USER_KEY, JSON.stringify(publicUser));
    return publicUser;
  },

  async adminLogin(usernameOrEmail, password) {
    const { data } = await api.post("/auth/login", {
      email: usernameOrEmail,
      password,
    });
    if (!data.success) throw new Error(data.message || "Login admin gagal");

    // 👇 UBAH BAGIAN INI JUGA
    const actualToken = data.token || data.data?.token;
    const actualUser = data.user || data.data?.user;

    if (actualUser.role !== "admin") {
      throw new Error("Akses ditolak: bukan akun admin");
    }

    saveToken(actualToken);
    const publicUser = toPublicUser(actualUser);
    localStorage.setItem(USER_KEY, JSON.stringify(publicUser));
    return publicUser;
  },

  async adminLogin(usernameOrEmail, password) {
    // Backend tidak punya endpoint login admin khusus,
    // gunakan endpoint login biasa lalu validasi role
    const { data } = await api.post("/auth/login", {
      email: usernameOrEmail,
      password,
    });
    if (!data.success) throw new Error(data.message || "Login admin gagal");
    if (data.user.role !== "admin") {
      throw new Error("Akses ditolak: bukan akun admin");
    }
    saveToken(data.token);
    const publicUser = toPublicUser(data.user);
    localStorage.setItem(USER_KEY, JSON.stringify(publicUser));
    return publicUser;
  },

  async register(email, password, fullName) {
    const { data } = await api.post("/auth/register", {
      name: fullName,
      email,
      password,
      confirmPassword: password,
    });
    if (!data.success) throw new Error(data.message || "Registrasi gagal");
    return toPublicUser(data.user);
  },

  async logout() {
    clearToken();
    localStorage.removeItem(USER_KEY);
  },

  async getCurrentUser() {
    try {
      // Kita hapus pengecekan manual localStorage.getItem('cinematix_token')
      // Biarkan instance `api` (Axios) langsung menembak ke backend.
      // Jika token tidak ada/tidak valid, API akan menolak dan otomatis masuk ke block catch.

      const { data } = await api.get("/auth/me");

      if (!data.success) {
        return null;
      }

      // Mengubah format response backend (data.data) ke format Frontend
      const publicUser = toPublicUser(data.user);

      // Update session user yang tersimpan agar selalu sinkron dengan database
      localStorage.setItem(USER_KEY, JSON.stringify(publicUser));

      return publicUser;
    } catch (error) {
      // TAMPILKAN ERROR DI CONSOLE UNTUK DEBUGGING
      console.error(
        "Gagal verifikasi sesi login:",
        error.response?.data || error.message,
      );

      clearToken();
      localStorage.removeItem(USER_KEY);
      return null;
    }
  },
};
