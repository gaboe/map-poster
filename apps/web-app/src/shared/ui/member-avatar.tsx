import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/shared/ui/avatar";

function getInitials(name: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function MemberAvatar({
  name,
  image,
  className,
}: {
  name: string;
  image?: string | null;
  className?: string;
}) {
  return (
    <Avatar {...(className !== undefined && { className })}>
      {image ? (
        <AvatarImage src={image} alt={name} />
      ) : null}
      <AvatarFallback>{getInitials(name)}</AvatarFallback>
    </Avatar>
  );
}
