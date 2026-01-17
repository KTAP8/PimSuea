import { fabric } from 'fabric';
import { supabase } from '../lib/supabase';

/**
 * Handles the high-resolution rendering and upload of the design for production.
 * This creates a snapshot of the canvas at the moment of "Add to Cart".
 * 
 * @param canvas The Fabric.js canvas instance
 * @param userId The ID of the authenticated user
 * @returns The public URL of the uploaded image, or null if failed
 */
interface ExportOptions {
  crop?: { left: number; top: number; width: number; height: number };
}

export const exportDesignForProduction = async (
  canvas: fabric.Canvas | fabric.StaticCanvas,
  userId: string,
  options?: ExportOptions
): Promise<string | null> => {
  try {
    // Step A: Clone & Clean
    // Let's use a Promise wrapper. Does StaticCanvas support clone? 
    // Types might complain. StaticCanvas doesn't always support cloning the same way.
    // However, we only need to clone to avoid modifying the original.
    // For StaticCanvas (offline), we created it just for this, so we DON'T need to clone it!
    // We can just use it directly if it's not the user's view.
    
    let canvasToUse: fabric.Canvas | fabric.StaticCanvas = canvas;
    
    // Only clone if it is interactive (Canvas) to avoid messing up UI?
    // Or if we need to modify it (setBackgroundColor).
    // StaticCanvas supports setBackgroundColor.
    
    // We need to clone if we are transparent-ing the background of the LIVE canvas.
    // If it's the specific offline one, we can just use it?
    // But to be safe and uniform:
    
    // Fabric's clone method signature might vary. 
    // Let's rely on toDataURL directly if possible? No, we need transparency.
    // Safe bet: If it's a Canvas, clone it. If Static, assume we own it?
    
    if (canvas instanceof fabric.Canvas) {
         const cloned = await new Promise<fabric.Canvas>((resolve) => {
            // IMPORTANT: Pass attributes to include in the clone, specifically 'name'
            canvas.clone((c: fabric.Canvas) => resolve(c), ['name']);
         });
         canvasToUse = cloned;
    } else {
         // It's a StaticCanvas, likely created just for export. 
         // But wait, if we explicitly passed a StaticCanvas, do we want to modify it?
         // Yes, we created it in DesignCanvas.tsx loop.
         // But we assume exportDesignForProduction is pure? 
         // If we modify background color, it affects the passed instance.
         // For the offline loop, we dispose it right after, so it's fine.
         canvasToUse = canvas;
    }

    const clonedCanvas = canvasToUse;

    // Clean: Set background to transparent (null)
    clonedCanvas.setBackgroundColor(null as any, clonedCanvas.renderAll.bind(clonedCanvas));
    
    // IMPORTANT: Remove the "Shirt" background (static_bg) and the "Red Dotted Line" (print_zone)
    // We only want the actual design elements (text, images, etc.)
    const objectsToRemove = clonedCanvas.getObjects().filter(obj => 
        obj.name === 'static_bg' || obj.name === 'print_zone'
    );
    objectsToRemove.forEach(obj => clonedCanvas.remove(obj));
    
    // Ensure changes are rendered to the clone
    clonedCanvas.renderAll();

    // IMPORTANT: Clip the canvas to the print zone if crop options are provided
    // This effectively "crops" the output image
    if (options?.crop) {
       // We can adjust the viewportTransform or dimensions, 
       // but explicitly creating a temporary static canvas of the crop size is often more reliable for "cropping" 
       // exactly what we want without scaling weirdness.
       // However, toDataURL has options for left/top/width/height.
       
       // Note: Fabric toDataURL options apply *before* the multiplier.
    }
    
    // Step B: Scale & Render
    // multiplier: 4 produces high res.
    // If we pass left/top/width/height to toDataURL, it crops that region.
    
    const toDataURLOptions: any = {
      format: 'png',
      multiplier: 4,
      quality: 1,
    };

    if (options?.crop) {
        toDataURLOptions.left = options.crop.left;
        toDataURLOptions.top = options.crop.top;
        toDataURLOptions.width = options.crop.width;
        toDataURLOptions.height = options.crop.height;
    }

    const dataURL = clonedCanvas.toDataURL(toDataURLOptions);

    // Step C: Convert to Blob
    const base64Data = dataURL.replace(/^data:image\/png;base64,/, '');
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });

    // Step D: Upload to Supabase
    const timestamp = Date.now();
    // Use a random suffix to avoid collision if multiple uploads happen fast (e.g. front/back)
    const suffix = Math.random().toString(36).substring(7);
    const filePath = `uploads/${userId}/${timestamp}_${suffix}_print_file.png`;

    const { data, error } = await supabase.storage
      .from('print-files')
      .upload(filePath, blob, {
        upsert: false,
        contentType: 'image/png',
      });

    if (error) {
      console.error('Error uploading print file:', error);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('print-files')
      .getPublicUrl(filePath);
    
    return publicUrl;
  } catch (error) {
    console.error('Error in exportDesignForProduction:', error);
    return null;
  }
};
