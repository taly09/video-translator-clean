import React from "react";
import { Link } from "react-router-dom";

export default function Logo() {
  return (
    <Link to="/" className="flex items-center p-4">
      <img
  src="/logo.png"
  alt="Logo"
  className="w-full max-w-[150px] h-auto mx-auto my-4"
/>

      {/* אם תרצה אפשר להוסיף טקסט ליד */}
      {/* <span className="ml-2 font-bold text-xl">Talkscribe</span> */}
    </Link>
  );
}
