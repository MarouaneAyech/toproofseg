"use client";
import { useState } from 'react';
import {
  MousePointerClick,
  Plus,
  Minus,
  RotateCw,
  Undo2,
  Upload,
  Globe,
  Scissors,
  Wand,
  FolderPlus,
  FolderOpenDot,
  Image as ImageIcon,
  Link2,

} from "lucide-react";
import CreateDatasetDialog from '../CreateDatasetDialog';
import LoadLabeledImageDialog from '../LoadLabeledImageDialog'

export default function Sidebar({ 
  onAddMask, 
  onRemoveArea,
  pointMode,
  onReset,
  onUndo,
  onRedo,
  fileInputEl,
  crop,
  loading,
  mask, 
  onLoad
   }) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);



  return (
    <>
    <aside className="w-full md:w-72 p-4 bg-white shadow-md rounded-2xl flex flex-col gap-4 text-sm font-medium text-gray-800">
         <span className='font-bold text-blue-800'>Tools</span>
      <div className="border border-purple-400 p-4 rounded-xl bg-purple-50 shadow-sm">
        <div className="flex items-center gap-2 text-purple-600 font-semibold mb-2">
          <Wand size={18}/> 
            Dataset Tools 
        </div>
        <div className="flex flex-col gap-2">
          <button className="flex items-center gap-2 bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-500 text-xs"
            onClick={() => {
              setCreateDialogOpen(true);
              }}>
            <FolderPlus size={14}/> 
              Create Dataset
          </button>
          <button className="flex items-center gap-2 bg-purple-200  px-3 py-1 rounded-md hover:bg-purple-300  text-purple-950 text-xs"
             onClick={()=>setLoadDialogOpen(true)}>
            <FolderOpenDot size={14}/> 
              Load
          </button>
        </div>
      </div>

      <div className="border border-green-400 p-4 rounded-xl bg-green-50 shadow-sm">
        <div className="flex items-center gap-2 text-green-600 font-semibold mb-2">
          <ImageIcon size={18}/>
            Image Tools
        </div>
        <div className="flex flex-col gap-2">
          <button className="flex items-center gap-2 bg-green-800 text-white text-xs px-3 py-1 rounded-md hover:bg-green-700"
           onClick={() => {fileInputEl?.current?.click()}}
           disabled= {loading}
          >
          <Upload size={14}/>  Upload
          </button>
        
          <button className="flex items-center gap-2 bg-green-200 text-green-950 text-xs px-3 py-1 rounded-md hover:bg-green-300"
           onClick={()=> {console.log("triggered2 sidebar");
            crop()}}
           disabled= {!mask}
          >
          <Scissors size={14} /> Cut-Outs
          </button>
        </div>
      </div>

      <div className="border border-blue-700 rounded-xl p-4 bg-blue-50 shadow-sm">
        <div  className="flex items-center gap-2 text-blue-600 font-semibold mb-2">
          <MousePointerClick size={18} />
            Hover & Click
        </div>
        <p className="text-xs text-gray-600 mb-3">
          Click an object one or more times.
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={onAddMask}
            className={`flex items-center gap-1  px-2.5 py-1 rounded-md text-xs
              ${pointMode=== "add" ?"bg-blue-600 text-white": "bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors duration-200 ease-in-out"}
              `}
          >
            <Plus size={14} /> Add Mask
          </button>
          <button
            onClick={onRemoveArea}
            className={`flex items-center gap-1  px-2.5 py-1 rounded-md text-xs
              ${pointMode=== "remove" ?"bg-red-500 text-white": "bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors duration-200 ease-in-out"}
              `}
          >
            <Minus size={14} /> Remove Area
          </button>
        </div>

        <div className="flex justify-between gap-2 text-xs">
          <button
            onClick={onReset}
            className="flex items-center gap-1 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-md w-full md:w-auto hover:bg-gray-300 transition-color flex-1 justify-center"
          >
             Reset
          </button>
          <button
            onClick={onUndo}
            className="flex items-center gap-1 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-md w-full md:w-auto hover:bg-gray-300 transition-color flex-1 justify-center"

          >
            <Undo2 size={15} /> Undo
          </button>
          <button
            onClick={onRedo}
            className="flex items-center gap-1 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-md w-full md:w-auto hover:bg-gray-300 transition-color flex-1 justify-center"

          >
            <RotateCw size={14} /> Redo
          </button>
        </div>
      </div>
  </aside>
   <CreateDatasetDialog 
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />
    <LoadLabeledImageDialog
     open={loadDialogOpen}
     onClose={() => setLoadDialogOpen(false)}
     onSelect={(labeledImage)=>{
      onLoad(labeledImage);
      setLoadDialogOpen(false);
     }}/>
    </>
  );
}
