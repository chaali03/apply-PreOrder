"use client";

import React from "react";
import { Home, UtensilsCrossed, Truck, MapPin, User } from "lucide-react";

const CurvedMenu = () => {
  const menuItems = [
    { icon: Home, label: "Home", href: "#" },
    { icon: UtensilsCrossed, label: "Menu", href: "#" },
    { icon: Truck, label: "Kurir", href: "#" },
    { icon: MapPin, label: "Location", href: "#" },
    { icon: User, label: "Login", href: "#" },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[9500]">
      <div className="relative bg-white border-t-[3px] border-black">
        <nav className="flex justify-around items-center h-16 px-4">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <a
                key={index}
                href={item.href}
                className="flex flex-col items-center justify-center gap-1 text-black hover:text-[var(--primary)] transition-colors"
              >
                <Icon size={20} strokeWidth={2.5} />
                <span className="text-[10px] font-bold uppercase">{item.label}</span>
              </a>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default CurvedMenu;
