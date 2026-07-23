import React, { useState, useEffect, useRef } from 'react';
import agentAvatarNoEyesSvg from '../../assets/agent-avatar-no-eyes.svg';

export type OllieMascotState = 'static' | 'idle' | 'working' | (() => 'static' | 'idle' | 'working');

export interface FlatOllieMascotProps {
  /** Size of the container in pixels. Default is 32. */
  size?: number;
  /** Mascot state. Can be a static value or a signal (getter function). Default is 'idle'. */
  state?: OllieMascotState;
  /** Additional CSS class names. */
  className?: string;
}

/**
 * Flat SVG Ollie Mascot component.
 */
export function FlatOllieMascot({
  size = 32,
  state = 'idle',
  className = '',
}: FlatOllieMascotProps) {
  const getState = (): 'static' | 'idle' | 'working' => {
    return typeof state === 'function' ? state() : state;
  };

  const currentState = getState();

  const bodyClass = [
    'ollie-flat-host',
    currentState === 'working' ? 'ollie-flat-squish-bounce' : '',
    className
  ].filter(Boolean).join(' ');

  const eyeClass = [
    'ollie-flat-eye',
    (currentState === 'idle' || currentState === 'working') ? 'ollie-flat-eye-blink' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={bodyClass} style={{ width: `${size}px`, height: `${size}px` }}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 18 18"
        fill="none"
        className="ollie-flat-svg"
      >
        {/* Head Outline */}
        <circle
          cx="9"
          cy="9"
          r="8.25"
          fill="none"
          stroke="#6B7280"
          strokeWidth="1.5"
        />

        {/* Left Eye */}
        <rect
          className={eyeClass}
          x="5.8"
          y="4.6"
          width="1.6"
          height="3.2"
          rx="0.8"
          fill="#6B7280"
        />

        {/* Right Eye */}
        <rect
          className={eyeClass}
          x="10.6"
          y="4.6"
          width="1.6"
          height="3.2"
          rx="0.8"
          fill="#6B7280"
        />
      </svg>
    </div>
  );
}

export interface GradientOllieMascotProps {
  /** Size of the container in pixels. Default is 32. */
  size?: number;
  /** Mascot state. Can be a static value or a signal (getter function). Default is 'idle'. */
  state?: OllieMascotState;
  /** Whether to animate eye panning in idle state. Defaults to true for size >= 40. */
  panEyes?: boolean;
  /** Whether the eyes should follow the user's cursor. */
  followCursor?: boolean;
  /** The radius (in pixels) within which the cursor triggers eye tracking. */
  activeRadius?: number;
  /** Additional CSS class names. */
  className?: string;
}

/**
 * Gradient Ollie Mascot component (uses SVG background image and DOM eyes).
 */
