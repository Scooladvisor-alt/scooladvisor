import React, { useMemo } from "react";
import { motion } from "framer-motion";

export default function FloatingDecoration() {
  const elements = useMemo(() => {
    const items = [];
    
    // Générer 15 cœurs
    for (let i = 0; i < 15; i++) {
      items.push({
        id: `heart-${i}`,
        type: "heart",
        symbol: "♥",
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 10 + Math.random() * 18,
        opacity: 0.1 + Math.random() * 0.2,
        duration: 12 + Math.random() * 8,
        delay: Math.random() * 5,
      });
    }
    
    // Générer 15 étoiles
    for (let i = 0; i < 15; i++) {
      items.push({
        id: `star-${i}`,
        type: "star",
        symbol: "★",
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 10 + Math.random() * 18,
        opacity: 0.1 + Math.random() * 0.2,
        duration: 12 + Math.random() * 8,
        delay: Math.random() * 5,
      });
    }
    
    return items;
  }, []);

  return (
    <div 
      className="fixed inset-0 overflow-hidden"
      style={{ zIndex: 0, pointerEvents: 'none' }}
    >
      {elements.map((el) => (
        <motion.div
          key={el.id}
          className={el.type === "heart" ? "text-pink-300" : "text-amber-300"}
          style={{
            position: "absolute",
            left: `${el.x}%`,
            top: `${el.y}%`,
            fontSize: `${el.size}px`,
            opacity: el.opacity,
          }}
          style={{
            position: "absolute",
            left: `${el.x}%`,
            top: `${el.y}%`,
            fontSize: `${el.size}px`,
            opacity: el.opacity,
            pointerEvents: "none",
          }}
          animate={{
            y: [0, -15, 0, 15, 0],
            x: [0, 10, 0, -10, 0],
            rotate: [0, 5, 0, -5, 0],
            scale: [1, 1.1, 1, 0.95, 1],
          }}
          transition={{
            duration: el.duration,
            delay: el.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {el.symbol}
        </motion.div>
      ))}
    </div>
  );
}