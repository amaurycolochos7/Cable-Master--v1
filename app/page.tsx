'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to public website (we'll create this next)
    // For now, redirect to login
    const timer = setTimeout(() => {
      router.push('/public');
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-mesh">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="text-white">
          <div className="text-8xl font-bold mb-4">
            <span className="text-primary">C</span>
            <span className="text-secondary">M</span>
          </div>
          <h1 className="text-4xl font-bold mb-2 text-shadow-lg">Cable Master</h1>
          <p className="text-xl text-white/90">La Mejor Programación</p>

          <div className="mt-8">
            <svg className="animate-spin h-12 w-12 text-white mx-auto" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