export function GradientOllieMascot({
  size = 32,
  state = 'idle',
  panEyes,
  followCursor = false,
  activeRadius = 80,
  className = '',
}: GradientOllieMascotProps) {
  const getState = (): 'static' | 'idle' | 'working' => {
    return typeof state === 'function' ? state() : state;
  };

  const hostRef = useRef<HTMLDivElement>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [bodyOffset, setBodyOffset] = useState({ x: 0, y: 0 });
  const [isReturning, setIsReturning] = useState(false);
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentState = getState();

  useEffect(() => {
    if (!followCursor) return;

    const handleMouseMove = (e: MouseEvent) => {
      const s = typeof state === 'function' ? state() : state;
      if (s !== 'idle') {
        if (isTracking) {
          setIsTracking(false);
          setEyeOffset({ x: 0, y: 0 });
          setBodyOffset({ x: 0, y: 0 });
        }
        if (resetTimeoutRef.current !== null) {
          clearTimeout(resetTimeoutRef.current);
          resetTimeoutRef.current = null;
        }
        setIsReturning(false);
        return;
      }

      const host = hostRef.current;
      if (!host) return;

      const rect = host.getBoundingClientRect();
      const mascotX = rect.left + rect.width / 2;
      const mascotY = rect.top + rect.height / 2;

      const dx = e.clientX - mascotX;
      const dy = e.clientY - mascotY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= activeRadius) {
        if (resetTimeoutRef.current !== null) {
          clearTimeout(resetTimeoutRef.current);
          resetTimeoutRef.current = null;
        }
        setIsReturning(false);
        setIsTracking(true);

        const maxEyeDeflection = 4.0; // SVG units
        const maxBodyDeflection = size * 0.12; // Pixels

        const eyeScale = Math.sqrt(distance / activeRadius);
        const bodyScale = distance / activeRadius;

        const angle = Math.atan2(dy, dx);

        const eyeDeflection = eyeScale * maxEyeDeflection;
        const bodyDeflection = bodyScale * maxBodyDeflection;

        setEyeOffset({
          x: Math.cos(angle) * eyeDeflection,
          y: Math.sin(angle) * eyeDeflection,
        });
        setBodyOffset({
          x: Math.cos(angle) * bodyDeflection,
          y: Math.sin(angle) * bodyDeflection,
        });
      } else {
        if (isTracking && resetTimeoutRef.current === null) {
          setEyeOffset({ x: 0, y: 0 });
          setBodyOffset({ x: 0, y: 0 });
          setIsReturning(true);

          resetTimeoutRef.current = setTimeout(() => {
            setIsTracking(false);
            setIsReturning(false);
            resetTimeoutRef.current = null;
          }, 800);
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (resetTimeoutRef.current !== null) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, [followCursor, state, activeRadius, size, isTracking]);

  const bodyClass = [
    'ollie-gradient-host',
    currentState === 'idle' && !isTracking ? 'ollie-gradient-body-idle' : '',
    currentState === 'working' ? 'ollie-gradient-body-working' : '',
    isReturning ? 'returning' : '',
    className
  ].filter(Boolean).join(' ');

  const eyeLeftClass = [
    'ollie-gradient-eye',
    currentState === 'working' ? 'ollie-gradient-eye-working' : '',
    currentState === 'idle' && (panEyes || size >= 40) && !isTracking ? 'ollie-gradient-eye-idle' : '',
    isReturning ? 'returning' : ''
  ].filter(Boolean).join(' ');

  const eyeRightClass = [
    'ollie-gradient-eye',
    currentState === 'working' ? 'ollie-gradient-eye-working' : '',
    currentState === 'idle' && (panEyes || size >= 40) && !isTracking ? 'ollie-gradient-eye-idle' : '',
    isReturning ? 'returning' : ''
  ].filter(Boolean).join(' ');

  const hostStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    ...(isTracking ? { transform: `translate3d(${bodyOffset.x}px, ${bodyOffset.y}px, 0)` } : {})
  };

  const eyeStyle: React.CSSProperties = isTracking
    ? { transform: `translate3d(${eyeOffset.x}px, ${eyeOffset.y}px, 0)` }
    : {};

  return (
    <div className={bodyClass} style={hostStyle} ref={hostRef}>
      <img
        src={agentAvatarNoEyesSvg}
        className="ollie-gradient-avatar-img"
        alt="Ollie Mascot"
      />
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 18 18"
        fill="none"
        className="ollie-gradient-eyes-svg"
      >
        <rect
          className={eyeLeftClass}
          style={eyeStyle}
          x="5.8"
          y="4.6"
          width="1.6"
          height="3.2"
          rx="0.8"
          fill="white"
        />
        <rect
          className={eyeRightClass}
          style={eyeStyle}
          x="10.6"
          y="4.6"
          width="1.6"
          height="3.2"
          rx="0.8"
          fill="white"
        />
      </svg>
    </div>
  );
}

export interface OllieMascotProps extends GradientOllieMascotProps {
  variant?: 'gradient' | 'flat';
}

/**
 * Main Ollie Mascot component supporting both 'gradient' and 'flat' variants.
 */
export function OllieMascot({
  variant = 'gradient',
  ...props
}: OllieMascotProps) {
  if (variant === 'flat') {
    return <FlatOllieMascot {...props} />;
  }
  return <GradientOllieMascot {...props} />;
}
