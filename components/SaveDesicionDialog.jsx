"use client";


import { Button } from "@/components/ui/button";

export default function SaveDesicionDialog ({ open, onClose, onUpdate, onMakeCopy}){
     if (!open)return null;
    return (
     <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-[90%] max-w-md text-center">
        <p className="mb-6">would you like to update the existing labeled image or create a copy in another dataset?</p>
        <div className="flex justify-center gap-4">
          <Button
            onClick={() => {
                onUpdate();
                onClose();
            }}
            className="mt-4 w-full bg-green-600 text-white"
            >
            Update
          </Button>
          <Button className="mt-4 w-full bg-purple-600 text-white"
              onClick={() => {
                onMakeCopy();
                onClose();
            }}
            >
               Make Copy
          </Button>
           <Button
             onClick={onClose}
             className="mt-4 w-full  bg-gray-600 text-sm text-white"
            >
              Cancel
          </Button>

        </div>
      </div>
    </div>
  );

}