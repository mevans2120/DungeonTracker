import { SVGProps } from "react";

export function D20Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2L3 8.5v7L12 22l9-6.5v-7L12 2z" />
      <path d="M12 22v-8" />
      <path d="M12 2v4" />
      <path d="M3 8.5l9 5.5" />
      <path d="M21 8.5l-9 5.5" />
    </svg>
  );
}
