import Image from "next/image";

/**
 * Card displayed in the admin dashboard for each food item.
 */
export default function FoodItemCard({ item, onEdit, onDelete, onShowQR }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
      {/* Preview image */}
      <div className="relative h-44 bg-orange-50 flex items-center justify-center">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover"
          />
        ) : (
          <span className="text-6xl">🍽️</span>
        )}
      </div>

      {/* Details */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-gray-800 text-lg leading-tight">
            {item.name}
          </h3>
          <span className="text-orange-500 font-semibold whitespace-nowrap">
            ${Number(item.price).toFixed(2)}
          </span>
        </div>

        {item.calories != null && (
          <p className="text-xs text-gray-400 mt-1">{item.calories} kcal</p>
        )}

        {item.ingredients?.length > 0 && (
          <p className="text-sm text-gray-500 mt-2 line-clamp-2">
            {item.ingredients.join(", ")}
          </p>
        )}

        {/* Analytics */}
        <p className="text-xs text-gray-400 mt-2">
          👁 {item.viewCount ?? 0} view{item.viewCount !== 1 ? "s" : ""}
        </p>

        {/* 3D model indicator */}
        {item.modelUrl && (
          <span className="mt-2 inline-block text-xs bg-orange-100 text-orange-600 rounded-full px-2 py-0.5 w-fit">
            3D model ✓
          </span>
        )}

        {/* Action buttons */}
        <div className="mt-auto pt-4 flex gap-2">
          <button
            onClick={onShowQR}
            className="flex-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg py-2 transition"
          >
            QR Code
          </button>
          <button
            onClick={onEdit}
            className="flex-1 text-xs bg-orange-50 hover:bg-orange-100 text-orange-600 font-medium rounded-lg py-2 transition"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="flex-1 text-xs bg-red-50 hover:bg-red-100 text-red-500 font-medium rounded-lg py-2 transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
