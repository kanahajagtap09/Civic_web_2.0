// FloatingButton.jsx
import React, { useState } from "react";
import PostCreatorModal from "./components/PostCreatorModal";

export default function FloatingButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
     <button
  className="hidden min-[699px]:flex fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white text-3xl w-[60px] h-[60px] rounded-full shadow-lg items-center justify-center"
  onClick={() => setIsOpen(true)}
>
  +
</button>

      <PostCreatorModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}