export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-IN").format(price);
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
