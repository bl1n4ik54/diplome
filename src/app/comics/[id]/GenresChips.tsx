"use client";

import { useMemo, useState } from "react";

export default function GenresChips({ genres }: { genres: string[] }) {
  const [open, setOpen] = useState(false);

  const max = 8;
  const shown = useMemo(() => (open ? genres : genres.slice(0, max)), [open, genres]);
  const rest = Math.max(0, genres.length - max);

  if (genres.length === 0) return null;

  return (
    <div className="mw-genreChips">
      {shown.map((g) => (
        <span key={g} className="mw-badge">
          {g}
        </span>
      ))}

      {!open && rest > 0 ? (
        <button type="button" className="mw-badge mw-chipButton" onClick={() => setOpen(true)}>
          + ещё ({rest})
        </button>
      ) : null}

      {open && rest > 0 ? (
        <button type="button" className="mw-badge mw-chipButton" onClick={() => setOpen(false)}>
          свернуть
        </button>
      ) : null}
    </div>
  );
}
