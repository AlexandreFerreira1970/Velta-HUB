import Link from "next/link";
import { Text } from "@/components/ui";

interface NavLabelProps {
  label: string;
  active: boolean;
  href: string;
  onClick?: () => void;
}

export function NavLabel({ label, active, href, onClick }: NavLabelProps) {
  if (active) {
    return (
      <Text variant="body-sm" color="secondary">
        {label}
      </Text>
    );
  }
  return (
    <Link href={href} onClick={onClick} style={{ textDecoration: "none" }}>
      <Text variant="body-sm" color="tertiary">
        {label}
      </Text>
    </Link>
  );
}
