import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Edit, Trash2, Building, Filter } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import toast from "react-hot-toast";
import { showtimeService } from "@/services/showtimeService";
import { hallService } from "@/services/hallService";
import { bioskopService } from "@/services/bioskopService"; // 👈 Import service bioskop

// ============== HallForm Component ==============
const HallForm = ({ hallToEdit, onClose, onSave, cinemas }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    if (hallToEdit) {
      const cinemaValue =
        typeof hallToEdit.cinema === "object" && hallToEdit.cinema !== null
          ? hallToEdit.cinema._id
          : hallToEdit.cinema;

      reset({
        ...hallToEdit,
        cinema: cinemaValue || "",
      });
    } else {
      reset({
        hall_name: "",
        studioId: `STD-${Date.now().toString().slice(-6)}`,
        total_seats: 100,
        layout_rows: 10,
        layout_columns: 10,
        status: "active",
        cinema: "",
      });
    }
  }, [hallToEdit, reset]);

  const onSubmit = async (formData) => {
    try {
      const dataToSubmit = {
        ...formData,
        total_seats: Number(formData.total_seats),
        layout_rows: Number(formData.layout_rows),
        layout_columns: Number(formData.layout_columns),
      };

      if (hallToEdit) {
        await showtimeService.updateHall(hallToEdit._id, dataToSubmit);
      } else {
        await showtimeService.createHall(dataToSubmit);
      }
      toast.success(`Studio ${hallToEdit ? "updated" : "added"} successfully!`);
      onSave();
    } catch (error) {
      toast.error(error.message);
      console.error("Error saving hall:", error);
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
          {hallToEdit ? "Edit Studio" : "Add New Studio"}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Studio Name
              </label>
              <input
                {...register("hall_name", {
                  required: "Studio name is required",
                })}
                className="input"
                placeholder="e.g. Studio 1"
              />
              {errors.hall_name && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.hall_name.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Studio Code (ID)
              </label>
              <input
                {...register("studioId", { required: "Studio ID is required" })}
                className="input"
                placeholder="e.g. STD-001"
              />
              {errors.studioId && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.studioId.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Cinema (Bioskop)
              </label>
              <select
                {...register("cinema", { required: "Please select a cinema" })}
                className="input"
              >
                <option value="">-- Select Cinema --</option>
                {cinemas.map((cinema) => (
                  <option key={cinema._id} value={cinema._id}>
                    {cinema.name}
                  </option>
                ))}
              </select>
              {errors.cinema && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.cinema.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select {...register("status")} className="input">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Total Seats
              </label>
              <input
                type="number"
                {...register("total_seats", {
                  required: "Total seats is required",
                  valueAsNumber: true,
                })}
                className="input"
              />
              {errors.total_seats && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.total_seats.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Rows</label>
              <input
                type="number"
                {...register("layout_rows", {
                  required: "Number of rows is required",
                  valueAsNumber: true,
                })}
                className="input"
              />
              {errors.layout_rows && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.layout_rows.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Seats per Row
              </label>
              <input
                type="number"
                {...register("layout_columns", {
                  required: "Seats per row is required",
                  valueAsNumber: true,
                })}
                className="input"
              />
              {errors.layout_columns && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.layout_columns.message}
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
              {isSubmitting ? <LoadingSpinner size="sm" /> : "Save Studio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DeleteConfirmationModal = ({ hall, onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-dark-900/80 z-50 flex items-center justify-center">
      <div className="card p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
        <p className="text-slate-300 mb-6">
          Are you sure you want to delete "<strong>{hall.hall_name}</strong>"?
          This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-4">
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(hall._id)}
            className="btn btn-danger"
          >
            Delete Studio
          </button>
        </div>
      </div>
    </div>
  );
};

// ============== AdminHallsPage Component ==============
export default function AdminHallsPage() {
  const [halls, setHalls] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHall, setEditingHall] = useState(null);
  const [hallToDelete, setHallToDelete] = useState(null);

  // 👈 1. State Baru untuk menampung filter bioskop yang dipilih
  const [selectedCinemaFilter, setSelectedCinemaFilter] = useState("");

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([fetchHalls(), fetchCinemas()]);
      setLoading(false);
    };
    loadInitialData();
  }, []);

  const fetchHalls = async () => {
    try {
      const data = await showtimeService.getHalls();
      setHalls(data || []);
    } catch (error) {
      toast.error("Failed to load halls");
    }
  };

  const fetchCinemas = async () => {
    try {
      const res = await bioskopService.getBioskops();
      const cinemaData = res.data || res || [];
      setCinemas(Array.isArray(cinemaData) ? cinemaData : []);
    } catch (error) {
      toast.error("Failed to load cinemas");
    }
  };

  const handleOpenModal = (hall) => {
    setEditingHall(hall);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHall(null);
  };

  const handleSave = () => {
    fetchHalls();
    handleCloseModal();
  };

  const handleDeleteClick = (hall) => {
    setHallToDelete(hall);
  };

  const handleConfirmDelete = async (hallId) => {
    try {
      await showtimeService.deleteHall(hallId);
      toast.success("Studio deleted successfully");
      fetchHalls();
    } catch (error) {
      toast.error(error.message || "Failed to delete hall");
    } finally {
      setHallToDelete(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400";
      case "maintenance":
        return "bg-yellow-500/20 text-yellow-400";
      case "inactive":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-slate-500/20 text-slate-400";
    }
  };

  const getCinemaName = (cinemaData) => {
    if (!cinemaData) return "No Cinema Attached";
    if (typeof cinemaData === "object" && cinemaData.name) {
      return cinemaData.name;
    }
    const found = cinemas.find((c) => c._id === cinemaData);
    return found ? found.name : "Unknown Cinema";
  };

  // 👈 2. Logic Penyaringan: Filter array `halls` berdasarkan `selectedCinemaFilter`
  const filteredHalls = halls.filter((hall) => {
    if (!selectedCinemaFilter) return true; // Jika filter kosong/Pilih Semua, loloskan semua data

    // Antisipasi jika hall.cinema bertipe Object ID string atau Object hasil populate
    const cinemaId =
      typeof hall.cinema === "object" && hall.cinema !== null
        ? hall.cinema._id
        : hall.cinema;

    return cinemaId === selectedCinemaFilter;
  });

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
        <HallForm
          hallToEdit={editingHall}
          onClose={handleCloseModal}
          onSave={handleSave}
          cinemas={cinemas}
        />
      )}
      {hallToDelete && (
        <DeleteConfirmationModal
          hall={hallToDelete}
          onClose={() => setHallToDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      {/* 👈 3. Perubahan Layout Header untuk Menaruh Dropdown Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Studios</h1>
          <p className="text-slate-400">Manage your cinema studios</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* Komponen Dropdown Filter */}
          <select
            value={selectedCinemaFilter}
            onChange={(e) => setSelectedCinemaFilter(e.target.value)}
            className="input sm:w-64 bg-dark-800 text-white border border-dark-600"
          >
            <option value="">All Cinemas (Semua Bioskop)</option>
            {cinemas.map((cinema) => (
              <option key={cinema._id} value={cinema._id}>
                {cinema.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => handleOpenModal(null)}
            className="btn btn-primary flex items-center justify-center space-x-2 whitespace-nowrap"
          >
            <Plus className="h-5 w-5" />
            <span>Add Studio</span>
          </button>
        </div>
      </div>

      {/* 👈 4. Menggunakan `filteredHalls` menggantikan `halls` */}
      {filteredHalls.length === 0 ? (
        <div className="text-center py-12 card">
          <Building className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg mb-4">
            {selectedCinemaFilter
              ? "No studios found for this cinema"
              : "No studios found"}
          </p>
          {!selectedCinemaFilter && (
            <button
              onClick={() => handleOpenModal(null)}
              className="btn btn-primary"
            >
              Add Your First Studio
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Mapping dari filteredHalls */}
          {filteredHalls.map((hall) => (
            <div key={hall._id} className="card p-6 flex flex-col">
              <div className="flex-grow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center">
                      <Building className="h-6 w-6 text-primary-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {hall.hall_name}
                      </h3>
                      <p className="text-sm text-slate-400 truncate">
                        ID: {hall.studioId || hall._id}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Status</span>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full uppercase tracking-wider ${getStatusColor(hall.status)}`}
                    >
                      {hall.status || "Active"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Bioskop</span>
                    <span className="text-white font-medium truncate max-w-[150px]">
                      {getCinemaName(hall.cinema)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Seats</span>
                    <span className="text-white font-medium">
                      {hall.total_seats}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Layout</span>
                    <span className="text-white font-medium">
                      {hall.layout_rows} rows × {hall.layout_columns} cols
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-dark-700 flex items-center space-x-2">
                <button
                  onClick={() => handleOpenModal(hall)}
                  className="btn btn-secondary flex-1 flex items-center justify-center space-x-2"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDeleteClick(hall)}
                  className="btn btn-danger flex-1 flex items-center justify-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
