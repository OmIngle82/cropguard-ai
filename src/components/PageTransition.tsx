import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

/** Shared stagger container — wrap page sections in <motion.div variants={itemVariants}> */
export const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.07,
            delayChildren: 0.05,
        },
    },
};

export const itemVariants = {
    hidden: { opacity: 0, y: 16, scale: 0.98 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
    },
};

/** Horizontal slide variant for step-based forms */
export const slideVariants = {
    hidden: { opacity: 0, x: 24 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
    exit: { opacity: 0, x: -24, transition: { duration: 0.2, ease: 'easeIn' } },
};

/** Top-level page wrapper — use pathname as key inside AnimatePresence */
export default function PageTransition({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    return (
        <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={{ willChange: 'opacity, transform' }}
        >
            {children}
        </motion.div>
    );
}
