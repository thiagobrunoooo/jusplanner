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
                "h-screen px-3 py-6 hidden md:flex md:flex-col glass-sidebar w-[280px] flex-shrink-0 relative",
                className
            )}
            animate={{
                width: animate ? (open ? "280px" : "80px") : "280px",
            }}
            transition={{
                duration: 0.4,
                ease: [0.25, 0.1, 0.25, 1], // Curva suave tipo ease-out
            }}
            {...props}
        >
            {/* Botão de Toggle - Centralizado verticalmente */}
            <motion.button
                onClick={toggleSidebar}
                className="absolute -right-3.5 top-1/2 z-50 w-7 h-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-md flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 hover:shadow-lg transition-all duration-200 group"
                style={{ transform: "translateY(-50%)" }}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                title={open ? "Retrair sidebar" : "Expandir sidebar"}
            >
                <motion.div
                    animate={{ rotate: open ? 0 : 180 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                    <ChevronLeft size={16} className="text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors" />
                </motion.div>
            </motion.button>

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
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[99] md:hidden"
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
                                "fixed h-full w-[85%] max-w-[320px] inset-y-0 left-0 glass-modal p-8 z-[100] flex flex-col justify-between md:hidden shadow-2xl",
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
            whileHover={{ x: 4, backgroundColor: "rgba(0,0,0,0.02)" }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                "flex items-center justify-start gap-4 group/sidebar py-3 px-3 rounded-xl w-full text-left transition-all duration-200 relative overflow-hidden",
                active
                    ? "bg-gradient-to-r from-blue-500/15 to-indigo-500/10 dark:from-blue-500/25 dark:to-indigo-500/15 text-blue-600 dark:text-blue-400 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100",
                className
            )}
            {...props}
        >
            {/* Active indicator bar */}
            {active && (
                <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-r-full"
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    transition={{ duration: 0.2 }}
                />
            )}

            <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 z-20 relative",
                active
                    ? "bg-blue-500/20 dark:bg-blue-400/20 shadow-sm"
                    : "group-hover/sidebar:bg-slate-200/50 dark:group-hover/sidebar:bg-slate-700/50"
            )}>
                {React.cloneElement(link.icon, {
                    className: cn(
                        "h-[18px] w-[18px] flex-shrink-0 transition-all duration-300",
                        active
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-slate-400 dark:text-slate-500 group-hover/sidebar:text-slate-700 dark:group-hover/sidebar:text-slate-300"
                    )
                })}
            </div>

            <motion.span
                animate={{
                    opacity: animate ? (open ? 1 : 0) : 1,
                    x: animate ? (open ? 0 : -10) : 0,
                    width: animate ? (open ? "auto" : 0) : "auto",
                }}
                transition={{
                    duration: 0.35,
                    ease: [0.25, 0.1, 0.25, 1]
                }}
                className={cn(
                    "text-sm font-medium whitespace-pre overflow-hidden z-20 relative",
                    active ? "text-blue-700 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"
                )}
            >
                {link.label}
            </motion.span>
        </motion.button>
    );
};
