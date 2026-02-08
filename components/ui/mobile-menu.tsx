"use client";
import React, {useState, useEffect} from "react";

import {motion, AnimatePresence} from "framer-motion";
import Link from "next/link";
import "./mobile-menu.css";

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
		subheading: "Selamat Datang ",
		imgSrc: "/images/home.jpg",
	},
	{
		heading: "Menu",
		href: "/menu",
		subheading: "Lihat Menu",
		imgSrc: "/images/menu.jpg",
	},
	{
		heading: "Kurir",
		href: "/kurir",
		subheading: "Pelayanan Pengantar",
		imgSrc: "/images/delivery.jpg",
	},
	{
		heading: "Locations",
		href: "/locations",
		subheading: "Temukan Toko",
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
			className="nav-link-item"
		>
			<Link href={href}>
				<div className="nav-link-content">
					<span className="nav-link-index">
						{index}.
					</span>
					<div className="nav-link-text">
						<span className="nav-link-heading">
							{heading}
						</span>
						{subheading && (
							<p className="nav-link-subheading">
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
			className="mobile-menu-container"
		>
			<div className="mobile-menu-wrapper">
				{/* Header Menu */}
				<div className="mobile-menu-header">
					<div className="mobile-menu-title-wrapper">
						<p className="mobile-menu-title">SCAFF*FOOD MENU</p>
					</div>
				</div>
				
				{/* Navigation Items */}
				<section className="mobile-menu-nav">
					<div className="mobile-menu-nav-list">
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
					<div className="mobile-menu-login">
						<Link href="/login">
							<button
								className="mobile-menu-login-btn"
								onClick={() => setIsActive(false)}
							>
								LOGIN ADMIN
							</button>
						</Link>
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
			<div className="hamburger-wrapper">
				<button
					onClick={handleClick}
					className="hamburger-button"
					aria-label={isActive ? "Close menu" : "Open menu"}
				>
					<div className="hamburger-icon">
						<span
							className={`hamburger-line ${
								isActive ? "hamburger-line-top-active" : "hamburger-line-top"
							}`}
						></span>
						<span
							className={`hamburger-line hamburger-line-middle ${
								isActive ? "hamburger-line-middle-active" : ""
							}`}
						></span>
						<span
							className={`hamburger-line ${
								isActive ? "hamburger-line-bottom-active" : "hamburger-line-bottom"
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