import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Image from "next/image";
import api from "@/lib/api";
import FoodItemCard from "@/components/FoodItemCard";
import AddItemModal from "@/components/AddItemModal";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [qrItem, setQrItem] = useState(null);

  // Load user from localStorage
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, [router]);

  // Fetch food items
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/items");
      setItems(data);
    } catch {
      // If the token is invalid, redirect to login
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this item?")) return;
    try {
      await api.delete(`/items/${id}`);
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.replace("/login");
  };

  return (
    <>
      <Head>
        <title>Dashboard – AR Food Menu Platform</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🍽️</span>
              <span className="font-bold text-gray-800 text-lg">
                {user?.restaurantName || "AR Food Menu"}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 hidden sm:block">
                {user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-500 hover:text-red-700 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Menu Items</h1>
              <p className="text-gray-500 text-sm mt-1">
                {items.length} item{items.length !== 1 ? "s" : ""} total
              </p>
            </div>
            <button
              onClick={() => {
                setEditItem(null);
                setShowModal(true);
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl px-5 py-2.5 transition flex items-center gap-2"
            >
              <span className="text-lg">＋</span> Add Item
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-10 h-10 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-24 text-gray-400">
              <div className="text-5xl mb-4">🍔</div>
              <p className="text-lg font-medium">No menu items yet</p>
              <p className="text-sm mt-1">
                Click &ldquo;Add Item&rdquo; to get started
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <FoodItemCard
                  key={item._id}
                  item={item}
                  onEdit={() => {
                    setEditItem(item);
                    setShowModal(true);
                  }}
                  onDelete={() => handleDelete(item._id)}
                  onShowQR={() => setQrItem(item)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit modal */}
      {showModal && (
        <AddItemModal
          item={editItem}
          onClose={() => setShowModal(false)}
          onSaved={fetchItems}
        />
      )}

      {/* QR Code modal */}
      {qrItem && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setQrItem(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-xs w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-800 mb-1">
              {qrItem.name}
            </h2>
            <p className="text-sm text-gray-500 mb-4">Scan to view in AR</p>
            {qrItem.qrCodeUrl ? (
              <Image
                src={qrItem.qrCodeUrl}
                alt="QR Code"
                width={200}
                height={200}
                className="mx-auto"
                unoptimized
              />
            ) : (
              <p className="text-gray-400 text-sm">QR code not available</p>
            )}
            <button
              onClick={() => setQrItem(null)}
              className="mt-5 w-full bg-gray-100 hover:bg-gray-200 rounded-xl py-2 text-sm font-medium text-gray-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
