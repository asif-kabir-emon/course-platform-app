"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { apiClient } from "@/service/api-client";
import { authKey } from "@/constants/AuthKey.constant";
import { notifyClientSessionChanged } from "@/lib/clientSession";
import Cookies from "js-cookie";
import { Camera, ImagePlus, Move, RotateCcw, Upload, ZoomIn } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type ImageSize = { width: number; height: number };

export default function ProfileAvatarEditor({ imageUrl, name, size = "large" }: { imageUrl?: string | null; name: string; size?: "large" | "medium" }) {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<string>();
  const [fileName, setFileName] = useState("");
  const [natural, setNatural] = useState<ImageSize>({ width: 1, height: 1 });
  const [cropSize, setCropSize] = useState(340);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [uploading, setUploading] = useState(false);
  const cropRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; originX: number; originY: number } | undefined>(undefined);

  useEffect(() => {
    const crop = cropRef.current;
    if (!crop) return;
    const observer = new ResizeObserver(([entry]) => setCropSize(entry.contentRect.width));
    observer.observe(crop);
    return () => observer.disconnect();
  }, [source]);

  useEffect(() => () => { if (source) URL.revokeObjectURL(source); }, [source]);

  const display = useMemo(() => {
    const aspect = natural.width / natural.height;
    const baseWidth = aspect >= 1 ? cropSize * aspect : cropSize;
    const baseHeight = aspect >= 1 ? cropSize : cropSize / aspect;
    return { width: baseWidth * zoom, height: baseHeight * zoom };
  }, [cropSize, natural, zoom]);

  const clampOffset = (next: { x: number; y: number }) => ({
    x: Math.max(-(display.width - cropSize) / 2, Math.min((display.width - cropSize) / 2, next.x)),
    y: Math.max(-(display.height - cropSize) / 2, Math.min((display.height - cropSize) / 2, next.y)),
  });

  const chooseFile = (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return toast.error("Choose a JPG, PNG, or WebP image.");
    if (file.size > 10 * 1024 * 1024) return toast.error("Choose an image smaller than 10 MB.");
    if (source) URL.revokeObjectURL(source);
    setSource(URL.createObjectURL(file)); setFileName(file.name); setNatural({ width: 1, height: 1 }); setZoom(1); setOffset({ x: 0, y: 0 });
  };

  const resetCrop = () => { setZoom(1); setOffset({ x: 0, y: 0 }); };

  const uploadCrop = async () => {
    if (!source) return;
    setUploading(true);
    try {
      const image = new Image(); image.src = source; await image.decode();
      const sourcePerDisplayPixel = natural.width / display.width;
      const sourceSize = cropSize * sourcePerDisplayPixel;
      const left = (cropSize - display.width) / 2 + offset.x;
      const top = (cropSize - display.height) / 2 + offset.y;
      const canvas = document.createElement("canvas"); canvas.width = 512; canvas.height = 512;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Image cropping is unavailable.");
      context.drawImage(image, -left * sourcePerDisplayPixel, -top * sourcePerDisplayPixel, sourceSize, sourceSize, 0, 0, 512, 512);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Could not prepare the cropped image.")), "image/jpeg", 0.9));
      const body = new FormData(); body.append("avatar", blob, "profile-avatar.jpg");
      const result = await apiClient("/profile/avatar", { method: "POST", body });
      if (!result.success) throw new Error(result.message);
      Cookies.set(authKey, result.data.accessToken, { path: "/", secure: true, sameSite: "strict", expires: 28 });
      notifyClientSessionChanged(); toast.success(result.message); setOpen(false); window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update your profile photo.");
      setUploading(false);
    }
  };

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild>
      <button type="button" className="group relative rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25" aria-label="Change profile photo">
        <Avatar className={size === "large" ? "size-32 border-4 border-background shadow-xl sm:size-36" : "size-24 border-4 border-background shadow-lg"}>
          <AvatarImage src={imageUrl || ""} className="object-cover" />
          <AvatarFallback className="bg-gradient-to-br from-primary to-violet-500 text-4xl font-bold text-white">{name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className="absolute bottom-1 right-1 flex size-10 items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-lg transition-transform group-hover:scale-110"><Camera className="size-4" /></span>
      </button>
    </DialogTrigger>
    <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto p-0">
      <div className="border-b bg-gradient-to-r from-primary/[0.12] to-violet-500/[0.08] p-6"><DialogHeader><DialogTitle className="text-2xl">Crop your profile photo</DialogTitle><DialogDescription>The saved image will be a sharp 512 × 512 square. Drag to position and use the slider to zoom.</DialogDescription></DialogHeader></div>
      <div className="p-6">
        {!source ? <label className="flex min-h-80 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-primary/25 bg-primary/[0.03] p-8 text-center transition-colors hover:bg-primary/[0.07]"><span className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"><ImagePlus className="size-8" /></span><span className="mt-5 text-lg font-semibold">Choose a photo</span><span className="mt-1 max-w-sm text-sm text-muted-foreground">JPG, PNG, or WebP up to 10 MB. Large images are cropped locally before upload.</span><input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => chooseFile(event.target.files?.[0])} /></label> : <div className="space-y-5"><div ref={cropRef} className="relative mx-auto size-[280px] touch-none cursor-move overflow-hidden rounded-full bg-slate-950 shadow-inner sm:size-[340px]" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); dragRef.current = { x: event.clientX, y: event.clientY, originX: offset.x, originY: offset.y }; }} onPointerMove={(event) => { const drag = dragRef.current; if (!drag) return; setOffset(clampOffset({ x: drag.originX + event.clientX - drag.x, y: drag.originY + event.clientY - drag.y })); }} onPointerUp={() => { dragRef.current = undefined; }} onPointerCancel={() => { dragRef.current = undefined; }}>
          {/* A native image is required here because the source is a local object URL used by the crop canvas. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={source} alt="Crop preview" draggable={false} onLoad={(event) => setNatural({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none" style={{ width: display.width, height: display.height, transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)` }} />
          <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/30" />
        </div><div className="mx-auto max-w-md space-y-4"><div className="flex items-center gap-3"><ZoomIn className="size-4 text-muted-foreground" /><input aria-label="Photo zoom" type="range" min="1" max="3" step="0.01" value={zoom} onChange={(event) => { setZoom(Number(event.target.value)); setOffset({ x: 0, y: 0 }); }} className="h-2 w-full cursor-pointer accent-primary" /><span className="w-10 text-right text-xs font-medium text-muted-foreground">{Math.round(zoom * 100)}%</span></div><div className="flex items-center justify-between gap-3 text-xs text-muted-foreground"><span className="flex min-w-0 items-center gap-1.5"><Move className="size-3.5" /><span className="truncate">{fileName}</span></span><Button type="button" size="sm" variant="ghost" onClick={resetCrop}><RotateCcw className="size-3.5" /> Reset</Button></div></div></div>}
      </div>
      <DialogFooter className="border-t bg-muted/20 p-5 sm:px-6">{source && <label className="mr-auto inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-primary/20 bg-background px-4 text-sm font-semibold text-primary hover:bg-primary/5"><ImagePlus className="size-4" /> Choose another<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => chooseFile(event.target.files?.[0])} /></label>}<Button onClick={uploadCrop} disabled={!source || natural.width <= 1 || uploading}><Upload className="size-4" /> {uploading ? "Uploading…" : "Crop & save"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
