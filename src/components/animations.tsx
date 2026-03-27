import { motion } from 'framer-motion';
import { ReactNode } from 'react';

// Page transition wrapper
export const PageTransition = ({ children }: { children: ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
  >
    {children}
  </motion.div>
);

// Staggered container
export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

// Staggered item
export const staggerItem = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } 
  },
};

// Fade in from bottom
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
};

// Scale in
export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
};

// Slide in from right
export const slideInRight = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
};

// Section reveal (for scroll-based sections)
export const SectionReveal = ({ children, delay = 0 }: { children: ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1], delay }}
  >
    {children}
  </motion.div>
);

// Card hover/tap animation
export const cardAnimation = {
  whileHover: { scale: 1.02, y: -2, transition: { duration: 0.2 } },
  whileTap: { scale: 0.97 },
};
