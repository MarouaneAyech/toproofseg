"use client";


import { Button } from "@/components/ui/button";




export default function Saved ({ open, onClose}){
     if (!open)return null;
    return (
     <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-[90%] max-w-md text-center">
        <p className="mb-6">Saved succesully</p>
        <div className="flex justify-center gap-4">
          
           <Button
             onClick={onClose}
             className="mt-4 w-full  bg-gray-600 text-sm text-white"
            >
              close
          </Button>

        </div>
      </div>
    </div>
  );

}