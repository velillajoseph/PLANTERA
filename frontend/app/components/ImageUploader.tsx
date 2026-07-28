'use client';

import { useEffect, useRef, useState, type DragEvent } from 'react';
import { useLang } from '../lib/i18n';
import { resolveImageUrl } from '../lib/catalog';

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.85;
const MAX_SOURCE_BYTES = 15 * 1024 * 1024; // guard before we even decode
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

const COPY = {
  es: {
    label: 'Foto de la planta',
    dropHere: 'Suelta la foto aquí',
    prompt: 'Arrastra una foto o',
    browse: 'búscala en tu dispositivo',
    hint: 'JPG, PNG o WEBP · La optimizamos automáticamente',
    replace: 'Cambiar foto',
    remove: 'Quitar',
    processing: 'Preparando foto…',
    errType: 'Ese archivo no es una imagen válida (usa JPG, PNG o WEBP).',
    errSize: 'La imagen es demasiado grande. Intenta con otra foto.',
    errProcess: 'No pudimos procesar esa foto. Intenta con otra.',
    preview: 'Vista previa de la foto',
  },
  en: {
    label: 'Plant photo',
    dropHere: 'Drop the photo here',
    prompt: 'Drag a photo or',
    browse: 'browse your device',
    hint: 'JPG, PNG or WEBP · We optimize it automatically',
    replace: 'Change photo',
    remove: 'Remove',
    processing: 'Preparing photo…',
    errType: 'That file is not a valid image (use JPG, PNG or WEBP).',
    errSize: 'That image is too large. Try a different photo.',
    errProcess: 'We could not process that photo. Try another one.',
    preview: 'Photo preview',
  },
};

/**
 * Shrinks a phone photo in the browser before it ever hits the network.
 * Vivero owners shoot 5–8MB images; uploading those raw over mobile data is
 * the difference between a two-second save and a stalled form.
 */
async function downscale(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('no_canvas_context');
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
  );
  if (!blob) throw new Error('encode_failed');

  return new File([blob], 'photo.jpg', { type: 'image/jpeg' });
}

export default function ImageUploader({
  currentUrl,
  onFileSelected,
  onRemove,
  disabled = false,
}: {
  /** Existing stored image (absolute URL or /uploads path), if any. */
  currentUrl?: string | null;
  /** Receives the processed, upload-ready file — or null when cleared. */
  onFileSelected: (file: File | null) => void;
  onRemove?: () => void;
  disabled?: boolean;
}) {
  const { lang } = useLang();
  const copy = COPY[lang];

  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<'errType' | 'errSize' | 'errProcess' | null>(
    null,
  );

  // Object URLs must be released or the tab leaks memory across edits.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);

    if (!ACCEPTED.includes(file.type) && !file.type.startsWith('image/')) {
      setError('errType');
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      setError('errSize');
      return;
    }

    setProcessing(true);
    try {
      const processed = await downscale(file);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(URL.createObjectURL(processed));
      onFileSelected(processed);
    } catch {
      setError('errProcess');
      onFileSelected(null);
    } finally {
      setProcessing(false);
    }
  };

  const clear = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setError(null);
    onFileSelected(null);
    if (inputRef.current) inputRef.current.value = '';
    onRemove?.();
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    void handleFile(event.dataTransfer.files?.[0]);
  };

  const shown = preview ?? resolveImageUrl(currentUrl ?? null);

  return (
    <div style={{ display: 'grid', gap: '0.5rem' }}>
      <span className="field" style={{ gap: 0 }}>
        {copy.label}
      </span>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />

      {shown ? (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span
            className="thumb"
            style={{ width: 110, height: 110, borderRadius: '14px' }}
          >
            <img src={shown} alt={copy.preview} />
          </span>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn--ghost btn--small"
              disabled={disabled || processing}
              onClick={() => inputRef.current?.click()}
            >
              {processing ? copy.processing : copy.replace}
            </button>
            <button
              type="button"
              className="btn btn--danger btn--small"
              disabled={disabled || processing}
              onClick={clear}
            >
              {copy.remove}
            </button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          style={{
            display: 'grid',
            placeItems: 'center',
            gap: '0.35rem',
            padding: '1.75rem 1rem',
            textAlign: 'center',
            borderRadius: '14px',
            border: `1.5px dashed ${dragging ? 'var(--green-700)' : 'var(--line)'}`,
            background: dragging ? 'rgba(44,74,56,0.05)' : 'var(--surface)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
            transition: 'border-color .18s ease, background .18s ease',
          }}
        >
          <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>
            {processing
              ? copy.processing
              : dragging
                ? copy.dropHere
                : copy.prompt}
          </span>
          {!processing && !dragging && (
            <span
              style={{
                fontSize: '0.9rem',
                color: 'var(--green-700)',
                fontWeight: 600,
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
              }}
            >
              {copy.browse}
            </span>
          )}
          <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
            {copy.hint}
          </span>
        </div>
      )}

      {error && (
        <p style={{ color: '#9c4a3c', fontSize: '0.85rem', fontWeight: 600 }}>
          {copy[error]}
        </p>
      )}
    </div>
  );
}
