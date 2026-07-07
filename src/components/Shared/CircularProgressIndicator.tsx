import React, { useEffect, useMemo, useState, useRef } from 'react';

interface AngleValues {
  p_start_deg: number;
  p_len_deg: number;
  p_end_deg: number;
  s_start_deg: number;
  s_len_deg: number;
  s_end_deg: number;
}

export interface CircularProgressIndicatorProps {
  /** The progress value (0-100) for determinate spinners. */
  value?: number;
  /** If true, the spinner will be indeterminate. */
  isIndeterminate?: boolean;
  /** The size (width and height) of the spinner in pixels. Defaults to 40. */
  size?: number;
  /** The thickness of the spinner stroke in pixels. Defaults to 10% of size. */
  strokeWidth?: number;
  /** Additional CSS classes to apply to the primary ring. */
  className?: string;
  /** Additional CSS classes for the secondary (track) ring in indeterminate mode. */
  secondaryClassName?: string;
  /** If true, displays the percentage value in the center. */
  showLabel?: boolean;
  /** For indeterminate spinners, allows scrubbing through the animation. Value is number of cycles (e.g., 0.5 is halfway). */
  animationProgress?: number;
  /** Callback that returns calculated angles when scrubbing. */
  onValuesChange?: (values: AngleValues) => void;
  /** The separation between the primary and secondary rings, in degrees. Defaults to 24. */
  gapAngleDegrees?: number;
  /** The duration of one full rotation cycle in milliseconds. Defaults to 2000. */
  rotationDuration?: number;
  /** The duration of one full "breathing" (grow/shrink) cycle in milliseconds. Defaults to 6000. */
  breathingDuration?: number;
  /** The maximum size of the primary ring as a percentage of circumference. Defaults to 85. */
  maxRingSizePercent?: number;
  /** If true, the breathing animation will be reversed (shrink then grow). Defaults to false. */
  reverseBreathing?: boolean;
  /** The visual style of the spinner. */
  variant?: 'default' | 'gemini';
}

