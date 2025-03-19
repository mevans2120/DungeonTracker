import { HTMLAttributes } from "react";
import crossedSwords from "../../assets/crossed-swords.png";

interface Props extends HTMLAttributes<HTMLImageElement> {
  className?: string;
}

export function CrossedSwordsIcon({ className, ...props }: Props) {
  return (
    <img
      src={crossedSwords}
      alt="Crossed Swords"
      className={className}
      {...props}
    />
  );
}