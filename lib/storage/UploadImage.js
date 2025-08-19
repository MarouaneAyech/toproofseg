import { supabase } from "../supabaseClient";

/** 
 * @param {File} file
 * @returns {Promise<string>}
 */
async function hashFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

/**

 * @param {File} file
 * @param {(url: string) => void} onAlreadyExists
 * @returns {Promise<string|null>}
 */
export const uploadImageToSupabase = async (file, onAlreadyExists) => {
  if (!file) return null;


  const hash = await hashFile(file);
  const fileName = `image-${hash}.png`;

  const { data: files, error: listError } = await supabase
    .storage
    .from("images")
    .list("", { search: fileName }); 

  if (listError) {
    console.error("Error checking file existence:", listError.message);
  }

  if (files && files.some(file => file.name === fileName)) {
    const { data: publicUrlData } = supabase.storage
      .from("images")
      .getPublicUrl(fileName);

    if (onAlreadyExists) onAlreadyExists(publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  }

  const { data, error } = await supabase.storage
    .from("images")
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error("Upload failed:", error.message);
    return null;
  }

  console.log("✅ Uploaded new image:", data?.path);

  const { data: publicUrlData } = supabase.storage
    .from("images")
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
};
