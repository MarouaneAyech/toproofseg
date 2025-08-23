"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

export default function LoadLabeledImageDialog ( {open ,onClose, onSelect }){
    if(!open) return null;

    const [datasets,setDatasets] = useState([]);
    const [selectedDataset,setSelectedDataset] = useState(null);
    const [labeledImages,setLabeledImages] = useState([]);
    const [loading,setloading] = useState(false);

    useEffect(()=>{
        if (!open) return;
        setSelectedDataset(null);
        setLabeledImages([]);

        const fetchDatasets = async () => {
            const { data, error } = await supabase.from("dataset").select("*");
                if (error) console.error("Failed to fetch datasets", error);
                else setDatasets(data);
    };

    fetchDatasets();
    },[open])
<
    useEffect(()=>{
        if (!selectedDataset)return;

    const fetchLabeledImages = async () => {
        setloading(true);
        const {data, error } = await supabase
        .from("labeled_image")
        .select("* ,image (path)")
        .eq("dataset_id",selectedDataset.id);
        // console.log("from fetchLabeledImages : ",data);
        
        if(error) 
            console.error("Failed to fetch labeled images",error);
        else setLabeledImages(data);

        setloading(false);
    };
    fetchLabeledImages();
    },[selectedDataset]);
  
  return(
    <Dialog open={open} onOpenChange={onClose}>
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
          <h2 className="text-lg font-semibold mb-4">Load Labeled Image</h2>

        <div className="mb-4">
         <label className="block text-sm font-medium mb-1">Select dataset :</label>
            <select className="w-full border rounded border-purple-400 p-2"
                onChange={(e)=>{
                    // console.log(e.target.value)
                    const selected = datasets.find(d => d.id === Number(e.target.value));
                    // console.log(selected);
                    setSelectedDataset(selected);
                   }}
                  defaultValue="">
                  <option value="" disabled>Select a dataset</option>
                   {datasets.map((ds)=>( 
                    <option key={ds.id} value={ds.id}>{ds.name} </option>
                    ))}
            </select>
        </div>
        {selectedDataset && (
            <div className="border-t pt-4">
             <h3 className="text-sm font-semibold mb-2">labeled Images</h3>
                {loading?(<p className="text-sm text-gray-500">Loading...</p>):(
                 labeledImages.length === 0 ? (
                <p className="text-sm text-gray-500">No labeled images found.</p>
              ) : (
                <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-sm border rounded-sm border-purple-800">
                        <thead>
                            <tr className=" text-blue-800 text-sm">
                                <th className="text-left ">ID</th>
                                <th className="text-left">Image url</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {labeledImages.map((img)=>(
                            <tr key={img.id} className="border-t">
                                <td>{img.id}</td>
                                <td className="truncate max-w-[150px]">{img.image?.path}</td>
                                <td>
                                    <button className="text-xs text-green-950 px-2 py-1"
                                     onClick={()=>onSelect(img)}
                                    >
                                        Load
                                    </button>
                                </td>
                            </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
              )
                )}
            </div>
        )}
        <Button className="mt-4 w-full text-sm text-gray-500"
         variant="ghost"
         onClick={onClose}     
        >
            Cancel
          </Button>
        </div>
     </div>
    </Dialog>
  )


    



}