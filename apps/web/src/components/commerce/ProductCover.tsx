import Image from "next/image";
import type { Brand, ProductType } from "@prisma/client";

interface ProductCoverProps {
  title: string;
  brand: Brand;
  productType: ProductType;
  imageUrl?: string | null;
  /** Aspect ratio class. Defaults to 4:3. */
  aspect?: "square" | "video" | "wide" | "cover" | "card";
  priority?: boolean;
  sizes?: string;
  className?: string;
}

const BRAND_THEME: Record<
  Brand,
  {
    /** Tailwind gradient classes (from-, via-, to-). */
    gradient: string;
    /** Accent color for shapes / glyphs (Tailwind text- color). */
    accent: string;
    /** Single-glyph mark to overlay (large background mark). */
    mark: string;
    /** Friendly short brand label. */
    label: string;
  }
> = {
  AnsiblePilot: {
    gradient: "from-rose-600 via-rose-500 to-orange-500",
    accent: "text-rose-100",
    mark: "A",
    label: "AnsiblePilot",
  },
  AnsibleByExample: {
    gradient: "from-red-700 via-red-500 to-amber-500",
    accent: "text-red-100",
    mark: "Aₓ",
    label: "Ansible by Example",
  },
  TerraformPilot: {
    gradient: "from-violet-700 via-purple-600 to-fuchsia-500",
    accent: "text-violet-100",
    mark: "T",
    label: "TerraformPilot",
  },
  KubernetesRecipes: {
    gradient: "from-sky-700 via-blue-600 to-indigo-600",
    accent: "text-sky-100",
    mark: "K",
    label: "Kubernetes Recipes",
  },
  CopyPasteLearn: {
    gradient: "from-emerald-700 via-teal-600 to-cyan-600",
    accent: "text-emerald-100",
    mark: "✦",
    label: "CopyPasteLearn",
  },
};

const ASPECT_CLASS: Record<NonNullable<ProductCoverProps["aspect"]>, string> = {
  square: "aspect-square",
  video: "aspect-video",
  wide: "aspect-[21/9]",
  cover: "aspect-[3/2]",
  card: "aspect-[4/3]",
};

const TYPE_LABEL: Record<ProductType, string> = {
  EBOOK: "Ebook",
  TEMPLATE: "Template",
  COURSE: "Course",
  BUNDLE: "Bundle",
};

/**
 * Premium "wow" cover for any product. If `imageUrl` is set we use it;
 * otherwise we render a brand-themed gradient with a large mark, the
 * product type, and the title — looks great at every aspect ratio.
 */
export function ProductCover({
  title,
  brand,
  productType,
  imageUrl,
  aspect = "card",
  priority = false,
  sizes = "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw",
  className,
}: ProductCoverProps) {
  const aspectClass = ASPECT_CLASS[aspect];
  const wrapper = `relative w-full overflow-hidden ${aspectClass} ${className ?? ""}`;

  if (imageUrl) {
    return (
      <div className={wrapper}>
        <Image
          src={imageUrl}
          alt=""
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover"
        />
      </div>
    );
  }

  const theme = BRAND_THEME[brand] ?? BRAND_THEME.CopyPasteLearn;
  const typeLabel = TYPE_LABEL[productType] ?? productType;

  return (
    <div
      className={`${wrapper} bg-gradient-to-br ${theme.gradient} text-white`}
      role="img"
      aria-label={`${typeLabel} — ${title}`}
    >
      {/* Diagonal grid pattern */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.18] mix-blend-overlay"
        style={{
          backgroundImage:
            "linear-gradient(135deg, transparent 49%, white 49%, white 51%, transparent 51%)",
          backgroundSize: "16px 16px",
        }}
      />
      {/* Soft radial highlight */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(60% 60% at 80% 0%, rgba(255,255,255,0.35), transparent 60%)",
        }}
      />
      {/* Background mark */}
      <div
        aria-hidden
        className={`pointer-events-none absolute -right-6 -bottom-12 select-none font-black leading-none ${theme.accent} opacity-30`}
        style={{ fontSize: "min(70cqw, 22rem)", containerType: "inline-size" }}
      >
        {theme.mark}
      </div>

      {/* Foreground content */}
      <div className="relative z-10 flex h-full w-full flex-col justify-between p-5 lg:p-7">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/85">
          <span className="rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">
            {typeLabel}
          </span>
          <span className="rounded-full border border-white/30 px-2.5 py-1 backdrop-blur">
            {theme.label}
          </span>
        </div>
        <h3 className="text-balance text-lg font-bold leading-tight drop-shadow-sm sm:text-xl lg:text-2xl">
          {title}
        </h3>
      </div>
    </div>
  );
}
