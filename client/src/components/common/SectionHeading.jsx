export function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="space-y-2">
      <p className="display-font text-sm font-semibold uppercase tracking-[0.3em] text-moss">
        {eyebrow}
      </p>
      <div className="space-y-3">
        <h2 className="display-font text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {title}
        </h2>
        {description ? (
          <p className="max-w-3xl text-base leading-7 text-slate-600">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
