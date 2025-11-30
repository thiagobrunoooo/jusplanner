import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "../../lib/utils";

const SidebarContext = createContext(undefined);

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error("useSidebar deve ser usado dentro de um SidebarProvider");
    }
    return context;
};

export const SidebarProvider = ({
    children,
    open: openProp,
    setOpen: setOpenProp,
    animate = true,
}) => {
    const [openState, setOpenState] = useState(false);
    const open = openProp !== undefined ? openProp : openState;
    const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

    return (
        <SidebarContext.Provider value={{ open, setOpen, animate }}>
            {children}
        </SidebarContext.Provider>
    );
};

export const Sidebar = ({
    children,
    open,
    setOpen,
    animate,
}) => {
    return (
        <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
            {children}
        </SidebarProvider>
    );
};

export const SidebarBody = (props) => {
    return (
        <>
            <DesktopSidebar {...props} />
            <MobileSidebar {...props} />
        </>
    );
};

export const DesktopSidebar = ({
    className,
    children,
    ...props
}) => {
    const { open, setOpen, animate } = useSidebar();
    return (
        <motion.div
            className={cn(
                "h-screen px-3 py-6 hidden md:flex md:flex-col glass-sidebar w-[280px] flex-shrink-0",
                className
            )}
            animate={{
                width: animate ? (open ? "280px" : "80px") : "280px",
            }}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export const MobileSidebar = ({
    className,
    children,
    ...props
}) => {
    const { open, setOpen } = useSidebar();
    return (
        <>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ x: "-100%", opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: "-100%", opacity: 0 }}
                        transition={{
                            duration: 0.3,
                            ease: "easeInOut",
                        }}
                        className={cn(
                            "fixed h-full w-full inset-0 glass-sidebar p-10 z-[100] flex flex-col justify-between md:hidden",
                            className
                        )}
                    >
                        <div
                            className="absolute right-10 top-10 z-50 text-slate-800 dark:text-slate-200 cursor-pointer"
                            onClick={() => setOpen(!open)}
                        >
                            <X />
                        </div>
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export const SidebarLink = ({
    link,
    className,
    onClick,
    active,
    ...props
}) => {
    const { open, animate } = useSidebar();
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center justify-start gap-3 group/sidebar py-3 px-3 rounded-xl w-full text-left transition-all duration-200",
                active
                    ? "bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold backdrop-blur-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100",
                className
            )}
            {...props}
        >
            {React.cloneElement(link.icon, {
                className: cn(
                    "h-5 w-5 flex-shrink-0 transition-colors",
                    active ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500 group-hover/sidebar:text-slate-700 dark:group-hover/sidebar:text-slate-300"
                )
            })}
            <motion.span
                animate={{
                    display: animate ? (open ? "inline-block" : "none") : "inline-block",
                    opacity: animate ? (open ? 1 : 0) : 1,
                }}
                className={cn(
                    "text-sm font-medium group-hover/sidebar:translate-x-0.5 transition duration-150 whitespace-pre inline-block !p-0 !m-0",
                    active ? "text-blue-700 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"
                )}
            >
                {link.label}
            </motion.span>
        </button>
    );
};
