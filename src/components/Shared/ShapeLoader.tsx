import React, { useEffect, useMemo, useRef, useState } from "react";

const POINT_COUNT = 120;

interface Point {
  x: number;
  y: number;
}

const interpolateColor = (
  color1: string,
  color2: string,
  factor: number,
): string => {
  const hex = (x: number) => x.toString(16).padStart(2, "0");

  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);

  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);

  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);

  return `#${hex(r)}${hex(g)}${hex(b)}`;
};

const gradientPool: [string, string][] = [
  ["#336EF3", "#4D34CF"],
  ["#76BBFF", "#3279F9"],
  ["#FF63A0", "#FF4C45"],
  ["#0EBC5F", "#78C9FF"],
  ["#FFBE00", "#FFB4F7"],
  ["#C79BFF", "#C79BFF"],
];

interface ShapeLoaderProps {
  size?: number;
  onClick?: () => void;
}

export const ShapeLoader: React.FC<ShapeLoaderProps> = ({
  size = 120,
  onClick,
}) => {
  const center = { x: size / 2, y: size / 2 };
  const radius = Math.round(size * 0.32);

  const shapes = useMemo(() => {
    const obj: Record<string, Point[]> = {};
    const shapeTypes = ["circle", "clover", "flower", "burst", "star", "hex"];

    shapeTypes.forEach((name) => {
      const points: Point[] = [];
      for (let i = 0; i < POINT_COUNT; i++) {
        const theta = (i / POINT_COUNT) * 2 * Math.PI;
        let r = radius;
        if (name === "clover") {
          r = radius * (0.68 + 0.32 * Math.cos(4 * theta));
        } else if (name === "flower") {
          r = radius * (0.75 + 0.25 * Math.cos(8 * theta));
        } else if (name === "burst") {
          r = radius * (0.70 + 0.30 * Math.cos(12 * theta));
        } else if (name === "star") {
          r = radius * (0.65 + 0.35 * Math.cos(5 * theta));
        } else if (name === "hex") {
          r = radius * (0.82 + 0.18 * Math.cos(6 * theta));
        }
        points.push({
          x: r * Math.cos(theta),
          y: r * Math.sin(theta),
        });
      }
      obj[name] = points;
    });

    return obj;
  }, [radius]);

  const shapeNames = useMemo(() => Object.keys(shapes), [shapes]);

  const currentShapeRef = useRef<string>("circle");
  const targetShapeRef = useRef<string>("clover");
  const startColorsRef = useRef<[string, string]>(gradientPool[0]);
  const targetColorsRef = useRef<[string, string]>(gradientPool[1]);
  const progressRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);

  const currentPointsRef = useRef<Point[]>([]);
  const currentColorsRef = useRef<[string, string]>(gradientPool[0]);
  const [, setRenderTrigger] = useState(0);
  const [isClicked, setIsClicked] = useState(false);
  const rotationRef = useRef(0);
  const shuffleBagRef = useRef<string[]>([]);

  // Spring physics parameters
  const stiffness = 25;
  const damping = 9;
  const mass = 1.0;

  const getNextShape = () => {
    if (shuffleBagRef.current.length === 0) {
      const pool = [...shapeNames];
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      shuffleBagRef.current = pool;
    }
    return shuffleBagRef.current.pop() || shapeNames[0];
  };

  useEffect(() => {
    const interval = setInterval(() => {
      let nextTarget = getNextShape();
      if (nextTarget === targetShapeRef.current && shapeNames.length > 1) {
        shuffleBagRef.current.unshift(nextTarget);
        nextTarget = getNextShape();
      }

      const availableGrads = gradientPool.filter(
        (g) => g !== targetColorsRef.current,
      );
      const nextGrad =
        availableGrads[Math.floor(Math.random() * availableGrads.length)];

      currentShapeRef.current = targetShapeRef.current;
      targetShapeRef.current = nextTarget;
      startColorsRef.current = targetColorsRef.current;
      targetColorsRef.current = nextGrad;
      progressRef.current = 0;
      velocityRef.current = 0;
    }, 2000);

    return () => clearInterval(interval);
  }, [shapeNames]);

  useEffect(() => {
    let animationFrameId: number;
    let lastTimestamp = 0;

    const animate = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.05);

      const startArr = shapes[currentShapeRef.current] || shapes["circle"];
      const targetArr = shapes[targetShapeRef.current] || shapes["circle"];

      const targetSpeed = 1.5;
      rotationRef.current += targetSpeed * dt;

      const rad = rotationRef.current + Math.sin(timestamp * 0.001) * 0.5;

      const force =
        -stiffness * (progressRef.current - 1) -
        damping * velocityRef.current;
      const acceleration = force / mass;
      velocityRef.current += acceleration * dt;
      progressRef.current += velocityRef.current * dt;

      const progressClamped = Math.min(
        Math.max(progressRef.current, 0),
        1,
      );
      const swirlAngle = Math.sin(progressClamped * Math.PI) * 0.3;
      const scale = 1 + Math.abs(velocityRef.current) * 0.015;

      const floatOffset = Math.sin(timestamp * 0.002) * (size / 24);

      currentPointsRef.current = startArr.map((p, i) => {
        const target = targetArr[i];
        let x = p.x + (target.x - p.x) * progressClamped;
        let y = p.y + (target.y - p.y) * progressClamped;

        x *= scale;
        y *= scale;

        const totalRad = rad + swirlAngle;
        const rx = x * Math.cos(totalRad) - y * Math.sin(totalRad);
        const ry = x * Math.sin(totalRad) + y * Math.cos(totalRad);

        return { x: center.x + rx, y: center.y + ry + floatOffset };
      });

      currentColorsRef.current = [
        interpolateColor(
          startColorsRef.current[0],
          targetColorsRef.current[0],
          progressClamped,
        ),
        interpolateColor(
          startColorsRef.current[1],
          targetColorsRef.current[1],
          progressClamped,
        ),
      ];

      setRenderTrigger((prev) => prev + 1);
      lastTimestamp = timestamp;
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [shapes, size, center.x, center.y]);

  const handleShapeClick = () => {
    setIsClicked(true);
    onClick?.();

    let nextTarget = getNextShape();
    if (nextTarget === targetShapeRef.current && shapeNames.length > 1) {
      shuffleBagRef.current.unshift(nextTarget);
      nextTarget = getNextShape();
    }

    const nextGrad =
      gradientPool[Math.floor(Math.random() * gradientPool.length)];

    currentShapeRef.current = targetShapeRef.current;
    targetShapeRef.current = nextTarget;
    startColorsRef.current = targetColorsRef.current;
    targetColorsRef.current = nextGrad;
    progressRef.current = 0;
    velocityRef.current = 0;
  };

  if (currentPointsRef.current.length === 0) {
    const defaultArr = shapes["circle"] || [];
    currentPointsRef.current = defaultArr.map((p) => ({
      x: p.x + center.x,
      y: p.y + center.y,
    }));
  }

  return (
    <div
      style={{ width: size, height: size }}
      className="relative flex items-center justify-center select-none"
    >
      <style>{`
        @keyframes clickReaction {
          0% { transform: scale(1); filter: brightness(1) drop-shadow(0 0 0px rgba(255,255,255,0)); }
          50% { transform: scale(1.2); filter: brightness(1.3) drop-shadow(0 0 5px rgba(255,255,255,0.5)); }
          100% { transform: scale(1); filter: brightness(1) drop-shadow(0 0 0px rgba(255,255,255,0)); }
        }
        .animate-click {
          animation: clickReaction 0.8s cubic-bezier(0.25, 1, 0.5, 1);
          transform-origin: center;
        }
      `}</style>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full h-full"
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient id="shapeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={currentColorsRef.current[0]} />
            <stop offset="100%" stopColor={currentColorsRef.current[1]} />
          </linearGradient>
        </defs>
        <g
          className={isClicked ? "animate-click" : ""}
          onAnimationEnd={() => setIsClicked(false)}
        >
          <path
            d={
              `M ${currentPointsRef.current[0].x} ${currentPointsRef.current[0].y} ` +
              currentPointsRef.current
                .slice(1)
                .map((p) => `L ${p.x} ${p.y}`)
                .join(" ") +
              " Z"
            }
            fill="url(#shapeGrad)"
            stroke="url(#shapeGrad)"
            strokeWidth="0.5"
            strokeLinejoin="round"
            onClick={handleShapeClick}
            className="cursor-pointer"
          />
        </g>
      </svg>
    </div>
  );
};
