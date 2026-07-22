import api from './api';

const normalizeMovie = (movie) => {
  const rating = Number(movie.rating);
  return {
    ...movie,
    rating: Number.isFinite(rating) ? rating : null,
    poster_url: movie.poster_url || movie.poster || '',
    backdrop_url: movie.backdrop_url || movie.backgroundImage || movie.backdrop || movie.poster || '',
    release_date: movie.release_date || movie.releaseDate || movie.createdAt,
    // Backend menggunakan `release`; UI menggunakan status.
    status: movie.status || (movie.release ? 'now_showing' : 'coming_soon'),

    director: movie.director || [],
    cast: movie.cast || [],
  };
};

export const movieService = {
  async getMovies(filters = {}) {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.genre) params.genre = filters.genre;
    if (filters.page) params.page = filters.page;
    if (filters.limit) params.limit = filters.limit;

    const { data } = await api.get('/movies', { params });
    let movies = (data.data || []).map(normalizeMovie);

    // Filter status di sisi client (backend tidak punya filter status)
    if (filters.status && filters.status !== 'all') {
      movies = movies.filter((movie) => movie.status === filters.status);
    }

    // Sort di sisi client
    if (filters.sort === 'release_date') {
      movies = [...movies].sort(
        (a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
      );
    } else if (filters.sort === 'rating') {
      movies = [...movies].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
      movies = [...movies].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    return movies;
  },

  async getMovieById(id) {
    const { data } = await api.get(`/movies/${id}`);
    if (!data.success) throw new Error('Movie tidak ditemukan');
    return normalizeMovie(data.data);
  },

  async createMovie(movieData) {
    const { data } = await api.post('/movies', movieData);
    if (!data.success) throw new Error(data.message || 'Gagal membuat movie');
    return normalizeMovie(data.data);
  },

  async updateMovie(id, movieData) {
    const { data } = await api.put(`/movies/${id}`, movieData);
    if (!data.success) throw new Error(data.message || 'Gagal mengupdate movie');
    return normalizeMovie(data.data);
  },

  async deleteMovie(id) {
    const { data } = await api.delete(`/movies/${id}`);
    if (!data.success) throw new Error(data.message || 'Gagal menghapus movie');
  },
};
