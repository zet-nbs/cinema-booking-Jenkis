import { useEffect, useState } from "react";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import { adminResourceService } from "@/services/adminResourceService";

const valueAt = (item, path) =>
  path.split(".").reduce((value, key) => value?.[key], item);

function ResourceForm({ config, item, options, onClose, onSaved }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();
  useEffect(() => {
    const initial = {};
    config.fields.forEach((field) => {
      const value = valueAt(item, field.name);
      initial[field.name] =
        field.type === "select" && value && typeof value === "object"
          ? value._id
          : (value ?? "");
    });
    reset(initial);
  }, [item, config, reset]);
  const submit = async (form) => {
    try {
      const payload = Object.fromEntries(
        Object.entries(form).filter(([, value]) => value !== ""),
      );
      config.fields
        .filter((field) => field.type === "number")
        .forEach((field) => {
          if (payload[field.name] !== undefined)
            payload[field.name] = Number(payload[field.name]);
        });
      if (item)
        await adminResourceService.update(config.endpoint, item._id, payload);
      else await adminResourceService.create(config.endpoint, payload);
      toast.success(`${config.singular} berhasil disimpan`);
      onSaved();
    } catch (error) {
      toast.error(error.message);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-dark-900/80 p-4 sm:items-center">
      <form
        onSubmit={handleSubmit(submit)}
        className="card relative my-auto w-full max-w-lg space-y-4 p-6"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-3 text-2xl text-slate-400"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold">
          {item ? "Edit" : "Tambah"} {config.singular}
        </h2>
        {config.fields.map((field) => (
          <div key={field.name}>
            <label className="mb-1 block text-sm font-medium">
              {field.label}
            </label>
            {field.type === "select" ? (
              <select
                className="input"
                {...register(field.name, {
                  required:
                    (field.required || (field.name === "password" && !item)) &&
                    `${field.label} wajib diisi`,
                })}
              >
                <option value="">Pilih {field.label}</option>
                {(options[field.options] || []).map((option) => (
                  <option key={option._id} value={option._id}>
                    {field.optionLabel
                      ? field.optionLabel(option)
                      : option.name || option.city || option.email}
                  </option>
                ))}
              </select>
            ) : field.type === "textarea" ? (
              <textarea
                className="input"
                rows="3"
                {...register(field.name, {
                  required: field.required && `${field.label} wajib diisi`,
                })}
              />
            ) : (
              <input
                type={field.type || "text"}
                className="input"
                {...register(field.name, {
                  required:
                    (field.required || (field.name === "password" && !item)) &&
                    `${field.label} wajib diisi`,
                })}
              />
            )}
            {errors[field.name] && (
              <p className="mt-1 text-sm text-red-400">
                {errors[field.name].message}
              </p>
            )}
          </div>
        ))}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Batal
          </button>
          <button disabled={isSubmitting} className="btn btn-primary">
            {isSubmitting ? <LoadingSpinner size="sm" /> : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminResourcesPage({ config }) {
  const [items, setItems] = useState([]);
  const [options, setOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const load = async () => {
    setLoading(true);
    try {
      const [data, ...relations] = await Promise.all([
        adminResourceService.list(config.endpoint),
        ...(config.relations || []).map((relation) =>
          adminResourceService.list(relation.endpoint),
        ),
      ]);
      setItems(data);
      setOptions(
        Object.fromEntries(
          (config.relations || []).map((relation, index) => [
            relation.key,
            relations[index],
          ]),
        ),
      );
    } catch (error) {
      toast.error(error.message || `Gagal memuat ${config.title}`);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    setItems([]);   // clear stale rows immediately before re-fetching
    load();
  }, [config]);
  const remove = async (item) => {
    if (!window.confirm(`Hapus ${config.singular} ini?`)) return;
    try {
      await adminResourceService.remove(config.endpoint, item._id);
      toast.success(`${config.singular} dihapus`);
      load();
    } catch (error) {
      toast.error(error.message);
    }
  };
  if (loading)
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  return (
    <div className="space-y-6">
      {formOpen && (
        <ResourceForm
          config={config}
          item={editing}
          options={options}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            load();
          }}
        />
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{config.title}</h1>
          <p className="text-slate-400">
            Kelola data {config.title.toLowerCase()}
          </p>
        </div>
        <button
          className="btn btn-primary flex items-center gap-2"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-5 w-5" />
          Tambah
        </button>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-dark-800">
            <tr>
              {config.columns.map((column) => (
                <th
                  className="px-5 py-3 text-left text-xs uppercase text-slate-400"
                  key={column.label}
                >
                  {column.label}
                </th>
              ))}
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-700">
            {items.map((item) => (
              <tr key={item._id}>
                {config.columns.map((column) => (
                  <td
                    className="px-5 py-3 text-sm text-slate-200"
                    key={column.label}
                  >
                    {column.render
                      ? column.render(item)
                      : String(valueAt(item, column.name) ?? "-")}
                  </td>
                ))}
                <td className="flex gap-2 px-5 py-3">
                  <button
                    onClick={() => {
                      setEditing(item);
                      setFormOpen(true);
                    }}
                    className="text-green-400"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button onClick={() => remove(item)} className="text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <p className="p-8 text-center text-slate-400">Belum ada data.</p>
        )}
      </div>
    </div>
  );
}
