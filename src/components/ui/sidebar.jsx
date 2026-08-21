import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, ChevronLeft, ChevronRight } from "lucide-react";
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
    const [openState, setOpenState] = useState(true); // Inicia expandida
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

    const toggleSidebar = () => {
        setOpen(!open);
    };

    return (
        <motion.div
            className={cn(
                "h-screen px-3 py-5 hidden md:flex md:flex-col glass-sidebar flex-shrink-0 relative border-r border-slate-200/80 dark:border-slate-800/80 transition-colors",
                className
            )}
            animate={{
                width: animate ? (open ? "260px" : "72px") : "260px",
            }}
            transition={{
                type: "spring",
                stiffness: 350,
                damping: 32,
                mass: 0.8,
            }}
            style={{ willChange: "width" }}
            {...props}
        >
            {/* Decorative gradient orb */}
            <div className="absolute top-20 -left-20 w-40 h-40 bg-blue-500/10 dark:bg-blue-400/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-20 -right-10 w-32 h-32 bg-purple-500/10 dark:bg-purple-400/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full overflow-hidden">
                {children}
            </div>
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
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99] md:hidden"
                            onClick={() => setOpen(false)}
                        />
                        {/* Sidebar */}
                        <motion.div
                            initial={{ x: "-100%", opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: "-100%", opacity: 0 }}
                            transition={{
                                type: "spring",
                                damping: 25,
                                stiffness: 300,
                            }}
                            className={cn(
                                "fixed h-full w-[85%] max-w-[300px] inset-y-0 left-0 glass-modal p-6 z-[100] flex flex-col justify-between md:hidden shadow-2xl",
                                className
                            )}
                        >
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                className="absolute right-4 top-4 z-50 p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                                onClick={() => setOpen(!open)}
                            >
                                <X size={20} />
                            </motion.button>
                            {children}
                        </motion.div>
                    </>
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
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className={cn(
                "flex items-center group/sidebar rounded-xl transition-all duration-200 relative",
                open
                    ? "justify-start gap-3.5 py-2.5 px-3 w-full text-left"
                    : "justify-center w-11 h-11 mx-auto p-0",
                active
                    ? "bg-blue-500/15 dark:bg-blue-500/25 text-blue-600 dark:text-blue-400 font-semibold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/50",
                className
            )}
            title={!open ? link.label : undefined}
            {...props}
        >
            {/* Active indicator bar */}
            {active && (
                <motion.div
                    layoutId="activeIndicator"
                    className={cn(
                        "absolute bg-gradient-to-b from-blue-500 to-indigo-500",
                        open
                            ? "left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full"
                            : "left-0.5 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full"
                    )}
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    transition={{ duration: 0.2 }}
                />
            )}

            <div className={cn(
                "flex items-center justify-center flex-shrink-0 transition-colors duration-200",
                open ? "w-6 h-6" : "w-full h-full"
            )}>
                {React.cloneElement(link.icon, {
                    className: cn(
                        "h-5 w-5 flex-shrink-0 transition-colors duration-200",
                        active
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-slate-500 dark:text-slate-400 group-hover/sidebar:text-slate-800 dark:group-hover/sidebar:text-slate-200"
                    )
                })}
            </div>

            {open && (
                <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                        "text-sm font-medium whitespace-nowrap overflow-hidden z-20 relative",
                        active ? "text-blue-700 dark:text-blue-400 font-semibold" : "text-slate-700 dark:text-slate-300"
                    )}
                >
                    {link.label}
                </motion.span>
            )}
        </motion.button>
    );
};
