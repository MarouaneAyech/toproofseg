"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {FolderPlus} from "lucide-react"
import { supabase } from "@/lib/supabaseClient";
import CreateDatasetDialog from "./CreateDatasetDialog";

export default function DatasetDialog ({ open, onClose, onSelect }){
    if (!open)return null;

    const [datasets , setDatasets] = useState([]);
    const [selectedDataset, setSelectedDataset] = useState(null);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    useEffect(()=>{
    const fetchDatasets = async () => {
    const { data, error } = await supabase.from("dataset").select("*");
    if (error) console.error("Failed to fetch datasets", error);
    else setDatasets(data);
  };

  fetchDatasets();
    },[open]);

 const handleConfirm = () => {
    if (selectedDataset) {
      onSelect(selectedDataset);
      console.log("handeled in dialog- passing ",selectedDataset)
      onClose();
    }
  };
 return(
   <>
    <Dialog open={open} onOpenChange={onClose} >
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
          <h2 className="text-lg font-semibold mb-4">Select Dataset</h2>
            <div className="flex flex-col gap-2 mb-4">
                {datasets.map((dataset) =>(
                <button 
                 className="w-full justify-start"
                 key={dataset.id}
                 onClick={()=>{setSelectedDataset(dataset);}}
                >
                {dataset.name}
                </button>
                ))}
            </div> 
            <div className="mt-4 mr-20 border-purple-300">
            <p className="text-sm font-medium mb-2">Or create a new one</p>
            <button className="flex items-center gap-2 bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-500 text-xs ml-5"
             onClick={()=>{console.log("trig");
             setCreateDialogOpen(true);
             }} >
              <FolderPlus size={14}/> 
              Create new  Dataset
            </button>
           </div>
            <Button
             onClick={onClose}
             className="mt-4 w-full text-sm hover:bg-gray-500 text-gray-300"
            >
              Cancel
          </Button>
           <Button
              onClick={handleConfirm}
              disabled={!selectedDataset}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Confirm
            </Button>
        </div>
      </div>
    </Dialog>
     <CreateDatasetDialog
              open={createDialogOpen} 
              onClose={()=>setCreateDialogOpen(false)}
              onCreated={(newDataset) => {
                setDatasets ((prev)=> [...prev, newDataset]);
                setSelectedDataset(newDataset);
              }} 
            />
  </>
 )
}