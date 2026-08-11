export function BrandLogo({
  size = 42,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <img
      src="/images/brand/logo.png"
      alt=""
      width={size}
      height={size}
      className={`brand-logo ${className}`.trim()}
      aria-hidden="true"
    />
  );
}
