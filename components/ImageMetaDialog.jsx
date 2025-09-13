"use client";
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function ImageMetaDialog({ open, onClose, onSave }) {
    if (!open) return;
  const [shape, setShape] = useState("");
  const [orientation, setOrientation] = useState("");

  const handleConfirm = () => {
    if (shape && orientation) {
      onSave({ shape, orientation });
      onClose();
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
          <h2 className="text-lg font-semibold mb-4">Image Metadata</h2>

          <div>
                <label className="text-sm font-medium">Shape</label>
                <input
                  type="text"
                  value={shape}
                  onChange={(e) => setShape(e.target.value)}
                  placeholder="e.g., rectangular / square / L-shaped / pitched "
                  className="w-full mt-1 border rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Orientation </label>
                <input
                  type="text"
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value)}
                  placeholder="e.g., aligned / diagonal / irregular"
                  className="w-full mt-1 border rounded px-2 py-1 text-sm"
                />
              </div>

          <Button
            onClick={handleConfirm}
            className="w-full bg-green-600 hover:bg-green-700 text-white mt-5"
          >
            Save
          </Button>
          <Button
             onClick={onClose}
             className="mt-2 mb-2 w-full text-sm hover:bg-gray-500 text-gray-300"
            >
              Cancel
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
