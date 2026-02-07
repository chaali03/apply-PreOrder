"use client";
import React, {useState, useEffect} from "react";

import {motion, AnimatePresence} from "framer-motion";
import Link from "next/link";

interface iNavItem {
	heading: string;
	href: string;
	subheading?: string;
	imgSrc?: string;
}

interface iNavLinkProps extends iNavItem {
	setIsActive: (isActive: boolean) => void;
	index: number;
}

interface iCurvedNavbarProps {
	setIsActive: (isActive: boolean) => void;
	navItems: iNavItem[];
}

interface iHeaderProps {
	navItems?: iNavItem[];
}

const defaultNavItems: iNavItem[] = [
	{
		heading: "Home",
		href: "/",
		subheading: "Welcome to our website",
		imgSrc: "/images/home.jpg",
	},
	{
		heading: "Menu Check",
		href: "/menu",
		subheading: "View our menu",
		imgSrc: "/images/menu.jpg",
	},
	{
		heading: "Kurir",
		href: "/kurir",
		subheading: "Delivery service",
		imgSrc: "/images/delivery.jpg",
	},
	{
		heading: "Locations",
		href: "/locations",
		subheading: "Find our stores",
		imgSrc: "/images/locations.jpg",
	},
];

// Smooth easing functions
const SMOOTH_EASE = [0.76, 0, 0.24, 1] as const; // Smooth cubic bezier

const MENU_SLIDE_ANIMATION = {
	initial: { x: "100%" },
	enter: { 
		x: "0", 
		transition: { 
			duration: 0.5, 
			ease: SMOOTH_EASE 
		}
	},
	exit: { 
		x: "100%", 
		transition: { 
			duration: 0.4, 
			ease: SMOOTH_EASE 
		}
	},
};

const NavLink: React.FC<iNavLinkProps> = ({
	heading,
	href,
	subheading,
	setIsActive,
	index,
}) => {
	const handleClick = () => {
		setIsActive(false);
	};

	return (
		<div
			onClick={handleClick}
			className="group relative flex flex-col border-b border-black/10 py-5 cursor-pointer mb-2"
		>
			<Link href={href}>
				<div className="relative flex items-start">
					<span className="text-black text-2xl font-thin mr-4 md:text-3xl">
						{index}.
					</span>
					<div className="flex flex-col gap-1">
						<span className="text-2xl font-medium text-black md:text-3xl uppercase">
							{heading}
						</span>
						{subheading && (
							<p className="text-sm font-normal text-gray-500 mt-1 normal-case">
								{subheading}
							</p>
						)}
					</div>
				</div>
			</Link>
		</div>
	);
};

const Curve: React.FC = () => {
	return null;
};

const CurvedNavbar: React.FC<iCurvedNavbarProps> = ({setIsActive, navItems}) => {
	return (
		<motion.div
			variants={MENU_SLIDE_ANIMATION}
			initial="initial"
			animate="enter"
			exit="exit"
			className="fixed inset-0 z-40 bg-white"
		>
			<div className="h-full flex flex-col">
				{/* Header Menu */}
				<div className="px-8 pt-16 pb-4">
					<div className="text-black border-b border-black/10 pb-2">
						<p className="text-xl font-bold tracking-wider">SCAFF*FOOD MENU</p>
					</div>
				</div>
				
				{/* Navigation Items */}
				<section className="flex-1 overflow-y-auto px-8">
					<div className="space-y-1">
						{navItems.map((item, index) => {
							return (
								<NavLink
									key={item.href}
									{...item}
									setIsActive={setIsActive}
									index={index + 1}
								/>
							);
						})}
					</div>
					
					{/* Login Admin Button - Right after Locations */}
					<div className="mt-12 pt-4">
						<button
							className="btn-cta"
							onClick={() => setIsActive(false)}
						>
							LOGIN ADMIN
						</button>
					</div>
				</section>
			</div>
		</motion.div>
	);
};

const Header: React.FC<iHeaderProps> = ({
	navItems = defaultNavItems,
}) => {
	const [isActive, setIsActive] = useState(false);

	const handleClick = () => {
		setIsActive(!isActive);
	};

	return (
		<>
			{/* Hamburger Menu Button - Mobile Only */}
			<div className="relative z-50 md:hidden">
				<button
					onClick={handleClick}
					className="fixed right-5 top-5 z-50 w-12 h-12 rounded-full flex items-center justify-center cursor-pointer bg-black hover:bg-gray-800 transition-colors"
					aria-label={isActive ? "Close menu" : "Open menu"}
				>
					<div className="relative w-6 h-5 flex flex-col justify-center items-center">
						<span
							className={`absolute block h-0.5 w-6 bg-white rounded-full transition-all duration-300 ease-out ${
								isActive ? "rotate-45 top-1/2 -translate-y-1/2" : "top-0"
							}`}
						></span>
						<span
							className={`absolute block h-0.5 bg-white rounded-full transition-all duration-300 ease-out top-1/2 -translate-y-1/2 ${
								isActive ? "w-0 opacity-0" : "w-6 opacity-100"
							}`}
						></span>
						<span
							className={`absolute block h-0.5 w-6 bg-white rounded-full transition-all duration-300 ease-out ${
								isActive ? "-rotate-45 top-1/2 -translate-y-1/2" : "bottom-0"
							}`}
						></span>
					</div>
				</button>
			</div>

			<AnimatePresence mode="wait">
				{isActive && (
					<CurvedNavbar setIsActive={setIsActive} navItems={navItems} />
				)}
			</AnimatePresence>
		</>
	);
};

export default Header;