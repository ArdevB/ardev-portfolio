/** Two stacked copies that roll vertically on hover of the closest .group. */
export function TextRoll({ children, className = "" }: { children: string; className?: string }) {
  return (
    <span className={`text-roll ${className}`}>
      <span>{children}</span>
      <span aria-hidden="true">{children}</span>
    </span>
  );
}