const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const CircularProgressIndicator: React.FC<CircularProgressIndicatorProps> = ({
  value = 0,
  isIndeterminate = false,
  size = 40,
  strokeWidth: strokeWidthProp,
  className = 'text-blue-500',
  secondaryClassName,
  showLabel = false,
  animationProgress,
  onValuesChange,
  gapAngleDegrees: gapAngleDegreesProp,
  rotationDuration = 2000,
  breathingDuration = 6000,
  maxRingSizePercent = 85,
  reverseBreathing = false,
  variant = 'default',
}) => {
  const [localRotationProgress, setLocalRotationProgress] = useState(0);
  const [localBreathingProgress, setLocalBreathingProgress] = useState(0);
  const animationFrameId = useRef<number | undefined>(undefined);
  const lastTimestamp = useRef<number | undefined>(undefined);
  
  // strokeWidth scales proportionally with size if not provided.
  const strokeWidth = strokeWidthProp ?? size * 0.1;
  const gapAngleDegrees = gapAngleDegreesProp ?? 24;
  
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Animate standard indeterminate spinners using requestAnimationFrame for maximum smoothness
  useEffect(() => {
    if (isIndeterminate && animationProgress === undefined) {
      const animate = (timestamp: number) => {
        if (lastTimestamp.current === undefined) {
          lastTimestamp.current = timestamp;
        }
        const delta = timestamp - lastTimestamp.current;
        lastTimestamp.current = timestamp;
        setLocalRotationProgress(prev => prev + (delta / rotationDuration));
        setLocalBreathingProgress(prev => prev + (delta / breathingDuration));
        animationFrameId.current = requestAnimationFrame(animate);
      };
      animationFrameId.current = requestAnimationFrame(animate);
    } else {
        lastTimestamp.current = undefined;
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isIndeterminate, animationProgress, rotationDuration, breathingDuration]);
  
  // Unified calculation logic for indeterminate spinners
  const indeterminateSpinnerData = useMemo(() => {
    if (!isIndeterminate) {
      return null;
    }
    
    const effectiveRotationProgress = animationProgress ?? localRotationProgress;
    const effectiveBreathingProgress = animationProgress ?? localBreathingProgress;
    const C = circumference;
    const minLength = C * 0.16;
    const maxLength = C * (maxRingSizePercent / 100);
    
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    
    // "Breathing" effect is driven by the breathing progress
    const p_arc_phase = effectiveBreathingProgress % 1.0;
    let t_unidirectional = p_arc_phase < 0.5 ? p_arc_phase * 2 : (1 - p_arc_phase) * 2;
    
    if (reverseBreathing) {
      t_unidirectional = 1 - t_unidirectional;
    }
    const t_eased = easeInOutCubic(t_unidirectional);
    const p_len = lerp(minLength, maxLength, t_eased);
    
    // Rotation is driven by the linear rotation progress
    const p_off = -(effectiveRotationProgress * C);
    
    const totalGapDegrees = gapAngleDegrees * 2;
    const gapPixels = (gapAngleDegrees / 360) * C;
    const totalGapPixels = (totalGapDegrees / 360) * C;
    
    const s_len = Math.max(0, C - p_len - totalGapPixels);
    const s_off = p_off - p_len - gapPixels;
    
    const styles = {
      primaryStyle: { strokeDasharray: `${p_len} ${C - p_len}`, strokeDashoffset: p_off },
      secondaryStyle: { strokeDasharray: `${s_len} ${C - s_len}`, strokeDashoffset: s_off },
    };
    
    const toPositiveAngle = (val: number) => (val % 360 + 360) % 360;
    const p_len_deg = (p_len / C) * 360;
    const p_start_deg = toPositiveAngle((-p_off / C) * 360);
    const p_end_deg = toPositiveAngle(p_start_deg + p_len_deg);
    const s_len_deg = (s_len / C) * 360;
    const s_start_deg = toPositiveAngle((-s_off / C) * 360);
    const s_end_deg = toPositiveAngle(s_start_deg + s_len_deg);
    
    const angles = { p_start_deg, p_len_deg, p_end_deg, s_start_deg, s_len_deg, s_end_deg };
    
    return { styles, angles };
  }, [isIndeterminate, animationProgress, localRotationProgress, localBreathingProgress, size, strokeWidth, circumference, gapAngleDegrees, maxRingSizePercent, reverseBreathing]);
  
  // Report values back to parent when scrubbing
  useEffect(() => {
    if (indeterminateSpinnerData && onValuesChange && animationProgress !== undefined) {
      onValuesChange(indeterminateSpinnerData.angles);
    }
  }, [indeterminateSpinnerData, onValuesChange, animationProgress]);
  
  // Render Indeterminate Progress
  if (isIndeterminate) {
    const finalSecondaryClassName = secondaryClassName ?? 'text-[#C2E7FF]';
    
    if (indeterminateSpinnerData) {
      return (
        <div
          className="relative inline-block"
          style={{ width: size, height: size }}
          role="progressbar"
          aria-busy="true"
          aria-label="Loading"
        >
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle
              className={finalSecondaryClassName}
              stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round"
              fill="transparent" r={radius} cx={size / 2} cy={size / 2}
              style={indeterminateSpinnerData.styles.secondaryStyle}
            />
            <circle
              className={className}
              stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round"
              fill="transparent" r={radius} cx={size / 2} cy={size / 2}
              style={indeterminateSpinnerData.styles.primaryStyle}
            />
          </svg>
        </div>
      );
    }
    return null;
  }
  
  // Render Determinate Progress
  const determinateSpinnerData = useMemo(() => {
    const C = circumference;
    
    if (value >= 100) {
      return {
        primaryStyle: {
          strokeDasharray: `${C} 0`,
          transition: 'stroke-dasharray 0.3s ease-in-out',
        },
        secondaryStyle: {
          strokeDasharray: `0 ${C}`,
          transition: 'stroke-dasharray 0.3s ease-in-out, stroke-dashoffset 0.3s ease-in-out',
          opacity: 0,
        },
      };
    }
    const totalGapDegrees = gapAngleDegrees * 2;
    const totalGapPixels = (totalGapDegrees / 360) * C;
    const gapPixels = totalGapPixels / 2;
    const clampedValue = Math.max(0, value);
    const p_len = (clampedValue / 100) * C;
    
    const s_len_raw = C - p_len - totalGapPixels;
    const s_off = -p_len - gapPixels;
    const isSecondaryVisible = s_len_raw > 1;
    const s_len = Math.max(0, s_len_raw);
    
    return {
      primaryStyle: {
        strokeDasharray: `${p_len} ${C - p_len}`,
        transition: 'stroke-dasharray 0.3s ease-in-out',
      },
      secondaryStyle: {
        strokeDasharray: `${s_len} ${C - s_len}`,
        strokeDashoffset: s_off,
        transition: 'stroke-dasharray 0.3s ease-in-out, stroke-dashoffset 0.3s ease-in-out, opacity 0.3s ease-in-out',
        opacity: isSecondaryVisible ? 1 : 0,
      },
    };
  }, [value, circumference, gapAngleDegrees]);
  const finalSecondaryClassName = secondaryClassName ?? 'text-[#C2E7FF]';
  return (
    <div
      className="relative inline-block" style={{ width: size, height: size }}
      role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          className={finalSecondaryClassName}
          stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round"
          fill="transparent" r={radius} cx={size / 2} cy={size / 2}
          style={determinateSpinnerData.secondaryStyle}
        />
        <circle
          className={className}
          stroke="currentColor" strokeWidth={strokeWidth}
          strokeLinecap="round" fill="transparent"
          r={radius} cx={size / 2} cy={size / 2}
          style={determinateSpinnerData.primaryStyle}
        />
      </svg>
      {showLabel && (
        <span
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-semibold text-gray-300"
          style={{ fontSize: size / 5 }}
        >
          {`${Math.round(value)}%`}
        </span>
      )}
    </div>
  );
};
