"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import toast from "react-hot-toast";

import { fileService } from "@/services/file.service";
import { resolveImageUrl } from "@/utils/product";
import { extractErrorMessage } from "@/utils/errors";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
}

/** Drag-and-drop загрузка картинок товара — грузит файлы на /files и складывает URL. */
export function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  async function uploadFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const uploaded = await fileService.upload(files);
      onChange([...images, ...uploaded.map((file) => file.url)]);
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setIsUploading(false);
    }
  }

  function removeImage(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-2">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((src, index) => {
            const url = resolveImageUrl(src);
            return (
              <div
                key={src + index}
                className="border-gold-200/50 group relative size-16 shrink-0 overflow-hidden rounded-lg border"
              >
                {url && (
                  // Превью только что загруженного файла в форме админки —
                  // next/image тут ни к чему, оптимизация не нужна.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt="" className="size-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  aria-label="Удалить изображение"
                  className="absolute top-0.5 right-0.5 flex size-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="size-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          uploadFiles(e.dataTransfer.files);
        }}
        disabled={isUploading}
        className={cn(
          "flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed py-4 text-xs transition-colors disabled:opacity-60",
          isDragging
            ? "border-primary bg-primary/5 text-primary"
            : "border-gold-200/50 text-muted-foreground hover:border-gold-300/70",
        )}
      >
        {isUploading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Загружаем…
          </>
        ) : (
          <>
            <ImagePlus className="size-4" />
            Перетащите фото или нажмите, чтобы выбрать
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) uploadFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
