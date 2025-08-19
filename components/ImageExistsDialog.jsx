
import { useEffect } from "react";

export default function ImageExistsDialog({ isOpen, onClose, imageUrl }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full relative animate-fadeIn">
        <h2 className="text-lg font-bold mb-2 text-gray-800">Image Already Exists</h2>
        <p className="text-gray-600 mb-4">
          This image is already uploaded to Supabase . We'll use the existing version.
        </p>
        <img
          src={imageUrl}
          alt="Already uploaded"
          className="w-full h-48 object-cover rounded-xl border mb-4"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
