"use client";

import type { AdvancedCellLabel } from "@/modules/quiz/lib/crossword-advanced-grid";
import {
  backgroundPositionPercent,
  flatToRC,
} from "@/modules/quiz/lib/crossword-advanced-grid";

export type CrosswordAdvancedImageGridProps = {
  imageUrl: string;
  title: string;
  R: number;
  C: number;
  cells: AdvancedCellLabel[];
  /** `order` câu (1…N) đã mở tile */
  revealedByOrder: Record<number, boolean>;
  /** Đủ điều kiện lộ toàn lưới gồm ô đệm: thắng từ khóa / đã giải global / đã trả lời đúng cả N câu hàng ngang */
  forceRevealAll: boolean;
};

function tileBackgroundStyle(imageUrl: string, pos: { x: string; y: string }, R: number, C: number) {
  const safe = imageUrl.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return {
    backgroundImage: `url("${safe}")`,
    backgroundSize: `${C * 100}% ${R * 100}%`,
    backgroundPosition: `${pos.x} ${pos.y}`,
  } as const;
}

export default function CrosswordAdvancedImageGrid({
  imageUrl,
  title,
  R,
  C,
  cells,
  revealedByOrder,
  forceRevealAll,
}: CrosswordAdvancedImageGridProps) {
  return (
    <div
      className="relative w-full max-w-3xl mx-auto aspect-video rounded-lg overflow-hidden border border-gray-200 bg-black/5"
      data-testid="advanced-image-grid"
    >
      <div
        className="grid h-full w-full"
        style={{
          gridTemplateColumns: `repeat(${C}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${R}, minmax(0, 1fr))`,
        }}
      >
        {cells.map((cell) => {
          const { r, c } = flatToRC(cell.flatIndex, C);
          const pos = backgroundPositionPercent(r, c, R, C);
          const label = cell.label;
          const revealed =
            forceRevealAll ||
            (label != null && Boolean(revealedByOrder[label]));

          if (label == null) {
            return (
              <div
                key={cell.flatIndex}
                className={`relative min-h-[2rem] overflow-hidden border ${
                  revealed ? "border-white/20" : "border-slate-300/80 bg-slate-200"
                }`}
                data-testid={`advanced-pad-${cell.flatIndex}`}
                data-state={revealed ? "revealed" : "covered"}
                aria-label={revealed ? "Ô đệm — đã lộ mảnh ảnh" : "Ô đệm"}
              >
                {revealed ? (
                  <div
                    className="absolute inset-0 bg-no-repeat"
                    style={tileBackgroundStyle(imageUrl, pos, R, C)}
                    role="img"
                    aria-hidden={false}
                  />
                ) : (
                  <>
                    <div
                      className="absolute inset-0 bg-slate-200 [background-image:repeating-linear-gradient(135deg,transparent,transparent_7px,rgba(148,163,184,0.28)_7px,rgba(148,163,184,0.28)_8px)]"
                      aria-hidden
                    />
                    <span className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-0.5 px-1.5 text-center text-[11px] font-medium leading-snug text-slate-600">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Ô đệm
                      </span>
                      <span>Mở khi xong các câu hoặc đúng từ khóa</span>
                    </span>
                  </>
                )}
              </div>
            );
          }

          return (
            <div
              key={cell.flatIndex}
              className="relative min-h-[2rem] border border-white/20 overflow-hidden"
              data-testid={`advanced-cell-${label}`}
              data-state={revealed ? "revealed" : "covered"}
              aria-label={`Ô gợi ý số ${label}`}
            >
              {revealed ? (
                <div
                  className="absolute inset-0 bg-no-repeat"
                  style={tileBackgroundStyle(imageUrl, pos, R, C)}
                  role="img"
                  aria-hidden={false}
                />
              ) : (
                <>
                  <div className="absolute inset-0 bg-zinc-900" aria-hidden />
                  <span className="absolute inset-0 z-10 flex items-center justify-center text-lg font-bold text-white tabular-nums">
                    {label}
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>
      <span className="sr-only">{title} — lưới gợi ý ảnh</span>
    </div>
  );
}
