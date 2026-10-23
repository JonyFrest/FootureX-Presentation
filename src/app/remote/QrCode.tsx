import { useMemo } from 'react';
import { encodeQr, qrPath } from './qr';

/** QR-код в SVG: тёмные модули на белом поле с тихой зоной 4 модуля (так его читает любая камера). */
export function QrCode({ value, size, label }: { value: string; size: number | string; label: string }) {
  const qr = useMemo(() => encodeQr(value), [value]);
  const box = qr.size + 8;
  return (
    <svg
      viewBox={`0 0 ${box} ${box}`}
      width={size}
      height={size}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
      className="block rounded-[var(--radius-sm)]"
      data-qr={value}
    >
      <rect width={box} height={box} fill="#fff" />
      <path d={qrPath(qr)} fill="#070a12" />
    </svg>
  );
}
