"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";

export default function CreateDatasetDialog ({ open , onClose , onCreated}){
    if (!open)return null;
    const [newDatasetName, setNewDatasetName] = useState("");
    const [loading, setLoading] = useState(false);

    const handleCreateDataset = async () => {
        if (!newDatasetName.trim()) return;
        setLoading(true);

        const { data, error } = await supabase
      .from("dataset")
      .insert({ name: newDatasetName.trim() })
      .select()
      .single();

    if (error) {
      alert("Failed to create dataset");
      console.error(error);
    }else{
        setNewDatasetName("");
        onCreated?.(data);
        onClose();
    }
    setLoading(false);
 };
 return (
    <Dialog open={open} onOpenChange={onClose}>
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
          <h2 className="text-lg font-semibold mb-4">Create New Dataset</h2>
          <div className="flex gap-2 mb-4">
            <Input
              value={newDatasetName}
              onChange={(e) => setNewDatasetName(e.target.value)}
              placeholder="Dataset name"
            />
            <Button
              onClick={handleCreateDataset}
              disabled={loading || !newDatasetName.trim()}
            >
              Create
            </Button>
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full text-sm text-gray-500"
          >
            Cancel
          </Button>
        </div>
      </div>
    </Dialog>
  );
}