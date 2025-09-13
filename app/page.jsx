"use client";
import {supabase} from '@/lib/supabaseClient'
import {uploadImageToSupabase} from '@/lib/storage/UploadImage.js'
import DatasetDialog from "@/components/DatasetDialog";
import SaveDesicionDialog from '@/components/SaveDesicionDialog';
import ImageMetaDialog from '../components/ImageMetaDialog';
import Saved from '@/components/Saved'
import React, {
  useState,
  useEffect,
  useRef,
} from "react";
import { cn } from "@/lib/utils";

// UI
import {
  Card,
  CardContent,
 
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import Sidebar  from "@/components/ui/sidebar";
import ImageExistsDialog from "@/components/ImageExistsDialog";
import {
 LoaderCircle,
  Fan,
  Save,
} from "lucide-react";

// Image manipulations
import {
  resizeCanvas,
  resizeAndPadBox,
  canvasToFloat32Array,
  float32ArrayToCanvas,
  sliceTensor,
  maskCanvasToFloat32Array,
} from "@/utils/imageutils";

import {isCanvasDrawn} from '@/utils/isCanvasDrawn'

export default function Home() {
  // resize+pad all images to 1024x1024
  const imageSize = { w: 1024, h: 1024 };
  const maskSize = { w: 256, h: 256 };

  // state
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [datasetDialogOpen, setDatasetDialogOpen] = useState(false);
  const [saveDecisionOpen, setSaveDecisionOpen] = useState(false);
  const [savedDialogOpen, setSavedDialogOpen] = useState(false);
  const [metaDialogOpen, setMetaDialogOpen] = useState(false);

  
  
  
  // web worker, image and mask
  const samWorker = useRef(null);
  const [image, setImage] = useState(null);
  const [imageEncoded, setImageEncoded] = useState(false);
  

  const [currentLabeledImageId, setCurrentLabeledImageId] = useState(null);
  const [pointMode , setPointMode] = useState("add");
  const pointsStackRef = useRef([]);
  const redoStackRef = useRef([]);
  const [mask, setMask] = useState(null);


  const [prevMaskArray, setPrevMaskArray] = useState(null); // Float32Array
  const [imageURL, setImageURL] = useState(
    "https://www.shutterstock.com/image-photo/shingle-roof-newly-constructed-highrise-600nw-2021540678.jpg");
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null); 
  const [drawReady, setDrawReady] = useState(false); 
  const drawReadyRef = useRef(false);
  const canvasEl = useRef(null);
  const fileInputEl = useRef(null);
  const drawBoxRef = useRef(null);
  const isCanvasReady = useRef(false);
  const [canvasKey, setCanvasKey] = useState(0);
  const [imageExistsModalOpen, setImageExistsModalOpen] = useState(false);
  const [existingImageUrl, setExistingImageUrl] = useState("");
  const isLoadingLabeledImage = useRef(false);
  const isEncoding = useRef(false);

  const [stats, setStats] = useState(null);

  const renderBaseImage = () => {
  if (!image || !canvasEl.current) return;

  const ctx = canvasEl.current.getContext("2d");
  ctx.clearRect(0, 0, canvasEl.current.width, canvasEl.current.height);
  ctx.drawImage(
    image,
    0,
    0,
    image.width,
    image.height,
    0,
    0,
    canvasEl.current.width,
    canvasEl.current.height
  );
};

  // Start encoding image
const encodeImageClick =  () => {
   if (isEncoding.current) {
    console.warn("Encoding is already running, skipping...");
    return;
  }
  
  isEncoding.current=true;
    return new Promise((resolve, reject)=>{
      if (!image) {
        reject ("Image not set");
        return
      }
      const listener = (event)=>{
        if (event.data.type === "encodeImageDone"){
          samWorker.current.removeEventListener("message",listener);
          setImageEncoded(true);
          setLoading(false);
          setStatus("Ready. click on image");
          isEncoding.current=false;
          resolve(); 
        }
      };
      samWorker.current.addEventListener("message",listener);

      samWorker.current.postMessage({
        type: "encodeImage",
        data: canvasToFloat32Array(resizeCanvas(image, imageSize)),
      });
      setLoading(true);
      setStatus("Encoding");
    })

  };

  

  const decodeWithPoints = (points) => {
    // console.log("decoding with : " , points )
    if (!points || points.length ===0) return ;

    const hasPrevMask = prevMaskArray !== null;
    const maskShape = hasPrevMask? [1,1 , maskSize.w ,maskSize.h] : null;
    samWorker.current.postMessage({
      type: "decodeMask",
      data: {
        points,
        maskArray: hasPrevMask ? prevMaskArray : null,
        maskShape,
      },
    })
    setLoading(true);
    setStatus("Decoding...")

  }
  const drawWithPointsOnCanvas = () => {
    const canvas=canvasEl.current;
    const ctx = canvas.getContext("2d");
    if (!ctx || !image) return;

    const modelW = imageSize.w;
    const modelH = imageSize.h;

    pointsStackRef.current.forEach((p)=>{
      const x = (p.x / modelW) * canvas.width;
      const y = (p.y / modelH) * canvas.height;

    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fillStyle = p.label === 1 ? "blue" : "red";
    ctx.fill();
    ctx.closePath();
    });
  }
  // Start decoding, prompt with mouse coords
  const imageClick = (event) => {
  if (!imageEncoded || loading) {
    console.warn("image not ready for a click ");
    return;
  }

  event.preventDefault();

  const canvas = canvasEl.current;
  // console.log("cavas size when saving clicks :",canvas.width , canvas.height)
  const rect = canvas.getBoundingClientRect();

  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const clickX = (event.clientX - rect.left)*scaleX;
  const clickY = (event.clientY - rect.top)*scaleY;
  const modelW = imageSize.w;
  const modelH = imageSize.h;


  const point = {
    x: (clickX/canvas.width) * modelW,
    y: (clickY/canvas.height)* modelH,
    label: pointMode === "add" ? 1 : 0,
  };

  pointsStackRef.current.push(point);
  redoStackRef.current = [];

  decodeWithPoints(pointsStackRef.current);
};


  const handleUndo = () => {
    if (pointsStackRef.current.length === 0) return ;
    const lastPoint = pointsStackRef.current.pop();
    redoStackRef.current.push(lastPoint);

    if (pointsStackRef.current.length === 0){
      setMask(null);
      setPrevMaskArray(null);
      renderBaseImage()
    }else {
      decodeWithPoints(pointsStackRef.current);
    }
  }

  const handleRedo = () => {
    if (redoStackRef.current.length === 0) return ;

    const point = redoStackRef.current.pop();
    pointsStackRef.current.push(point);

    decodeWithPoints(pointsStackRef.current)
  }
  // Decoding finished -> parse result and update mask
  const handleDecodingResults =(decodingResults) => {
    // SAM2 returns 3 mask along with scores -> select best one
    const maskTensors = decodingResults.masks;
    const [bs, noMasks, width, height] = maskTensors.dims;
    const maskScores = decodingResults.iou_predictions.cpuData;
    const bestMaskIdx = maskScores.indexOf(Math.max(...maskScores));
    const bestMaskArray = sliceTensor(maskTensors, bestMaskIdx);

    let bestMaskCanvas = float32ArrayToCanvas(bestMaskArray, width, height)
    bestMaskCanvas = resizeCanvas(bestMaskCanvas, imageSize);
    setMask(bestMaskCanvas);
    window.lastKnownMask = bestMaskCanvas;
    setPrevMaskArray(bestMaskArray);
 


  }

  // Handle web worker messages
  const onWorkerMessage = (event) => {
    const { type, data } = event.data;

    if (type == "pong") {
      const { success, device } = data;

      if (success) {
        setLoading(false);
        setDevice(device);
        setStatus("Encode image");
      } else {
        setStatus("Error (check JS console)");
      }
    } else if (type == "downloadInProgress" || type == "loadingInProgress") {
      setLoading(true);
      setStatus("Loading model");
    } else if (type == "encodeImageDone") {
      // alert(data.durationMs)
      setImageEncoded(true);
      setLoading(false);
      setStatus("Ready. Click on image");
    } else if (type == "decodeMaskResult") {
      handleDecodingResults(data);
      setLoading(false);
      setStatus("Ready. Click on image");
    } else if (type == "stats") {
      setStats(data);
    }
  }

  // Crop image with mask
 const cropClick = () => {
  console.log("trigger crop (mask only)");

  if (!mask) {
    console.warn("No mask available to save");
    return;
  }

  const link = document.createElement("a");
  link.href = mask.toDataURL("image/png");
  link.download = "mask.png";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


  
  const resetState = () => {

    pointsStackRef.current = [];
    redoStackRef.current = [];
    setMask(null);
    setPrevMaskArray(null);
    setImageEncoded(false);
    renderBaseImage();
    setStatus("Awaiting encoding");
  
  }

  // New image: From File
  const handleFileUpload = async (event) => {
    
    const file = event.target.files[0];
    if (!file) return;
    
    resetState()
    setCurrentLabeledImageId(null); 

    const publicImageUrl = await uploadImageToSupabase(file, (url)=>{
      setExistingImageUrl(url);
      setImageExistsModalOpen(true);
    });

    if (!publicImageUrl) return;

   setUploadedImageUrl(publicImageUrl);
   setMetaDialogOpen(true);
  
  }
  const handleSaveImageMeta = async ({ shape, orientation }) => {
  try {
    const { data: newImage, error } = await supabase
      .from("image")
      .insert({
        path: uploadedImageUrl,
        shape: shape,
        orientation: orientation,
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting image metadata:", error.message);
      return;
    }
    setImageURL(uploadedImageUrl)
    setStatus("Encode Image")
    setSavedDialogOpen(true);
  } catch (err) {
    console.error("Unexpected error while saving image meta:", err);
  }
};


  const handleLabeledImage = async(selectedDataSet) =>{
   
    if(pointsStackRef.current.length == 0) return ;
    const imagePath = uploadedImageUrl ?? imageURL;

    try{
      let imageId
      const {data: existingImage} = await supabase
      .from("image").select("id").eq("path",imagePath).single();    
      
      if(existingImage){
         imageId = existingImage.id;
      }else{
        const {data: newImage, error:insertImgErr} = await supabase
        .from("image").insert({ path:imagePath}).select().single();

        if(insertImgErr){
          console.error("error inserting image:", insertImgErr.message);
          return;
        }
        imageId = newImage.id;
      }
      const {data:labeledImage, error:labelErr} = await supabase
      .from("labeled_image").insert({
        image_id:imageId,
        dataset_id:selectedDataSet.id,
      }).select().single();
      
      if(labelErr){
        console.error("error inserting labeled image: ", labelErr.message);
        return;
      }

      const pointsToInsert = pointsStackRef.current.map((p) => ({
        x: p.x,
        y:p.y,
        nature:p.label===1 ,
        labeled_image_id:labeledImage.id
      }));

      const {pointsErr} = await supabase.from("point").insert(pointsToInsert)
      if (pointsErr){
        console.error("Error inserting points:", pointsErr.message);
        return;
      }

      // console.log("saved successfully");
      setSavedDialogOpen(true)
    }catch(err){
      console.error("Unexpected error:", err);
      alert("Something went wrong while saving.");
    }
  }


  const LoadLabeledImage = async (labeledImage) =>{
    try{
    if(!labeledImage.image.path) return;
    setDrawReady(false);  
    setCurrentLabeledImageId(labeledImage.id)
    isLoadingLabeledImage.current=true;
    setPrevMaskArray(null)
    setMask(null)

      const {data:points,error} = await supabase
      .from("point")
      .select("*")
      .eq("labeled_image_id",labeledImage.id);
      

      if(error){
        console.error("Error loading points:", error.message);
        return;
      }

   const mappedPoints = points.map(p => ({
      x: p.x,
      y:p.y,
      label: p.nature ? 1 : 0

    }));
    pointsStackRef.current = mappedPoints;
    console.log("mapped points on stack:" , pointsStackRef.current);
    redoStackRef.current = [];
    setImageURL(`${labeledImage.image.path}?v=${labeledImage.id}`)
  }catch (err){
    console.error("failed to load labeled image" , err)
  }
 }
  const saveLabeledImageUpdate = async () => {
    if (!currentLabeledImageId || pointsStackRef.current.length === 0 ) return ;

    try{
       const { error: deleteErr } = await supabase
      .from("point")
      .delete()
      .eq("labeled_image_id", currentLabeledImageId);

      if (deleteErr) {
      console.error("Error deleting existing points:", deleteErr);
      return;
    }
    const newPoints = pointsStackRef.current.map(p => ({
      x: p.x,
      y: p.y,
      nature: p.label ? true : false ,
      labeled_image_id: currentLabeledImageId,
    }));
    const { error: insertErr } = await supabase.from("point").insert(newPoints);
    if (insertErr) {
      console.error("Error inserting new points:", insertErr);
      return;
    }else console.log("points updated successfully.");
    setSavedDialogOpen(true);

    }catch(error){
      console.error(" error updating labeledImage" , error)
    }
  }

  

  // Load web worker
  useEffect(() => {
    if (!samWorker.current ) {
      samWorker.current = new Worker(new URL("./worker.js", import.meta.url), {
        type: "module",
      });
      samWorker.current.addEventListener("message", onWorkerMessage);
      samWorker.current.postMessage({ type: "ping" });

      setLoading(true);
    }
  }, [onWorkerMessage, handleDecodingResults]);


  useEffect(() => {
    if (imageURL) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function () {
        const largestDim =
          img.naturalWidth > img.naturalHeight
            ? img.naturalWidth
            : img.naturalHeight;
        const box = resizeAndPadBox(
          { h: img.naturalHeight, w: img.naturalWidth },
          { h: largestDim, w: largestDim }
        );
        const canvas = document.createElement("canvas");
        canvas.width = largestDim;
        canvas.height = largestDim;
      const ctx = canvas.getContext("2d",{ willReadFrequently: true });
      ctx.drawImage(
            img,
            0,
            0,
            img.naturalWidth,
            img.naturalHeight,
            box.x,
            box.y,
            box.w,
            box.h
          );
        drawBoxRef.current = box ;  
         const waitForCanvas = () =>
           new Promise(resolve => {
            const check = () => {
             if (isCanvasReady.current && canvasEl.current) {
              resolve();
          } else {
          requestAnimationFrame(check);
          }
        };
      check();
    });

     waitForCanvas().then(() => {
      console.log("Canvas ready — setting image now at ", performance.now());
      setCanvasKey(prev => prev + 1);
      setImage(canvas);
     });
    };
  img.src = imageURL;

  }
}, [imageURL]);

  // Offscreen canvas changed, draw it
 useEffect(() => {
  if (image){
  const canvas = canvasEl.current;
  if (!canvas || !isCanvasReady.current) {
    console.warn(" Canvas not ready — skipping draw");
    return;
  }

  const ctx = canvas.getContext("2d");
  setDrawReady(false);

  const Draw = () =>{
    console.log("Drawing image of size:", image.width, image.height);
     console.log("canvasEl.current size before draw:", canvas.width, canvas.height);

    if (canvasEl.current.width !== image.width|| canvasEl.current.height !== image.height) {
      console.warn("Canvas dimension mismatch — fixing it");
      canvasEl.current.width = image.width;
      canvasEl.current.height = image.height;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
       image,
       0,
       0,
      canvas.width,
      canvas.height
     );
    // console.log("drawImage() on canvasEl.current", canvasEl.current, "at : ", performance.now());
  };
  Draw();
  requestAnimationFrame(() => {
    const valid = isCanvasDrawn(ctx,drawBoxRef.current)
    console.log("pixel test result:", valid );
  if (valid) {
    setDrawReady(true);
    drawReadyRef.current = true
  }
});

}
}, [image]);

useEffect(() => {
  if (!mask || !image  || !drawReady) return;

  const canvas = canvasEl.current;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });


  if (canvas.width !== image.width || canvas.height !== image.height) {
    canvas.width = image.width;
    canvas.height = image.height;
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(
    image,
    0, 0, image.width, image.height,
    0, 0, canvas.width, canvas.height
  );
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.drawImage(
    mask,
    0, 0, mask.width, mask.height,
    0, 0, canvas.width, canvas.height
  );
  ctx.restore();

  drawWithPointsOnCanvas();
}, [mask, image, drawReady]);



  useEffect(()=>{
    if (!drawReady || !image || !canvasEl.current) return;
    if(isLoadingLabeledImage.current && !isEncoding.current){
      console.log("passed all conditions launching encode - decode pipeline with points :", pointsStackRef.current)
      encodeImageClick().then(()=> { 
       decodeWithPoints(pointsStackRef.current); 
    }).finally(() => {
      isLoadingLabeledImage.current = false;
    });
  }
  },[drawReady])

  useEffect(() => {
     isCanvasReady.current = true;
  return () => {
    isCanvasReady.current = false;
  };
}, []);

  return (
    <div className="flex flex-col md:flex-row gap-6 p-4 min-h-screen">
      <Sidebar 
        onAddMask={() => setPointMode("add")}
        onRemoveArea={() => setPointMode("remove")}
        pointMode={pointMode}
        onReset= {resetState}
        onUndo= {handleUndo}
        onRedo= {handleRedo} 
        fileInputEl={fileInputEl}
        crop={cropClick}
        onLoad={LoadLabeledImage}
      />  
      <Card className="flex-1 max-w-2xl">
        <CardHeader>
          <CardTitle>
            <div className="flex flex-col gap-2">
              <p>
                Clientside Image Segmentation with onnxruntime-web and Meta's SAM2
              </p>
              <p
                className={cn(
                  "flex gap-1 items-center",
                  device ? "visible" : "invisible"
                )}
              >
                <Fan
                  color="#000"
                  className="w-6 h-6 animate-[spin_2.5s_linear_infinite] direction-reverse"
                />
                Running on {device}
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between gap-4">
              <Button
                onClick={encodeImageClick}
                disabled={loading || imageEncoded}
              >
                <p className="flex items-center gap-2">
                  {loading ? (
                  <> 
                  <LoaderCircle className="animate-spin w-6 h-6"/> 
                  </>
                  ): imageEncoded ? (
                    "Ready. Click on image"
                  ):(
                    "Encode Image"
                  )}
                </p>
              </Button>
            
            </div>
            <div className="flex justify-center">
              <canvas
                id="main"
                key={canvasKey}
                ref={canvasEl} 
               className="max-w-[600px] w-4/5 h-auto block mx-auto "
                onClick={imageClick}
                onContextMenu={(event) => {
                  event.preventDefault();
                  imageClick(event);
                }}
              />
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={()=>{(currentLabeledImageId) ?  setSaveDecisionOpen(true) : setDatasetDialogOpen(true)}}
                className="bg-green-700 px-4 py-2 rounded-md shadow-sm text-sm flex items-center gap-2"
              >
                <Save size={15}/>  Save 
              </button>
            </div>
              <SaveDesicionDialog
              open={saveDecisionOpen}
              onClose={()=> setSaveDecisionOpen(false)}
              onUpdate={()=>{
                saveLabeledImageUpdate();
                setSaveDecisionOpen(false)
              }}
              onMakeCopy={()=>{
                setSaveDecisionOpen(false);
                setDatasetDialogOpen(true)}}
              />
                <DatasetDialog 
                  open={datasetDialogOpen}
                  onClose={() => setDatasetDialogOpen(false)}
                  onSelect={({ dataset }) =>
                              handleLabeledImage(dataset)
                             }
                  />
              <ImageExistsDialog
                isOpen={imageExistsModalOpen}
                imageUrl={existingImageUrl}
                onClose={() => setImageExistsModalOpen(false)}
              />
              <Saved
                open={savedDialogOpen}
                onClose={() => setSavedDialogOpen(false)}
              />
              <ImageMetaDialog
              open={metaDialogOpen}
              onSave={handleSaveImageMeta}
              onClose={()=>setMetaDialogOpen(false)}
              />
          </div>
        </CardContent>
      </Card>
       <input
        type="file"
        accept="image/*"
        ref={fileInputEl}
        onChange={handleFileUpload}
        style={{ display: "none" }}
    />
    </div>
  );
}
