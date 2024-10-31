"use client";

import Image from "next/image";
import { memo } from "react";

import { navElements } from "@/constants";
import { ActiveElement, NavbarProps } from "@/types/type";

import { Button } from "./ui/button";


const Navbar = ({ activeElement, imageInputRef, handleImageUpload, handleActiveElement }: NavbarProps) => {
  const isActive = (value: string | any[]) => activeElement?.value === value;

  return (
    <>
      <nav className="flex select-none items-center justify-between gap-4 bg-primary-black px-5 text-white">
    
        <ul className="flex flex-row">
          {navElements.map((item) => (
            <li
              key={item.name}
              onClick={() => {
                if (typeof item.value === 'string') {
                  handleActiveElement(item as ActiveElement);
                }
              }}
              className={`group px-2.5 py-5 flex justify-center items-center
              ${isActive(item.value) ? "bg-primary-green" : "hover:bg-primary-grey-200"}
              `}
            >
                <Button className="relative w-5 h-5 object-contain">
                  <Image
                  src={item.icon}
                  alt={item.name}
                  fill
                  className={isActive(item.value) ? "invert" : ""}
                />
              </Button>
            </li>
          ))}
        </ul>
      </nav>
      <input
        type="file"
        className="hidden"
        ref={imageInputRef}
        accept="image/*"
        onChange={handleImageUpload}
      />
      
    </>)
};

export default memo(Navbar, (prevProps, nextProps) => prevProps.activeElement === nextProps.activeElement);
