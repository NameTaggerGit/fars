import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface Circle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  opacity: number;
}

export function AuthBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<SVGSVGElement>(null);
  const circlesRef = useRef<Circle[]>([]);
  const [lines, setLines] = useState<Line[]>([]);

  const CIRCLE_COUNT = 8;
  const CONNECTION_DISTANCE = 200;
  const COLORS = ['#60a5fa', '#22c55e', '#a855f7', '#0ea5e9', '#f59e0b'];

  // Initialize circles
  useEffect(() => {
    if (!containerRef.current) return;

    const { width, height } = containerRef.current.getBoundingClientRect();

    circlesRef.current = Array.from({ length: CIRCLE_COUNT }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 2.5,
      vy: (Math.random() - 0.5) * 2.5,
      radius: 40 + Math.random() * 60,
      color: COLORS[i % COLORS.length],
    }));
  }, []);

  // Animation loop
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    let animationId: number;

    const animate = () => {
      const { width, height } = container.getBoundingClientRect();
      const circles = circlesRef.current;

      // Update circle positions
      circles.forEach((circle) => {
        circle.x += circle.vx;
        circle.y += circle.vy;

        // Bounce off walls with damping
        if (circle.x - circle.radius < 0 || circle.x + circle.radius > width) {
          circle.vx *= -0.9;
          circle.x = Math.max(circle.radius, Math.min(width - circle.radius, circle.x));
        }
        if (circle.y - circle.radius < 0 || circle.y + circle.radius > height) {
          circle.vy *= -0.9;
          circle.y = Math.max(circle.radius, Math.min(height - circle.radius, circle.y));
        }

        // Slight friction
        circle.vx *= 0.99;
        circle.vy *= 0.99;
      });

      // Find connections between circles
      const newLines: Line[] = [];
      for (let i = 0; i < circles.length; i++) {
        for (let j = i + 1; j < circles.length; j++) {
          const dx = circles[j].x - circles[i].x;
          const dy = circles[j].y - circles[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECTION_DISTANCE) {
            const opacity = 1 - dist / CONNECTION_DISTANCE;
            newLines.push({
              x1: circles[i].x,
              y1: circles[i].y,
              x2: circles[j].x,
              y2: circles[j].y,
              opacity: opacity * 0.5,
            });
          }
        }
      }

      setLines(newLines);

      // Update canvas viewBox
      if (canvas) {
        canvas.setAttribute('viewBox', `0 0 ${width} ${height}`);
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  const layers = [
    {
      className:
        'absolute -left-40 -top-40 w-[420px] h-[420px] rounded-full bg-[radial-gradient(circle_at_center,#60a5fa_0,#60a5fa_0.5,#4f46e5_35%,transparent_70%)] opacity-50 blur-3xl',
      initial: { x: -80, y: -40, scale: 0.9 },
      animate: { x: 0, y: 0, scale: 1 },
    },
    {
      className:
        'absolute -right-40 -bottom-40 w-[480px] h-[480px] rounded-full bg-[radial-gradient(circle_at_center,#22c55e_0,#22c55e_0.4,#0ea5e9_40%,transparent_75%)] opacity-40 blur-3xl',
      initial: { x: 40, y: 40, scale: 0.9 },
      animate: { x: 0, y: 0, scale: 1 },
    },
    {
      className:
        'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-[radial-gradient(circle_at_center,#a855f7_0,#6366f1_35%,transparent_70%)] opacity-35 blur-3xl',
      initial: { rotate: -10 },
      animate: { rotate: 10 },
    },
  ] as const;

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Base gradient layers */}
      {layers.map((layer, idx) => (
        <motion.div
          // eslint-disable-next-line react/no-array-index-key
          key={idx}
          className={layer.className}
          initial={layer.initial}
          animate={layer.animate}
          transition={{
            duration: 18 + idx * 4,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* SVG for connection lines */}
      <svg
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ overflow: 'visible' }}
      >
        {lines.map((line, idx) => (
          // eslint-disable-next-line react/no-array-index-key
          <line
            key={idx}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="rgba(96, 165, 250, 0.3)"
            strokeWidth="1.5"
            opacity={line.opacity}
          />
        ))}
      </svg>

      {/* Animated circles */}
      <div className="absolute inset-0">
        {circlesRef.current.map((circle) => (
          <motion.div
            key={circle.id}
            className="absolute pointer-events-none rounded-full opacity-30 blur-xl"
            style={{
              width: circle.radius * 2,
              height: circle.radius * 2,
              left: circle.x - circle.radius,
              top: circle.y - circle.radius,
              backgroundColor: circle.color,
              boxShadow: `0 0 ${circle.radius}px ${circle.color}`,
            }}
            animate={{
              left: circle.x - circle.radius,
              top: circle.y - circle.radius,
            }}
            transition={{
              duration: 0.05,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* Small floating particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 40 }).map((_, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <motion.span
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-white/50 dark:bg-slate-200/40 shadow-[0_0_12px_rgba(255,255,255,0.6)]"
            initial={{
              x: Math.random() * window.innerWidth - window.innerWidth / 2,
              y: Math.random() * window.innerHeight - window.innerHeight / 2,
              opacity: 0,
            }}
            animate={{
              y: '-=40',
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 10 + Math.random() * 10,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>
    </div>
  );
}

