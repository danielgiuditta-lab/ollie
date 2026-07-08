import React, { useEffect, useMemo, useRef, useState } from "react";

const POINT_COUNT = 128;

interface Point {
  x: number;
  y: number;
}

interface SlotConfig {
  currentShape: string;
  targetShape: string;
  startTime: number;
  duration: number;
  startColors: [string, string];
  targetColors: [string, string];
  morphProgress: number;
  morphVelocity: number;
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

const getSignedArea = (points: Point[]): number => {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y - points[j].x * points[i].y;
  }
  return area / 2;
};

const samplePath = (pathData: string, count: number): Point[] => {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", pathData);

  const length = path.getTotalLength();
  const points: Point[] = [];

  for (let i = 0; i < count; i++) {
    const pt = path.getPointAtLength((i / count) * length);
    // Center it on 190, 190 (common viewBox center in C4 assets)
    const cx = pt.x - 190;
    const cy = pt.y - 190;
    points.push({ x: cx, y: cy });
  }

  let pts = [...points];
  if (getSignedArea(pts) < 0) {
    pts.reverse();
  }

  let minyIdx = 0;
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].y < pts[minyIdx].y) {
      minyIdx = i;
    }
  }

  return [...pts.slice(minyIdx), ...pts.slice(0, minyIdx)];
};

