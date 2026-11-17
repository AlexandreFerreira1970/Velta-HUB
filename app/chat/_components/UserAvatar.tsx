interface UserAvatarProps {
  image?: string | null;
  name?: string | null;
}

export function UserAvatar({ image, name }: UserAvatarProps) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name ?? "Usuário"}
        className="shrink-0 w-8 h-8 rounded-full object-cover"
        referrerPolicy="no-referrer"
      />
    );
  }

  const initial = name ? name[0].toUpperCase() : "U";
  return (
    <div
      className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
      style={{ background: "var(--steel-soft)", color: "var(--ink-secondary)" }}
    >
      <span style={{ fontSize: 13, fontWeight: 600 }}>{initial}</span>
    </div>
  );
}
