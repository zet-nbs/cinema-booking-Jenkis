import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Armchair,
  CalendarDays,
  Clock,
  MapPin,
  X,
  Film,
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import toast from "react-hot-toast";
import BookingProgress from "@/components/BookingProgress";
import { movieService } from "@/services/movieService";
import { showtimeService } from "@/services/showtimeService";
import { bookingService } from "@/services/bookingService";
import { authService } from "@/services/authService";
import { bioskopService } from "@/services/bioskopService";
import { locationService } from "@/services/locationService";

export default function BookingPage() {
  const { movieId } = useParams();
  const { showtimeId } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [occupiedSeats, setOccupiedSeats] = useState([]);
  const [loading, setLoading] = useState(true);

  // ─── STATE UNTUK FILTER ───
  const [locations, setLocations] = useState([]);
  const [bioskops, setBioskops] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);

  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedBioskop, setSelectedBioskop] = useState("");
  const [selectedDateFilter, setSelectedDateFilter] = useState("");

  useEffect(() => {
    if (!selectedShowtime && selectedSeats.length === 0) return undefined;

    const message =
      "Are you sure you want to leave? Your selected seats may be cancelled.";

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = message;
      return message;
    };

    const handleDocumentClick = (event) => {
      const anchor = event.target.closest?.("a[href]");
      if (!anchor) return;
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey) return;
      if (anchor.target && anchor.target !== "_self") return;

      const nextUrl = new URL(anchor.href, window.location.href);
      if (nextUrl.origin !== window.location.origin) return;
      if (nextUrl.pathname === window.location.pathname) return;
      if (nextUrl.pathname === "/payment") return;

      const confirmed = window.confirm(message);
      if (!confirmed) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const handlePopState = () => {
      const confirmed = window.confirm(message);
      if (!confirmed) {
        window.history.pushState(null, "", window.location.href);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [selectedShowtime, selectedSeats.length]);

  useEffect(() => {
    // 1. Generate Array Tanggal untuk 7 Hari ke Depan
    const generateDates = () => {
      const dates = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        dates.push(date.toISOString().split("T")[0]); // Format: YYYY-MM-DD
      }
      setAvailableDates(dates);
      setSelectedDateFilter(dates[0]); // Default terpilih adalah Hari Ini
    };
    generateDates();

    // 2. Fetch Data Location dan Bioskop untuk Dropdown
    const fetchFiltersData = async () => {
      try {
        const [locRes, bioRes] = await Promise.all([
          locationService.getLocations(),
          bioskopService.getBioskops(),
        ]);
        setLocations(locRes.data || locRes || []);
        setBioskops(bioRes.data || bioRes || []);
      } catch (error) {
        console.error("Gagal memuat data filter", error);
      }
    };
    fetchFiltersData();
  }, []);

  useEffect(() => {
    if (showtimeId) {
      fetchFromShowtime(showtimeId);
    } else if (movieId) {
      fetchMovieAndShowtimes(movieId);
    }
  }, [movieId, showtimeId]);

  useEffect(() => {
    if (selectedShowtime) {
      fetchOccupiedSeats(selectedShowtime._id);
    }
  }, [selectedShowtime]);

  // Setiap kali filter diubah, pastikan membatalkan pilihan tiket/studio saat ini
  useEffect(() => {
    setSelectedShowtime(null);
    setSelectedSeats([]);
  }, [selectedLocation, selectedBioskop, selectedDateFilter]);

  const fetchMovieAndShowtimes = async (id) => {
    try {
      const [movieData, showtimesData] = await Promise.all([
        movieService.getMovieById(id),
        showtimeService.getMovieShowtimes(id),
      ]);
      setMovie(movieData);
      setShowtimes(showtimesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load movie details");
    } finally {
      setLoading(false);
    }
  };

  const fetchFromShowtime = async (id) => {
    try {
      const showtime = await showtimeService.getShowtimeById(id);
      const showtimesData = await showtimeService.getMovieShowtimes(
        showtime.movie._id,
      );
      setMovie(showtime.movie);
      setShowtimes(showtimesData);
      setSelectedShowtime(showtime);

      // Set filter tanggal menyesuaikan showtime yang dipilih jika via URL
      if (showtime.show_date) {
        setSelectedDateFilter(
          new Date(showtime.show_date).toISOString().split("T")[0],
        );
      }
    } catch (error) {
      console.error("Error fetching showtime:", error);
      toast.error("Failed to load showtime details");
    } finally {
      setLoading(false);
    }
  };

  const fetchOccupiedSeats = async (showtimeId) => {
    try {
      const data = await bookingService.getSeatAvailability(showtimeId);
      setOccupiedSeats(data);
    } catch (error) {
      console.error("Error fetching occupied seats:", error);
      toast.error("Could not load seat information.");
    }
  };

  // 👇 1. UBAH FUNGSI generateSeats MENJADI SEPERTI INI
  const generateSeats = () => {
    if (!selectedShowtime) return [];

    // Ambil data layout dari showtime yang dipilih (default 10 jika undefined)
    const rowCount = selectedShowtime.hall?.layout_rows ?? 0;
    const seatsPerRow = selectedShowtime.hall?.layout_columns ?? 0;

    // Generate array baris (Contoh: rowCount 5 -> ['A', 'B', 'C', 'D', 'E'])
    const rows = Array.from({ length: rowCount }, (_, i) =>
      String.fromCharCode(65 + i),
    );

    const seats = [];
    for (const row of rows) {
      for (let i = 1; i <= seatsPerRow; i++) {
        const seatId = `${row}${i}`;
        const isOccupied = occupiedSeats.includes(seatId);

        // Menentukan Kategori Kursi (Dinamis: 2 baris terbelakang premiere, baris paling belakang couple)
        let category = "regular";
        if (row === rows[rows.length - 1]) category = "couple";
        else if (row === rows[rows.length - 2]) category = "premiere";

        seats.push({
          id: seatId,
          row,
          category,
          isOccupied,
        });
      }
    }
    return seats;
  };

  // 👇 2. BUAT VARIABEL BANTUAN UNTUK RENDER BARIS DI BAWAHNYA
  const getDynamicRows = () => {
    if (!selectedShowtime) return [];
    const rowCount = selectedShowtime.hall?.layout_rows ?? 0;
    return Array.from({ length: rowCount }, (_, i) =>
      String.fromCharCode(65 + i),
    );
  };

  const handleSeatClick = (seatId) => {
    if (occupiedSeats.includes(seatId)) return;
    setSelectedSeats((prev) =>
      prev.includes(seatId)
        ? prev.filter((s) => s !== seatId)
        : [...prev, seatId],
    );
  };

  // Ubah fungsi ini menjadi async
  const handleProceedToPayment = async () => {
    if (!selectedShowtime || selectedSeats.length === 0) {
      toast.error("Please select a showtime and at least one seat");
      return;
    }

    try {
      // 1. MUNCULKAN LOADING VALIDASI
      const toastId = toast.loading("Memvalidasi sesi login...");

      // 2. CEK VALIDITAS JWT KE BACKEND
      const user = await authService.getCurrentUser();

      if (!user) {
        toast.dismiss(toastId);
        toast.error(
          "Sesi login berakhir atau Anda belum login. Silakan login terlebih dahulu.",
        );
        // navigate('/login'); // Hapus komentar ini jika ingin melempar user ke halaman login
        return;
      }

      // 3. JIKA VALID, LANJUTKAN PROSES BOOKING
      toast.loading("Memproses booking...", { id: toastId });

      const bookingPayload = {
        userId: user.id || user._id, // Menggunakan ID asli dari backend
        movieId: movie?._id || movieId,
        showtimeId: selectedShowtime._id,
        seats: selectedSeats,
      };

      const newBooking = await bookingService.createBooking(bookingPayload);

      const selectionData = {
        ...bookingPayload,
        bookingId: newBooking._id || newBooking.id,
        totalAmount: selectedSeats.length * selectedShowtime.ticket_price,
      };

      sessionStorage.setItem("seatSelection", JSON.stringify(selectionData));
      toast.success("Booking berhasil diamankan!", { id: toastId });

      navigate("/payment");
    } catch (error) {
      toast.dismiss();
      toast.error(
        error.message || "Gagal membuat booking. Kursi mungkin sudah dipesan.",
      );
      console.error("Booking Error:", error);
    }
  };

  // ─── LOGIKA FILTER BIOSKOP DAN SHOWTIME ───
  const getId = (value) => typeof value === 'object' && value !== null ? value._id : value;

  // Derive which bioskops actually have showtimes for this movie
  const availableBioskopIds = useMemo(() => new Set(showtimes.map((s) => getId(s.bioskopId))), [showtimes]);
  const availableBioskops = useMemo(() => bioskops.filter((b) => availableBioskopIds.has(b._id)), [bioskops, availableBioskopIds]);

  // Derive which locations have at least one available bioskop
  const availableLocationIds = useMemo(() => new Set(availableBioskops.map((b) => getId(b.locationId))), [availableBioskops]);
  const availableLocations = useMemo(() => locations.filter((l) => availableLocationIds.has(l._id)), [locations, availableLocationIds]);

  const filteredBioskops = useMemo(() => {
    return availableBioskops.filter((b) => {
      if (!selectedLocation) return true;
      const locId = getId(b.locationId);
      return locId === selectedLocation;
    });
  }, [availableBioskops, selectedLocation]);

  const filteredShowtimes = useMemo(() => {
    return showtimes.filter((st) => {
      // 1. Filter Berdasarkan Tanggal
      const stDate = new Date(st.show_date).toISOString().split("T")[0];
      if (selectedDateFilter && stDate !== selectedDateFilter) return false;

      // Dapatkan ID Bioskop dari showtime
      const stBioskopId =
        typeof st.bioskopId === "object" && st.bioskopId !== null
          ? st.bioskopId._id
          : st.bioskopId;

      // 2. Filter Berdasarkan Bioskop yang Dipilih
      if (selectedBioskop && stBioskopId !== selectedBioskop) return false;

      // 3. Filter Berdasarkan Lokasi (Jika Bioskop Belum Dipilih secara spesifik)
      if (selectedLocation) {
        const bioskopOfSt = bioskops.find((b) => b._id === stBioskopId);
        if (bioskopOfSt) {
          const locId =
            typeof bioskopOfSt.locationId === "object" &&
            bioskopOfSt.locationId !== null
              ? bioskopOfSt.locationId._id
              : bioskopOfSt.locationId;
          if (locId !== selectedLocation) return false;
        } else {
          // Fallback pengecekan nested object
          const nestedLocId =
            st.bioskopId?.locationId?._id || st.bioskopId?.locationId;
          if (nestedLocId !== selectedLocation) return false;
        }
      }

      return true;
    });
  }, [
    showtimes,
    selectedDateFilter,
    selectedLocation,
    selectedBioskop,
    bioskops,
  ]);

  // Dates that have showtimes for the current location/bioskop (ignoring date filter)
  const datesWithShowtimes = useMemo(() => {
    const dates = showtimes.filter((st) => {
      const stBioskopId = getId(st.bioskopId);
      if (selectedBioskop && stBioskopId !== selectedBioskop) return false;
      if (selectedLocation) {
        const bioskopOfSt = bioskops.find((b) => b._id === stBioskopId);
        if (bioskopOfSt) {
          if (getId(bioskopOfSt.locationId) !== selectedLocation) return false;
        } else {
          const nestedLocId = st.bioskopId?.locationId?._id || st.bioskopId?.locationId;
          if (nestedLocId !== selectedLocation) return false;
        }
      }
      return true;
    }).map((st) => new Date(st.show_date).toISOString().split("T")[0]);
    return new Set(dates);
  }, [showtimes, selectedLocation, selectedBioskop, bioskops]);

  if (loading || !movie) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-dark-950/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link
            to="/movies"
            className="btn btn-secondary flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Link>
          <BookingProgress currentStep="selection" />
          <div></div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col gap-6 rounded-lg border border-white/10 bg-dark-900/70 p-4 sm:flex-row sm:items-center">
          <img
            src={movie.poster_url || movie.poster}
            alt={movie.title}
            className="w-24 rounded-md shadow-lg sm:w-28"
          />
          <div>
            <p className="section-eyebrow mb-2">Reserve seats</p>
            <h1 className="text-3xl font-bold font-display">{movie.title}</h1>
            <p className="text-slate-400">
              {Array.isArray(movie.genre)
                ? movie.genre.join(", ")
                : movie.genre}{" "}
              • {movie.duration} minutes
            </p>
          </div>
        </div>

        {/* ─── AREA FILTER ─── */}
        <div className="cinema-panel mb-8 p-5">
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Select Location (City)
              </label>
              <select
                className="input w-full"
                value={selectedLocation}
                onChange={(e) => {
                  setSelectedLocation(e.target.value);
                  setSelectedBioskop(""); // Reset bioskop kalau kota ganti
                }}
              >
                <option value="">All Locations</option>
                {availableLocations.map((loc) => (
                  <option key={loc._id} value={loc._id}>
                    {loc.city || loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Select Cinema
              </label>
              <select
                className="input w-full"
                value={selectedBioskop}
                onChange={(e) => setSelectedBioskop(e.target.value)}
              >
                <option value="">All Cinemas</option>
                {filteredBioskops.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-400 mb-3">
              Select Date (Next 7 Days)
            </label>
            <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
              {availableDates.map((dateStr) => {
                const dateObj = new Date(dateStr);
                const isSelected = selectedDateFilter === dateStr;
                const hasShowtimes = datesWithShowtimes.has(dateStr);
                return (
                  <button
                    key={dateStr}
                    disabled={!hasShowtimes}
                    onClick={() => setSelectedDateFilter(dateStr)}
                    className={`flex min-w-[80px] flex-col items-center justify-center rounded-lg border p-3 transition ${
                      !hasShowtimes
                        ? "border-white/5 bg-dark-950 text-slate-600 opacity-40 cursor-not-allowed"
                        : isSelected
                          ? "border-primary-500 bg-primary-600 text-white shadow-lg shadow-primary-500/20"
                          : "border-white/10 bg-dark-950 text-slate-400 hover:border-primary-500/50 hover:text-white"
                    }`}
                  >
                    <span className="text-xs uppercase tracking-wider mb-1">
                      {dateObj.toLocaleDateString("en-US", {
                        weekday: "short",
                      })}
                    </span>
                    <span className="text-xl font-bold">
                      {dateObj.getDate()}
                    </span>
                    <span className="text-xs">
                      {dateObj.toLocaleDateString("en-US", { month: "short" })}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold border-t border-white/10 pt-6">
              Available Schedules
            </h3>
            {selectedLocation && selectedBioskop ? (
              filteredShowtimes.length > 0 ? (
                <div className="flex flex-wrap gap-4">
                  {filteredShowtimes.map((showtime) => {
                    // 1. Kalkulasi Jumlah Kursi & Ketersediaan
                    const totalSeats =
                      showtime.hall?.total_seats ||
                      showtime.hall?.layout_rows *
                        showtime.hall?.layout_columns ||
                      0;
                    const bookedCount = showtime.booked_seats?.length || 0;
                    const availableSeats = totalSeats - bookedCount;

                    // 2. Tentukan Status Penjualan
                    const isSoldOut = availableSeats <= 0;

                    return (
                      <button
                        key={showtime._id}
                        disabled={isSoldOut} // 👈 Nonaktifkan tombol jika Sold Out
                        className={`relative min-w-48 rounded-lg border p-4 text-left transition ${
                          isSoldOut
                            ? "border-red-500/30 bg-red-900/20 cursor-not-allowed opacity-60" // Tampilan kalau habis
                            : selectedShowtime?._id === showtime._id
                              ? "border-primary-500 bg-primary-600 text-white" // Tampilan kalau dipilih
                              : "border-white/10 bg-dark-950 text-slate-200 hover:border-primary-500/60"
                        }`}
                        onClick={() => {
                          if (!isSoldOut) {
                            if (
                              !showtime.hall?.layout_rows ||
                              !showtime.hall?.layout_columns
                            ) {
                              toast.error(
                                "Studio untuk jadwal ini tidak tersedia. Pilih jadwal lain.",
                              );
                              return;
                            }
                            setSelectedShowtime(showtime);
                            setSelectedSeats([]);
                          }
                        }}
                      >
                        {/* 👇 TANDA (BADGE) INDIKATOR KURSI */}
                        <div className="absolute top-3 right-3">
                          {bookedCount === 0 ? (
                            <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide">
                              Empty
                            </span>
                          ) : isSoldOut ? (
                            <span className="bg-red-500/20 text-red-400 text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide">
                              Sold Out
                            </span>
                          ) : availableSeats <= 10 ? (
                            <span className="bg-orange-500/20 text-orange-400 text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide">
                              Almost Full
                            </span>
                          ) : (
                            <span className="bg-blue-500/20 text-blue-400 text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide">
                              Filling
                            </span>
                          )}
                        </div>

                        <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide opacity-75">
                          <Clock className="h-4 w-4" />
                          {showtime.start_time}
                        </span>
                        <span className="block text-lg font-bold mb-1 truncate max-w-[130px]">
                          {showtime.hall?.hall_name ||
                            showtime.studio ||
                            "Studio"}
                        </span>
                        <span className="text-sm font-medium text-accent-400">
                          IDR {showtime.ticket_price.toLocaleString()}
                        </span>

                        {/* 👇 Teks Info Sisa Kursi */}
                        <div className="mt-3 pt-2 border-t border-white/10 text-xs text-slate-400 font-medium">
                          {isSoldOut
                            ? "0 seats left"
                            : `${availableSeats} seats left`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-white/5 bg-white/5 p-8 text-center text-slate-400">
                  <Film className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>No showtimes available for the selected filters.</p>
                  <p className="text-sm mt-1">
                    Try selecting a different date or cinema.
                  </p>
                </div>
              )
            ) : (
              <div className="rounded-lg border border-white/5 bg-white/5 p-8 text-center text-slate-400">
                <MapPin className="h-12 w-12 mx-auto mb-3 opacity-20 text-accent-400" />
                <p className="text-white font-semibold">Please Select Location and Cinema</p>
                <p className="text-sm text-slate-400 mt-1">
                  Choose a location and cinema above to view available showtimes.
                </p>
              </div>
            )}
          </div>
        </div>

        {selectedShowtime && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 cinema-panel p-4 sm:p-6">
              {/* Bagian Layar/Screen */}
              <div className="mx-auto mb-10 max-w-3xl">
                <div className="h-10 rounded-t-full border-t-4 border-accent-300 bg-gradient-to-b from-accent-400/30 to-transparent text-center text-xs font-bold uppercase tracking-[0.35em] text-accent-200">
                  Screen
                </div>
              </div>

              {/* 👇 3. UBAH BAGIAN MAPPING BARIS KURSI */}
              <div className="mx-auto mb-6 max-w-3xl space-y-2 overflow-x-auto pb-2">
                {getDynamicRows().map((row) => (
                  // Sesuaikan jumlah kolom grid dengan layout_columns dinamis
                  <div
                    key={row}
                    className="grid min-w-[430px] items-center gap-2"
                    style={{
                      gridTemplateColumns: `24px repeat(${selectedShowtime.hall?.layout_columns ?? 0}, 1fr) 24px`,
                    }}
                  >
                    <span className="text-center text-xs font-bold text-slate-500">
                      {row}
                    </span>

                    {generateSeats()
                      .filter((seat) => seat.row === row)
                      .map((seat) => (
                        <button
                          key={seat.id}
                          onClick={() => handleSeatClick(seat.id)}
                          disabled={seat.isOccupied}
                          className={`seat mx-auto ${
                            seat.isOccupied
                              ? "seat-occupied"
                              : selectedSeats.includes(seat.id)
                                ? "seat-selected"
                                : seat.category === "premiere" ||
                                    seat.category === "couple"
                                  ? "seat-premiere"
                                  : "seat-available"
                          }`}
                          aria-label={`Seat ${seat.id}`}
                        >
                          {seat.id.replace(row, "")}
                        </button>
                      ))}

                    <span className="text-center text-xs font-bold text-slate-500">
                      {row}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-300">
                <div className="flex items-center space-x-2">
                  <div className="seat seat-available h-4 w-4"></div>
                  <span>Regular</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="seat seat-premiere h-4 w-4"></div>
                  <span>Premiere</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="seat seat-selected h-4 w-4"></div>
                  <span>Selected</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="seat seat-occupied h-4 w-4"></div>
                  <span>Occupied</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="cinema-panel sticky top-24 p-6">
                <p className="section-eyebrow mb-2">Order</p>
                <h3 className="text-xl font-semibold mb-4">Booking Summary</h3>
                <div className="mb-5 rounded-md bg-dark-950 p-4 text-sm text-slate-300">
                  <div className="mb-2 flex justify-between">
                    <span>Studio</span>
                    <span className="font-semibold text-white">
                      {selectedShowtime.hall?.hall_name ||
                        selectedShowtime.studio ||
                        "Studio"}
                    </span>
                  </div>
                  <div className="mb-2 flex justify-between">
                    <span>Date</span>
                    <span className="font-semibold text-white">
                      {new Date(
                        selectedShowtime.show_date,
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time</span>
                    <span className="font-semibold text-white">
                      {selectedShowtime.start_time}
                    </span>
                  </div>
                </div>
                <ul className="mb-4 max-h-44 space-y-2 overflow-y-auto">
                  {selectedSeats.map((seat) => (
                    <li
                      key={seat}
                      className="flex items-center justify-between rounded-md bg-white/5 px-3 py-2"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Armchair className="h-4 w-4 text-accent-400" /> Seat{" "}
                        {seat}
                      </span>
                      <button
                        onClick={() => handleSeatClick(seat)}
                        className="text-slate-400 hover:text-white"
                        aria-label={`Remove seat ${seat}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                  {selectedSeats.length === 0 && (
                    <p className="text-slate-400">No seats selected.</p>
                  )}
                </ul>
                <div className="border-t border-dark-700 pt-4">
                  <div className="mb-2 flex justify-between text-sm text-slate-400">
                    <span>{selectedSeats.length} ticket(s)</span>
                    <span>
                      IDR {selectedShowtime.ticket_price.toLocaleString()} each
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-accent-300">
                      IDR{" "}
                      {(
                        selectedSeats.length * selectedShowtime.ticket_price
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleProceedToPayment}
                  disabled={selectedSeats.length === 0}
                  className="btn btn-primary w-full mt-6 py-3 text-lg"
                >
                  Continue to Payment
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