const getBoundingBox = (points: Point[]) => {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  points.forEach((p) => {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  });
  return {
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
};

const gradientPool: [string, string][] = [
  ["#336EF3", "#4D34CF"],
  ["#76BBFF", "#3279F9"],
  ["#FF63A0", "#FF4C45"],
  ["#0EBC5F", "#78C9FF"],
  ["#FFBE00", "#FFB4F7"],
  ["#C79BFF", "#C79BFF"],
];

const fallbackPaths = {
  circle:
    "M350 190C350 278.366 278.366 350 190 350C101.634 350 30 278.366 30 190C30 101.634 101.634 30 190 30C278.366 30 350 101.634 350 190Z",
  clover:
    "M63.0014 190C49.8954 174.339 42 154.126 42 132.06C42 82.321 82.1131 42 131.595 42C153.99 42 174.466 50.2594 190.173 63.9131C205.843 50.2594 226.271 42 248.614 42C297.981 42 338 82.321 338 132.06C338 154.126 330.123 174.339 317.048 190C330.123 205.661 338 225.874 338 132.06C338 154.126 330.123 174.339 317.048 190Z",
  flower:
    "M303.125 76.8625C291.251 64.988 264.194 70.8597 231.547 89.6813C221.771 53.2855 206.79 30 189.996 30C173.203 30 158.223 53.2841 148.447 89.6779C115.802 70.8581 88.7462 64.9874 76.8722 76.8614C64.9969 88.7367 70.8701 115.796 89.6944 148.446C53.2911 158.222 30 173.204 30 190C30 206.793 53.2829 221.773 89.6752 231.549C70.8494 264.2 64.9756 291.261 76.8512 303.137C88.7274 315.013 115.79 309.138 148.444 290.31C158.22 326.711 173.201 350 189.996 350C206.792 350 221.774 326.709 231.55 290.307C264.205 309.136 291.27 315.012 303.146 303.136C315.022 291.26 309.148 264.2 290.323 231.549C326.716 221.773 350 206.793 350 190C350 173.204 326.708 158.222 290.304 148.446C309.128 115.797 315.001 88.7376 303.125 76.8625Z",
  burst:
    "M187.293 26.6421C188.056 25.2785 188.437 24.5966 188.902 24.3108C189.575 23.8964 190.425 23.8964 191.098 24.3108C191.563 24.5966 191.944 25.2785 192.707 26.6421L218.917 73.4925C219.386 74.3306 219.62 74.7497 219.937 75.0046C220.396 75.3737 220.989 75.5326 221.571 75.4425C221.973 75.3802 222.386 75.1345 223.211 74.6431L269.335 47.1743C270.677 46.3748 271.348 45.9751 271.893 45.9598C272.684 45.9377 273.42 46.3624 273.796 47.0581C274.055 47.5379 274.045 48.3191 274.023 49.8814L273.296 103.56C273.283 104.52 273.277 105 273.424 105.38C273.637 105.929 274.071 106.363 274.62 106.576C275 106.723 275.48 106.717 276.44 106.704L330.119 105.977C331.681 105.955 332.462 105.945 332.942 106.204C333.638 106.58 334.062 107.316 334.04 108.107C334.025 108.652 333.625 109.323 332.826 110.665L305.357 156.789C304.865 157.614 304.62 158.027 304.557 158.429C304.467 159.011 304.626 159.604 304.995 160.063C305.25 160.38 305.669 160.614 306.508 161.083L353.358 187.293C354.722 188.056 355.403 188.437 355.689 188.902C356.104 189.575 356.104 190.425 355.689 191.098C355.403 191.563 354.722 191.944 353.358 192.707L306.508 218.917C305.669 219.386 305.25 219.62 304.995 219.937C304.626 220.396 304.467 220.989 304.557 221.571C304.62 221.973 304.865 222.386 305.357 223.211L332.826 269.335C333.625 270.677 334.025 271.348 334.04 271.893C334.062 272.684 333.638 273.42 332.942 273.796C332.462 274.055 331.681 274.045 330.119 274.023L276.44 273.296C275.48 273.283 275 273.277 274.62 273.424C274.071 273.637 273.637 274.071 273.424 274.62C273.277 275 273.283 275.48 273.296 276.44L274.023 330.119C274.045 331.681 274.055 332.462 273.796 332.942C273.42 333.638 272.684 334.062 271.893 334.04C271.348 334.025 270.677 333.625 269.335 332.826L223.211 305.357C222.386 304.865 221.973 304.62 221.571 304.557C220.989 304.467 220.396 304.626 219.937 304.995C219.62 305.25 219.386 305.669 218.917 306.508L192.707 353.358C191.944 354.722 191.563 355.403 191.098 355.689C190.425 356.104 189.575 356.104 188.902 355.689C188.437 355.403 188.056 354.722 187.293 353.358L161.083 306.508C160.614 306.508 160.38 305.25 160.063 304.995C159.604 304.626 159.011 304.467 158.429 304.557C158.027 304.62 157.614 304.865 156.789 305.357L110.665 332.826C109.323 333.625 108.652 334.025 108.107 334.04C107.316 334.062 106.58 333.638 106.204 332.942C105.945 332.462 105.955 331.681 105.977 330.119L106.704 276.44C106.717 275.48 106.723 275 106.576 274.62C106.363 274.071 105.38 273.424C105 273.277 104.52 273.283 103.56 273.296L49.8814 274.023C48.3191 274.045 47.5379 274.055 47.0581 273.796C46.3624 273.42 45.9377 272.684 45.9598 271.893C45.9751 271.348 46.3748 270.677 47.1743 269.335L74.6431 223.211C75.1345 222.386 75.3802 221.973 74.0191 110.353C78.2706 105.805 83.4862 102.017 93.9172 94.4402L133.415 65.7498Z",
};

interface ShapeLoaderProps {
  size?: number;
  onClick?: () => void;
}

export const ShapeLoader: React.FC<ShapeLoaderProps> = ({
  size = 120,
  onClick,
}) => {
  const center = { x: size / 2, y: size / 2 };
  const shapeSize = Math.round(size * 0.65);
  const viewBoxSize = size;

  const shapes = useMemo(() => {
    const obj: Record<string, Point[]> = {};
    for (const name in fallbackPaths) {
      const rawPoints = samplePath((fallbackPaths as any)[name], POINT_COUNT);
      const bbox = getBoundingBox(rawPoints);
      const maxDim = Math.max(bbox.width, bbox.height);
      const scale = maxDim > 0 ? shapeSize / maxDim : 1;
      obj[name] = rawPoints.map((p) => ({
        x: (p.x - bbox.centerX) * scale,
        y: (p.y - bbox.centerY) * scale,
      }));
    }
    return obj;
  }, [shapeSize]);

  const shapeNames = useMemo(
    () => Object.keys(shapes).filter((n) => n !== "circle" && n !== "Circle"),
    [shapes],
  );

  const [slotConfig, setSlotConfig] = useState<SlotConfig | null>(null);
  const currentPointsRef = useRef<Point[]>([]);
  const currentColorsRef = useRef<[string, string]>(gradientPool[0]);
  const [, setRenderTrigger] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const rotationRef = useRef(0);
  const shuffleBagRef = useRef<string[]>([]);

  // Spring physics parameters
  const stiffness = 20;
  const damping = 10;
  const mass = 1.2;

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
    if (shapeNames.length === 0 || isInitialized) return;

    const randomShape = getNextShape();
    const randomTarget = getNextShape();

    setSlotConfig({
      currentShape: randomShape,
      targetShape: randomTarget,
      startTime: performance.now(),
      duration: 2000,
      startColors: gradientPool[0],
      targetColors: gradientPool[1],
      morphProgress: 0,
      morphVelocity: 0,
    });

    const base = shapes[randomShape] || shapes[shapeNames[0]];
    currentPointsRef.current = base.map((p) => ({
      x: p.x + center.x,
      y: p.y + center.y,
    }));
    currentColorsRef.current = gradientPool[0];
    setIsInitialized(true);
  }, [shapes, shapeNames, isInitialized]);

  useEffect(() => {
    if (shapeNames.length === 0 || !isInitialized) return;

    const interval = setInterval(() => {
      const now = performance.now();
      setSlotConfig((current) => {
        if (!current) return null;

        let nextTarget = getNextShape();
        if (nextTarget === current.targetShape && shapeNames.length > 1) {
          shuffleBagRef.current.unshift(nextTarget);
          nextTarget = getNextShape();
        }

        const availableGrads = gradientPool.filter(
          (g) => g !== current.targetColors,
        );
        const nextGrad =
          availableGrads[Math.floor(Math.random() * availableGrads.length)];

        return {
          currentShape: current.targetShape,
          targetShape: nextTarget,
          startTime: now,
          duration: 2000,
          startColors: current.targetColors,
          targetColors: nextGrad,
          morphProgress: 0,
          morphVelocity: 0,
        };
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [shapeNames, isInitialized]);

  useEffect(() => {
    if (!isInitialized || !slotConfig) return;
    let animationFrameId: number;
    let lastTimestamp = 0;

    const animate = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.05);

      const startArr = shapes[slotConfig.currentShape] || shapes[shapeNames[0]];
      const targetArr = shapes[slotConfig.targetShape] || shapes[shapeNames[0]];

      const targetSpeed = 1.5;
      rotationRef.current += targetSpeed * dt;

      const rad = rotationRef.current + Math.sin(timestamp * 0.001) * 0.5;

      const force =
        -stiffness * (slotConfig.morphProgress - 1) -
        damping * slotConfig.morphVelocity;
      const acceleration = force / mass;
      slotConfig.morphVelocity += acceleration * dt;
      slotConfig.morphProgress += slotConfig.morphVelocity * dt;

      const progressClamped = Math.min(
        Math.max(slotConfig.morphProgress, 0),
        1,
      );
      const swirlAngle = Math.sin(progressClamped * Math.PI) * 0.3;
      const scale = 1 + Math.abs(slotConfig.morphVelocity) * 0.02;

      const floatOffset = Math.sin(timestamp * 0.002) * (size / 20);

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
          slotConfig.startColors[0],
          slotConfig.targetColors[0],
          progressClamped,
        ),
        interpolateColor(
          slotConfig.startColors[1],
          slotConfig.targetColors[1],
          progressClamped,
        ),
      ];

      setRenderTrigger((prev) => prev + 1);
      lastTimestamp = timestamp;
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isInitialized, shapes, shapeNames, slotConfig, size]);

  const handleShapeClick = () => {
    setIsClicked(true);
    onClick?.();

    setSlotConfig((current) => {
      if (!current) return null;

      let nextTarget = getNextShape();
      if (nextTarget === current.targetShape && shapeNames.length > 1) {
        shuffleBagRef.current.unshift(nextTarget);
        nextTarget = getNextShape();
      }

      const nextGrad =
        gradientPool[Math.floor(Math.random() * gradientPool.length)];
      return {
        ...current,
        targetShape: nextTarget,
        startTime: performance.now(),
        targetColors: nextGrad,
        morphProgress: 0,
        morphVelocity: 0,
      };
    });
  };

  if (!isInitialized || !slotConfig || currentPointsRef.current.length === 0)
    return null;

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
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
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
