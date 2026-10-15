import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

export const IconIntersection: React.FC<IconProps> = ({ size = 16, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="3" width="10" height="10" rx="1" />
    <path d="M8 1v2M8 13v2M1 8h2M13 8h2" />
  </svg>
);

export const IconCorridor: React.FC<IconProps> = ({ size = 16, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2 3h12M2 13h12" />
    <path d="M5 8h2M9 8h2" strokeDasharray="2 2" />
  </svg>
);

export const IconHospital: React.FC<IconProps> = ({ size = 16, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="12" height="12" rx="2" />
    <path d="M8 5v6M5 8h6" />
  </svg>
);

export const IconFireStation: React.FC<IconProps> = ({ size = 16, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M8 2l5 5-5 5-5-5z" />
    <path d="M8 6v4M6 8h4" />
  </svg>
);

export const IconWaterPlant: React.FC<IconProps> = ({ size = 16, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="12" height="12" rx="1" />
    <path d="M8 4c-1.5 2-2.5 3.5-2.5 5a2.5 2.5 0 005 0c0-1.5-1-3-2.5-5z" />
  </svg>
);

export const IconDrainageRegulator: React.FC<IconProps> = ({ size = 16, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 5l10 6M3 11l10-6" />
    <circle cx="8" cy="8" r="2" />
  </svg>
);

export const IconDepot: React.FC<IconProps> = ({ size = 16, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="8" cy="8" r="6" />
    <path d="M6 7l2 2 2-2" />
  </svg>
);

export const IconResponder: React.FC<IconProps> = ({ size = 16, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="5" width="9" height="6" rx="1" />
    <path d="M11 7h2l1 2v2h-3V7z" />
    <circle cx="5" cy="12" r="1.5" fill="currentColor" />
    <circle cx="11" cy="12" r="1.5" fill="currentColor" />
  </svg>
);

export const IconPowerFeeder: React.FC<IconProps> = ({ size = 16, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 2L4 9h5l-2 5 7-8H9l2-4z" />
  </svg>
);

export const IconTower: React.FC<IconProps> = ({ size = 16, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M8 2v12M5 14l3-10 3 10M6 8h4M4 11h8" />
  </svg>
);

export const IconRelay: React.FC<IconProps> = ({ size = 16, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M8 2l5 3v6l-5 3-5-3V5z" />
    <circle cx="8" cy="8" r="1.5" fill="currentColor" />
  </svg>
);

export const IconHazardZone: React.FC<IconProps> = ({ size = 16, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M8 2l6 11H2L8 2z" />
    <path d="M8 6v3M8 11h.01" />
  </svg>
);

export const IconBranch: React.FC<IconProps> = ({ size = 16, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 14V8a3 3 0 013-3h5" />
    <path d="M4 8a3 3 0 003-3" />
    <circle cx="4" cy="14" r="1.5" fill="currentColor" />
    <circle cx="12" cy="5" r="1.5" fill="currentColor" />
  </svg>
);

export const IconSevered: React.FC<IconProps> = ({ size = 16, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2 8h3M11 8h3" />
    <path d="M6 6l4 4M10 6l-4 4" />
  </svg>
);

export const IconApprove: React.FC<IconProps> = ({ size = 16, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 8.5l3.5 3.5 6.5-7" />
  </svg>
);

export const IconReject: React.FC<IconProps> = ({ size = 16, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="8" cy="8" r="6" />
    <path d="M4 4l8 8" />
  </svg>
);

export const IconEvidence: React.FC<IconProps> = ({ size = 16, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="7" cy="7" r="4.5" />
    <path d="M10.5 10.5L14 14" />
    <circle cx="7" cy="7" r="1" fill="currentColor" />
  </svg>
);

export const IconFrameStep: React.FC<IconProps> = ({ size = 16, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 4l4 4-4 4M8 4l4 4-4 4" />
  </svg>
);

export const IconReducedMotion: React.FC<IconProps> = ({ size = 16, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2 10c2-3 4-3 6 0s4 3 6 0" />
    <path d="M3 3l10 10" />
  </svg>
);

export const ALL_ICONS = [
  { name: 'intersection', Component: IconIntersection },
  { name: 'corridor', Component: IconCorridor },
  { name: 'hospital', Component: IconHospital },
  { name: 'fire_station', Component: IconFireStation },
  { name: 'water_plant', Component: IconWaterPlant },
  { name: 'drainage_regulator', Component: IconDrainageRegulator },
  { name: 'depot', Component: IconDepot },
  { name: 'responder', Component: IconResponder },
  { name: 'power_feeder', Component: IconPowerFeeder },
  { name: 'tower', Component: IconTower },
  { name: 'relay', Component: IconRelay },
  { name: 'hazard_zone', Component: IconHazardZone },
  { name: 'branch', Component: IconBranch },
  { name: 'severed', Component: IconSevered },
  { name: 'approve', Component: IconApprove },
  { name: 'reject', Component: IconReject },
  { name: 'evidence', Component: IconEvidence },
  { name: 'frame_step', Component: IconFrameStep },
  { name: 'reduced_motion', Component: IconReducedMotion }
];
