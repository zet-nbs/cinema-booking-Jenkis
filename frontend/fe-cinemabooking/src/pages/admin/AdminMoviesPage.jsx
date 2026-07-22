import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Edit, Trash2 } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import { movieService } from "@/services/movieService";

// ============== MovieForm Component ==============
const MovieForm = ({ movieToEdit, onClose, onSave }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    if (movieToEdit) {
      reset({
        ...movieToEdit,
        genre: Array.isArray(movieToEdit.genre)
          ? movieToEdit.genre.join(", ")
          : movieToEdit.genre,
        cast: Array.isArray(movieToEdit.cast)
          ? movieToEdit.cast.join(", ")
          : movieToEdit.cast || "",
        release_date: movieToEdit.release_date
          ? new Date(movieToEdit.release_date).toISOString().split("T")[0]
          : "",
      });
    } else {
      reset({
        title: "",
        description: "",
        director: "",
        cast: "",
        genre: "",
        duration: "",
        release_date: "",
        poster: "", // 👈 Disamakan dengan schema
        trailer: "", // 👈 Disamakan dengan schema
        backgroundImage: "",
        rating: "",
        status: "now_showing",
      });
    }
  }, [movieToEdit, reset]);

  const onSubmit = async (formData) => {
    try {
      const dataToSubmit = {
        ...formData,
        duration: Number(formData.duration),
        rating: formData.rating ? Number(formData.rating) : undefined,
        cast: formData.cast
          ? formData.cast
              .split(",")
              .map((cast) => cast.trim())
              .filter(Boolean)
          : [],
        genre: formData.genre
          .split(",")
          .map((genre) => genre.trim())
          .filter(Boolean),
        release_date: formData.release_date
          ? new Date(formData.release_date)
          : undefined,
        release: formData.status === "now_showing",
        // Properti poster & trailer tidak perlu di-mapping manual lagi karena namanya sudah pas
      };

      if (movieToEdit) {
        await movieService.updateMovie(movieToEdit._id, dataToSubmit);
      } else {
        await movieService.createMovie({
          ...dataToSubmit,
          status: dataToSubmit.status || "now_showing",
          is_now_showing: dataToSubmit.status !== "coming_soon",
        });
      }
      toast.success(`Movie ${movieToEdit ? "updated" : "added"} successfully!`);
      onSave();
    } catch (error) {
      toast.error(error.message);
      console.error("Error saving movie:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-dark-900/80 p-4 sm:items-center">
      <div className="card relative my-auto w-full max-w-2xl p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-6">
          {movieToEdit ? "Edit Movie" : "Add New Movie"}
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              {...register("title", { required: "Title is required" })}
              className="input"
            />
            {errors.title && (
              <p className="text-red-400 text-sm mt-1">
                {errors.title.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              {...register("description")}
              className="input"
              rows={4}
            ></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Director</label>
            <input
              {...register("director")}
              className="input"
              placeholder="e.g. Christopher Nolan"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Cast</label>
            <input
              {...register("cast")}
              className="input"
              placeholder="Separate names with comma, e.g. Actor One, Actor Two"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Genre</label>
              <input
                {...register("genre", { required: "Genre is required" })}
                className="input"
              />
              {errors.genre && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.genre.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="300"
                {...register("duration", {
                  required: "Duration is required",
                  min: {
                    value: 1,
                    message: "Duration must be at least 1 minute",
                  },
                  max: {
                    value: 300,
                    message: "Duration cannot be more than 300 minutes",
                  },
                })}
                className="input"
              />
              {errors.duration && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.duration.message}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Release Date
              </label>
              <input
                type="date"
                {...register("release_date", {
                  required: "Release date is required",
                })}
                className="input"
              />
              {errors.release_date && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.release_date.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Poster URL
              </label>
              {/* 👈 Diubah dari poster_url menjadi poster */}
              <input {...register("poster")} className="input" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Trailer URL (Embed)
            </label>
            {/* 👈 Diubah dari trailer_url menjadi trailer */}
            <input {...register("trailer")} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Background Image URL
            </label>
            <input
              {...register("backgroundImage")}
              className="input"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Rating</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              {...register("rating")}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select {...register("status")} className="input">
              <option value="now_showing">Now Showing</option>
              <option value="coming_soon">Coming Soon</option>
            </select>
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
            >
              {isSubmitting ? <LoadingSpinner size="sm" /> : "Save Movie"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DeleteConfirmationModal = ({ movie, onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-dark-900/80 z-50 flex items-center justify-center">
      <div className="card p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
        <p className="text-slate-300 mb-6">
          Are you sure you want to delete the movie "
          <strong>{movie.title}</strong>"? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-4">
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(movie._id)}
            className="btn btn-danger"
          >
            Delete Movie
          </button>
        </div>
      </div>
    </div>
  );
};

// ============== AdminMoviesPage Component ==============
export default function AdminMoviesPage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [movieToDelete, setMovieToDelete] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [genreFilter, setGenreFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const data = await movieService.getMovies();
      setMovies(data || []);
    } catch (error) {
      console.error("Error fetching movies:", error);
      toast.error("Failed to load movies");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (movie) => {
    setEditingMovie(movie);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (searchParams.get("openModal") === "true") {
      handleOpenModal(null);
      searchParams.delete("openModal");
      setSearchParams(searchParams);
    }
  }, []);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMovie(null);
  };

  const handleSave = () => {
    fetchMovies();
    handleCloseModal();
  };

  const handleDeleteClick = (movie) => {
    setMovieToDelete(movie);
  };

  const handleConfirmDelete = async (movieId) => {
    try {
      await movieService.deleteMovie(movieId);
      toast.success("Movie deleted successfully");
      fetchMovies();
    } catch (error) {
      console.error("Error deleting movie:", error);
      toast.error(error.message);
    } finally {
      setMovieToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const genres = [...new Set(movies.flatMap((movie) => movie.genre || []))];

  const filteredMovies = movies.filter((movie) => {
    const matchesSearch =
      !searchTerm ||
      movie.title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGenre =
      !genreFilter ||
      (Array.isArray(movie.genre) && movie.genre.includes(genreFilter));

    const matchesStatus =
      statusFilter === "all" || movie.status === statusFilter;
    return matchesSearch && matchesGenre && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {isModalOpen && (
        <MovieForm
          movieToEdit={editingMovie}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      )}
      {movieToDelete && (
        <DeleteConfirmationModal
          movie={movieToDelete}
          onClose={() => setMovieToDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Movies</h1>
          <p className="text-slate-400">Manage your movie catalog</p>
        </div>
        <button
          onClick={() => handleOpenModal(null)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add Movie</span>
        </button>
      </div>

      <div className="cinema-panel grid grid-cols-1 gap-4 p-4 md:grid-cols-3">
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="input"
          placeholder="Search movies..."
        />
        <select
          value={genreFilter}
          onChange={(event) => setGenreFilter(event.target.value)}
          className="input"
        >
          <option value="">All Genres</option>
          {genres.map((genre) => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="input"
        >
          <option value="all">All Status</option>
          <option value="now_showing">Now Showing</option>
          <option value="coming_soon">Coming Soon</option>
        </select>
      </div>

      {filteredMovies.length === 0 ? (
        <div className="text-center py-12 card">
          <p className="text-slate-400 text-lg mb-4">No movies found</p>
          <button
            onClick={() => handleOpenModal(null)}
            className="btn btn-primary"
          >
            Add Your First Movie
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Movie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Genre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Release Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {filteredMovies.map((movie) => (
                  <tr key={movie._id} className="hover:bg-dark-800/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={
                            movie.poster || // 👈 Diubah dari movie.poster_url agar poster muncul di tabel
                            "https://placehold.co/100x150/0f172a/94a3b8?text=No+Image"
                          }
                          alt={movie.title}
                          className="w-12 h-18 object-cover rounded"
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white max-w-xs truncate">
                            {movie.title}
                          </div>
                          <div className="text-sm text-slate-400 line-clamp-2 max-w-xs">
                            {movie.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(movie.genre) ? (
                          movie.genre.map((g, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 text-xs font-medium bg-primary-500/20 text-primary-400 rounded-full"
                            >
                              {g}
                            </span>
                          ))
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium bg-primary-500/20 text-primary-400 rounded-full">
                            {movie.genre}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {movie.duration} mins
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {new Date(movie.release_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleOpenModal(movie)}
                          className="text-green-400 hover:text-green-300 p-2 rounded-full hover:bg-dark-700"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(movie)}
                          className="text-red-400 hover:text-red-300 p-2 rounded-full hover:bg-dark-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
