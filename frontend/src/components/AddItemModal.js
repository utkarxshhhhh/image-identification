import { useState, useEffect } from "react";
import api from "@/lib/api";

const EMPTY = {
  name: "",
  price: "",
  calories: "",
  description: "",
  ingredients: "",
};

/**
 * Modal form for adding or editing a food item.
 * - `item` prop: pass null to create, or an existing item object to edit.
 * - `onClose`: callback to close the modal.
 * - `onSaved`: callback invoked after a successful save (re-fetches the list).
 */
export default function AddItemModal({ item, onClose, onSaved }) {
  const isEdit = Boolean(item);
  const [form, setForm] = useState(EMPTY);
  const [modelFile, setModelFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Populate form when editing
  useEffect(() => {
    if (item) {
      setForm({
        name: item.name ?? "",
        price: item.price ?? "",
        calories: item.calories ?? "",
        description: item.description ?? "",
        ingredients: item.ingredients?.join(", ") ?? "",
      });
    } else {
      setForm(EMPTY);
    }
  }, [item]);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("price", form.price);
      if (form.calories) formData.append("calories", form.calories);
      if (form.description) formData.append("description", form.description);

      // Convert comma-separated string to JSON array
      const ingredientsArr = form.ingredients
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      formData.append("ingredients", JSON.stringify(ingredientsArr));

      if (modelFile) formData.append("model", modelFile);
      if (imageFile) formData.append("image", imageFile);

      if (isEdit) {
        await api.put(`/items/${item._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/items", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto thin-scroll"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-5">
            {isEdit ? "Edit Item" : "Add New Item"}
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Food Name *
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="e.g. Margherita Pizza"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
              />
            </div>

            {/* Price + Calories */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price ($) *
                </label>
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={handleChange}
                  required
                  placeholder="12.99"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Calories (kcal)
                </label>
                <input
                  name="calories"
                  type="number"
                  min="0"
                  value={form.calories}
                  onChange={handleChange}
                  placeholder="450"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                />
              </div>
            </div>

            {/* Ingredients */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ingredients{" "}
                <span className="text-gray-400 font-normal">
                  (comma-separated)
                </span>
              </label>
              <input
                name="ingredients"
                value={form.ingredients}
                onChange={handleChange}
                placeholder="Tomato, Mozzarella, Basil"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="A short description of the dish…"
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm resize-none"
              />
            </div>

            {/* 3D Model upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                3D Model{" "}
                <span className="text-gray-400 font-normal">(.glb)</span>
              </label>
              <input
                type="file"
                accept=".glb"
                onChange={(e) => setModelFile(e.target.files[0])}
                className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-orange-50 file:text-orange-600 file:font-medium hover:file:bg-orange-100"
              />
              {isEdit && item.modelUrl && (
                <p className="text-xs text-gray-400 mt-1">
                  Current model on file – upload a new one to replace it
                </p>
              )}
            </div>

            {/* Image upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preview Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
                className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-orange-50 file:text-orange-600 file:font-medium hover:file:bg-orange-100"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl py-2.5 transition text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl py-2.5 transition text-sm disabled:opacity-60"
              >
                {loading ? "Saving…" : isEdit ? "Save Changes" : "Add Item"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
