import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Plus, Edit, Trash2, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import toast from "react-hot-toast";
import { movieService } from "@/services/movieService";
import { showtimeService } from "@/services/showtimeService";
import { bookingService } from "@/services/bookingService";
import { bioskopService } from "@/services/bioskopService";

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || value.$oid || "";
};

const getShowtimeMovieId = (showtime) =>
  getId(showtime?.movie) || getId(showtime?.movieId);

const getShowtimeBioskopId = (showtime) =>
  getId(showtime?.bioskopId) || getId(showtime?.bioskop);

const getShowtimeStudioId = (showtime) =>
  getId(showtime?.hall) || getId(showtime?.studioId);

const getShowtimeDate = (showtime) =>
  showtime?.show_date || showtime?.date || "";

const toDateInputValue = (value) => {
  if (!value) return "";
  return new Date(value).toISOString().split("T")[0];
};

const ShowtimeForm = ({ showtimeToEdit, showtimes = [], onClose, onSave }) => {
  const [movies, setMovies] = useState([]);
  const [halls, setHalls] = useState([]);
  const [bioskop, setBioskop] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    watch, // 👈 1. Tambahkan watch untuk memantau input
    setValue, // 👈 2. Tambahkan setValue untuk mereset input programmatikal
    formState: { errors, isSubmitting },
  } = useForm();

  // 👈 3. Ambil nilai bioskop_id yang sedang dipilih saat ini
  const selectedBioskopId = watch("bioskop_id");

  useEffect(() => {
    const fetchPrerequisites = async () => {
      try {
        const [moviesData, hallsData, bioskopData] = await Promise.all([
          movieService.getMovies(),
          showtimeService.getHalls(),
          bioskopService.getBioskops(), // Sudah diperbaiki dari getBioskop
        ]);
        setMovies(moviesData);
        setHalls(hallsData);
        setBioskop(bioskopData);
      } catch {
        toast.error("Could not load movies or Studios.");
      }
    };
    fetchPrerequisites();
  }, []);

  useEffect(() => {
    if (showtimeToEdit) {
      reset({
        movie_id: getShowtimeMovieId(showtimeToEdit),
        hall_id: getShowtimeStudioId(showtimeToEdit),
        bioskop_id: getShowtimeBioskopId(showtimeToEdit),
        show_date: toDateInputValue(getShowtimeDate(showtimeToEdit)),
        start_time: showtimeToEdit.start_time || showtimeToEdit.startTime || "",
        end_time: showtimeToEdit.end_time || showtimeToEdit.endTime || "",
        ticket_price: showtimeToEdit.ticket_price || showtimeToEdit.price || "",
      });
    } else {
      reset();
    }
  }, [showtimeToEdit, reset, movies, halls, bioskop]);

  // 👈 4. Otomatis RESET pilihan Studio jika user mengubah Cinema/Bioskop di tengah jalan
  useEffect(() => {
    if (selectedBioskopId) {
      const currentHallId = watch("hall_id");
      const currentHall = halls.find((h) => h._id === currentHallId);

      if (currentHall) {
        const hallCinemaId =
          typeof currentHall.cinema === "object" && currentHall.cinema !== null
            ? currentHall.cinema._id || currentHall.cinema.$oid
            : currentHall.cinema;

        if (String(hallCinemaId) !== String(selectedBioskopId)) {
          setValue("hall_id", ""); // Reset dropdown studio menjadi "Select a Studio"
        }
      }
    }
  }, [selectedBioskopId, halls, setValue, watch]);

  // 👈 5. Filter daftar studio berdasarkan Bioskop yang dipilih
  const filteredHalls = halls.filter((hall) => {
    // Mengantisipasi jika field `cinema` berbentuk Objek BSON ($oid) atau String ID biasa
    const hallCinemaId =
      typeof hall.cinema === "object" && hall.cinema !== null
        ? hall.cinema._id || hall.cinema.$oid
        : hall.cinema;

    return String(hallCinemaId) === String(selectedBioskopId);
  });

  const onSubmit = async (formData) => {
    if (Number(formData.ticket_price) < 0) {
      toast.error("Harga tiket tidak boleh bernilai negatif (minus)!");
      return; // Hentikan proses
    }

    // ─── VALIDASI 1: HARGA TIKET TIDAK BOLEH MINUS ───
    if (Number(formData.ticket_price) < 0) {
      toast.error("Harga tiket tidak boleh bernilai negatif (minus)!");
      return; // Hentikan proses
    }

    // ─── VALIDASI 2: CEK JADWAL BENTROK DI STUDIO & TANGGAL YANG SAMA ───
    const hasCollision = showtimes.some((st) => {
      // Jika sedang dalam mode EDIT, lewati pengecekan terhadap data dirinya sendiri di database
      if (showtimeToEdit && st._id === showtimeToEdit._id) return false;

      // Cek apakah Studio (hall) sama
      const sameStudio = getShowtimeStudioId(st) === formData.hall_id;

      // Cek apakah Tanggal tayang sama
      const sameDate = toDateInputValue(getShowtimeDate(st)) === formData.show_date;

      if (sameStudio && sameDate) {
        const startA = formData.start_time; // Waktu mulai input baru (cth: "14:00")
        const endA = formData.end_time; // Waktu selesai input baru (cth: "16:00")
        const startB = st.start_time || st.startTime; // Waktu mulai jadwal eksis (cth: "15:00")
        const endB = st.end_time || st.endTime; // Waktu selesai jadwal eksis (cth: "17:00")

        // Rumus Overlap: Jadwal bentrok jika waktu mulai A sebelum waktu selesai B
        // DAN waktu selesai A setelah waktu mulai B
        return startA < endB && endA > startB;
      }
      return false;
    });

    if (hasCollision) {
      toast.error(
        "Gagal! Studio ini sudah terisi jadwal film lain pada jam tersebut.",
      );
      return; // Hentikan proses
    }

    // 1. AMBIL TANGGAL HARI INI (Reset jam ke 00:00:00)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 2. AMBIL TANGGAL YANG DIINPUT (Reset jam ke 00:00:00)
    const selectedDate = new Date(formData.show_date);
    selectedDate.setHours(0, 0, 0, 0);

    // 3. JIKA TANGGAL YANG DIPILIH KURANG DARI ATAU SAMA DIGN HARI INI
    if (selectedDate <= today) {
      toast.error("Tanggal tayang harus minimal besok!");

      return;
    }
    try {
      const dataToSubmit = {
        movie: formData.movie_id,
        hallId: formData.hall_id,
        hallName:
          halls.find((hall) => hall._id === formData.hall_id)?.name ||
          halls.find((hall) => hall._id === formData.hall_id)?.hall_name,
        bioskopId: formData.bioskop_id,
        show_date: formData.show_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        ticket_price: Number(formData.ticket_price),
      };
      if (showtimeToEdit) {
        await showtimeService.updateShowtime(showtimeToEdit._id, dataToSubmit);
      } else {
        await showtimeService.createShowtime(dataToSubmit);
      }
      toast.success(
        `Showtime ${showtimeToEdit ? "updated" : "added"} successfully!`,
      );
      onSave();
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Formula mendapatkan string tanggal besok (Format: YYYY-MM-DD)
  const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  return (
    <div className="fixed inset-0 bg-dark-900/80 z-50 flex items-center justify-center p-4">
    
      <div className="card w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-6">
          {showtimeToEdit ? "Edit Showtime" : "Add New Showtime"}
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Movie</label>
              <select
                {...register("movie_id", { required: "Movie is required" })}
                className="input"
              >
                <option value="">Select a movie</option>
                {movies
                  .filter(
                    (movie) =>
                      movie.release === true ||
                      (showtimeToEdit &&
                        movie._id === getShowtimeMovieId(showtimeToEdit)),
                  )
                  .map((movie) => (
                    <option key={movie._id} value={movie._id}>
                      {movie.title}
                    </option>
                  ))}
              </select>
              {errors.movie_id && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.movie_id.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cinema</label>
              <select
                {...register("bioskop_id", { required: "Cinema is required" })}
                className="input"
              >
                <option value="">Select a cinema</option>
                {bioskop.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
              {errors.bioskop_id && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.bioskop_id.message}
                </p>
              )}
            </div>

            {/* 👈 6. Kondisi: Studio HANYA muncul jika Cinema sudah dipilih */}
            {selectedBioskopId && (
              <div>
                <label className="block text-sm font-medium mb-1">Studio</label>
                <select
                  {...register("hall_id", { required: "Hall is required" })}
                  className="input"
                >
                  <option value="">Select a Studio</option>
                  {filteredHalls.map((hall) => (
                    <option key={hall._id} value={hall._id}>
                      {hall.name || hall.hall_name}{" "}
                      {/* Mengantisipasi nama field 'name' / 'hall_name' */}
                    </option>
                  ))}
                </select>
                {errors.hall_id && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.hall_id.message}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Show Date
              </label>
              <input
                type="date"
                min={tomorrowStr} // 👈 Tambahkan baris ini untuk mengunci kalender dari hari ini ke belakang
                {...register("show_date", {
                  required: "Show date is required",
                })}
                className="input"
              />
              {errors.show_date && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.show_date.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Ticket Price (IDR)
              </label>
              <input
                type="number"
                min="0"
                {...register("ticket_price", {
                  required: "Price is required",
                  min: { value: 0, message: "Price cannot be negative" },
                })}
                {...register("ticket_price", { required: "Price is required" })}
                className="input"
              />
              {errors.ticket_price && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.ticket_price.message}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Start Time
              </label>
              <input
                type="time"
                {...register("start_time", {
                  required: "Start time is required",
                })}
                className="input"
              />
              {errors.start_time && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.start_time.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Time</label>
              <input
                type="time"
                {...register("end_time", { required: "End time is required" })}
                className="input"
              />
              {errors.end_time && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.end_time.message}
                </p>
              )}
            </div>
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
              {isSubmitting ? <LoadingSpinner size="sm" /> : "Save Showtime"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
const DeleteConfirmationModal = ({ showtime, onClose, onConfirm }) => (
  <div className="fixed inset-0 bg-dark-900/80 z-50 flex items-center justify-center p-4">
    <div className="card p-6 w-full max-w-md">
      <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
      <p className="text-slate-300 mb-6">
        Are you sure you want to delete the showtime for "
        <strong>{showtime.movie?.title}</strong>" on{" "}
        {new Date(showtime.show_date).toLocaleDateString()} at{" "}
        {showtime.start_time}?
      </p>
      <div className="flex justify-end space-x-4">
        <button onClick={onClose} className="btn btn-secondary">
          Cancel
        </button>
        <button
          onClick={() => onConfirm(showtime._id)}
          className="btn btn-danger"
        >
          Delete Showtime
        </button>
      </div>
    </div>
  </div>
);
export default function AdminShowtimesPage() {
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShowtime, setEditingShowtime] = useState(null);
  const [showtimeToDelete, setShowtimeToDelete] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [movieFilter, setMovieFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [seatCounts, setSeatCounts] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [movieFilter, dateFilter]);

  useEffect(() => {
    fetchShowtimes();
  }, []);
  const fetchShowtimes = async () => {
    setLoading(true);
    try {
      const data = await showtimeService.getShowtimes({ limit: 1000 });
      console.log("Showtimes API:", data);
      setShowtimes(data || []);
      const counts = await Promise.all(
        data.map(async (showtime) => [
          showtime._id,
          (await bookingService.getSeatAvailability(showtime._id)).length,
        ]),
      );
      setSeatCounts(Object.fromEntries(counts));
    } catch {
      toast.error("Failed to load showtimes");
    } finally {
      setLoading(false);
    }
  };
  const handleOpenModal = (showtime) => {
    setEditingShowtime(showtime);
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
    setEditingShowtime(null);
  };
  const handleSave = () => {
    fetchShowtimes();
    handleCloseModal();
  };
  const handleConfirmDelete = async (showtimeId) => {
    try {
      await showtimeService.deleteShowtime(showtimeId);
      toast.success("Showtime deleted successfully");
      fetchShowtimes();
    } catch (error) {
      toast.error(error.message || "Failed to delete showtime");
    } finally {
      setShowtimeToDelete(null);
    }
  };
  const filteredShowtimes = showtimes.filter((showtime) => {
    const matchesMovie = !movieFilter || showtime.movie?._id === movieFilter;
    const matchesDate =
      !dateFilter || showtime.show_date.startsWith(dateFilter);
    return matchesMovie && matchesDate;
  });

  const totalItems = filteredShowtimes.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredShowtimes.slice(indexOfFirstItem, indexOfLastItem);

  // Hitung range halaman dengan ellipsis (contoh: 1 2 3 ... 8 9 10)
  const getPaginationRange = () => {
    const totalNumbers = 7; // Jumlah tombol halaman maksimum di luar panah
    if (totalPages <= totalNumbers) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - 1, 1);
    const rightSiblingIndex = Math.min(currentPage + 1, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      let leftItemCount = 4;
      let leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
      return [...leftRange, "...", lastPageIndex];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      let rightItemCount = 4;
      let rightRange = Array.from({ length: rightItemCount }, (_, i) => totalPages - rightItemCount + i + 1);
      return [firstPageIndex, "...", ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      let middleRange = [currentPage - 1, currentPage, currentPage + 1];
      return [firstPageIndex, "...", ...middleRange, "...", lastPageIndex];
    }
    return [];
  };

  const pageNumbers = getPaginationRange();
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {isModalOpen && (
        <ShowtimeForm
          showtimeToEdit={editingShowtime}
          showtimes={showtimes}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      )}
      {showtimeToDelete && (
        <DeleteConfirmationModal
          showtime={showtimeToDelete}
          onClose={() => setShowtimeToDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Showtimes</h1>
          <p className="text-slate-400">Manage movie showtimes</p>
        </div>
        <button
          onClick={() => handleOpenModal(null)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add Showtime</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <select
          value={movieFilter}
          onChange={(event) => setMovieFilter(event.target.value)}
          className="input"
        >
          <option value="">All Movies</option>
          {[
            ...new Map(
              showtimes.map((showtime) => [
                showtime.movie?._id,
                showtime.movie,
              ]),
            ).values(),
          ].map((movie) => (
            <option key={movie?._id} value={movie?._id}>
              {movie?.title}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={(event) => setDateFilter(event.target.value)}
          className="input"
        />
      </div>

      {filteredShowtimes.length === 0 ? (
        <div className="text-center py-12 card">
          <Calendar className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg mb-4">No showtimes found</p>
          <button
            onClick={() => handleOpenModal(null)}
            className="btn btn-primary"
          >
            Add Your First Showtime
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
                    Hall
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Seats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {currentItems.map((showtime) => (
                  <tr key={showtime._id} className="hover:bg-dark-800/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white max-w-xs truncate">
                        {showtime.movie?.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full">
                        {showtime.hall?.hall_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      <div>
                        {new Date(showtime.show_date).toLocaleDateString()}
                      </div>
                      <div className="text-slate-400">
                        {showtime.start_time} - {showtime.end_time}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-400">
                      IDR {showtime.ticket_price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {seatCounts[showtime._id] || 0} booked /{" "}
                      {Math.max(
                        0,
                        (showtime.hall.total_seats || 0) -
                          (seatCounts[showtime._id] || 0),
                      )}{" "}
                      available
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleOpenModal(showtime)}
                          className="text-green-400 hover:text-green-300 p-2 rounded-full hover:bg-dark-700"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setShowtimeToDelete(showtime)}
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-dark-700 px-6 py-4 bg-dark-800/20">
              <div className="text-sm text-slate-400">
                Showing <span className="font-semibold text-white">{indexOfFirstItem + 1}</span> to{" "}
                <span className="font-semibold text-white">
                  {Math.min(indexOfLastItem, totalItems)}
                </span>{" "}
                of <span className="font-semibold text-white">{totalItems}</span> showtimes
              </div>
              <div className="inline-flex rounded-lg border border-dark-700 overflow-hidden bg-dark-900 shadow-sm divide-x divide-dark-700">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-slate-400 hover:bg-dark-800 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {pageNumbers.map((page, index) => {
                  if (page === "...") {
                    return (
                      <span
                        key={`dots-${index}`}
                        className="px-4 py-2 text-slate-500 bg-dark-900 inline-flex items-center text-sm font-medium select-none"
                      >
                        ...
                      </span>
                    );
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 text-sm font-medium transition ${
                        currentPage === page
                          ? "bg-primary-600 text-white font-semibold"
                          : "bg-dark-900 text-slate-300 hover:bg-dark-800"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-slate-400 hover:bg-dark-800 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
  
}
