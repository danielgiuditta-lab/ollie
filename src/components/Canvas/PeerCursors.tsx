import React from 'react';
import { PeerState } from '../../hooks/usePresence';

interface PeerCursorsProps {
  peers: Record<string, PeerState>;
  currentUserId?: string;
}

const ANIMALS = [
  "Gentle Giraffe", "Spunky Tiger", "Lovely Platypus", "Happy Capybara", 
  "Friendly Axolotl", "Curious Penguin", "Sunny Meerkat", "Glow Hedgehog", 
  "Kind Koala", "Jolly Otter", "Bright Fox", "Sleepy Sloth", 
  "Dapper Badger", "Cosmic Dolphin", "Majestic Lion", "Clever Cheetah"
];

function getDisplayName(name: string, id: string) {
  // If the name is already one of the animal names, just return it
  if (ANIMALS.includes(name)) {
    return name;
  }
  
  // Otherwise, stable-map the id or name to an animal
  let hash = 0;
  const key = id || name || "default";
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  const animalIndex = Math.abs(hash) % ANIMALS.length;
  const animal = ANIMALS[animalIndex];
  
  return `${name} (${animal})`;
}

export function PeerCursors({ peers, currentUserId }: PeerCursorsProps) {
  // Get guest ID from sessionStorage to filter out stale guest sessions of the same browser context
  const cachedGuestId = typeof window !== 'undefined' ? sessionStorage.getItem("presence_guest_id") : null;

  const peersArray = Object.values(peers).filter(peer => {
    // Exclude current authenticated user
    if (currentUserId && peer.id === currentUserId) return false;
    // Exclude active or cached guest user session to prevent duplicate local cursors
    if (cachedGuestId && peer.id === cachedGuestId) return false;
    // Exclude uninitialized positions representing inactive cursors
    if (peer.x === undefined || peer.y === undefined || peer.x === null || peer.y === null) return false;
    // Exclude uninitialized positions (0, 0) representing ghost cursors
    if (peer.x === 0 && peer.y === 0) return false;
    return true;
  });

  if (peersArray.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {peersArray.map((peer) => {
        // Prevent rendering invalid coordinates
        if (typeof peer.x !== 'number' || typeof peer.y !== 'number' || isNaN(peer.x) || isNaN(peer.y)) {
          return null;
        }

        const nameWithAnimal = getDisplayName(peer.name, peer.id);

        return (
          <div
            key={peer.id}
            id={`cursor-peer-${peer.id}`}
            className="absolute flex items-start select-none pointer-events-none transition-all duration-75 ease"
            style={{
              left: `${peer.x * 100}%`,
              top: `${peer.y * 100}%`,
            }}
          >
            {/* Elegant SVG Pointer Cursor */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] filter"
            >
              <path
                d="M4.5 3.00391V19.5039L9.65 14.3539L14.3 20.3539L17.3 18.0039L12.7 12.0039H19.5L4.5 3.00391Z"
                fill={peer.color}
                stroke="#ffffff"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>

            {/* Custom Styled Presence Name Chip: Rounded pill with whitespace nowrap */}
            <div
              className="ml-3 mt-2 px-3.5 py-1.5 text-white font-medium text-xs rounded-full shadow-[0_3px_8px_rgba(0,0,0,0.16)] flex items-center justify-center whitespace-nowrap opacity-95 transition-all duration-200"
              style={{
                backgroundColor: peer.color,
                fontFamily: '"Inter", sans-serif',
              }}
            >
              {nameWithAnimal}
            </div>
          </div>
        );
      })}
    </div>
  );
}
