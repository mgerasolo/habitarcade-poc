import { memo } from 'react';

interface RadialDialProps {
  /** Percentage of EXPECTED habits that are complete (0-100) - determines color */
  percentage: number;
  /** Percentage of habits that are "not expected" today (0-100) - shown as gray segment */
  notExpectedPercentage?: number;
  /** Size of the dial in pixels */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Show percentage text inside */
  showText?: boolean;
  /** Custom class for additional styling */
  className?: string;
}

/**
 * Get stroke color based on completion percentage
 * Green >= 80%, Yellow 50-79%, Red < 50%
 */
function getStrokeColor(percentage: number): string {
  if (percentage >= 80) return '#10b981'; // emerald-500
  if (percentage >= 50) return '#eab308'; // yellow-500
  return '#ef4444'; // red-500
}

/**
 * Get track (background) color - slightly darker variant
 */
function getTrackColor(percentage: number): string {
  if (percentage >= 80) return '#064e3b'; // emerald-900
  if (percentage >= 50) return '#713f12'; // yellow-900
  return '#7f1d1d'; // red-900
}

// Gray color for "not expected" segment
const GRAY_COLOR = '#4b5563'; // gray-600

/**
 * RadialDial - Compact circular progress indicator for category scores
 *
 * Shows completion percentage as a filled arc with color coding:
 * - Green (>=80%): On track
 * - Yellow (50-79%): Needs attention
 * - Red (<50%): Behind
 *
 * Optionally shows a gray segment for "not expected" habits (low frequency on track)
 */
export const RadialDial = memo(function RadialDial({
  percentage,
  notExpectedPercentage = 0,
  size = 24,
  strokeWidth = 3,
  showText = false,
  className = '',
}: RadialDialProps) {
  // Clamp percentages
  const clampedPct = Math.max(0, Math.min(100, percentage));
  const clampedNotExpected = Math.max(0, Math.min(100, notExpectedPercentage));

  // Calculate what portion of the circle each segment gets
  // Expected habits get (100 - notExpected)% of the circle
  // Not expected habits get notExpected% of the circle
  const expectedPortion = (100 - clampedNotExpected) / 100;
  const notExpectedPortion = clampedNotExpected / 100;

  // Calculate SVG parameters
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Completion arc: percentage of expected, scaled to the expected portion of circle
  const completionArcLength = (clampedPct / 100) * expectedPortion * circumference;
  const completionOffset = circumference - completionArcLength;

  // Gray arc for "not expected": starts after the expected portion
  const grayArcLength = notExpectedPortion * circumference;
  // Position gray arc to start where expected portion ends (after completion + incomplete)
  const grayStartOffset = circumference * expectedPortion;

  const strokeColor = getStrokeColor(clampedPct);
  const trackColor = clampedNotExpected > 0 ? getTrackColor(clampedPct) : getTrackColor(clampedPct);

  // Center point
  const center = size / 2;

  // Tooltip text
  const tooltipText = clampedNotExpected > 0
    ? `${clampedPct}% complete (${Math.round(clampedNotExpected)}% not expected today)`
    : `${clampedPct}% complete`;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      title={tooltipText}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background track - full circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />

        {/* Gray arc for "not expected" habits - positioned at the end */}
        {clampedNotExpected > 0 && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={GRAY_COLOR}
            strokeWidth={strokeWidth}
            strokeDasharray={`${grayArcLength} ${circumference - grayArcLength}`}
            strokeDashoffset={-grayStartOffset}
            className="transition-all duration-300 ease-out"
          />
        )}

        {/* Completion arc - colored based on percentage */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={completionOffset}
          className="transition-all duration-300 ease-out"
        />
      </svg>

      {/* Optional center text */}
      {showText && (
        <span
          className="absolute inset-0 flex items-center justify-center font-bold"
          style={{
            fontSize: size * 0.3,
            color: strokeColor,
          }}
        >
          {clampedPct}
        </span>
      )}
    </div>
  );
});

export default RadialDial;
