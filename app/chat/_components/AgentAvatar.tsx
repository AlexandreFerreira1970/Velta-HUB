import Image from "next/image";

export function AgentAvatar() {
  return (
    <div className="shrink-0 w-16 h-16 rounded-full flex items-center justify-center">
      <Image
        src="/veltinha-icon.webp"
        alt="Velta"
        width={65}
        height={65}
        unoptimized
        className="w-14 h-14 rounded-full object-cover"
      />
    </div>
  );
}
