import { useEffect, useRef, useState, useCallback } from 'react';

// Pre-defined list of adorable animals for guest accounts
const ANIMALS = [
  "Gentle Giraffe", "Spunky Tiger", "Lovely Platypus", "Happy Capybara", 
  "Friendly Axolotl", "Curious Penguin", "Sunny Meerkat", "Glow Hedgehog", 
  "Kind Koala", "Jolly Otter", "Bright Fox", "Sleepy Sloth", 
  "Dapper Badger", "Cosmic Dolphin", "Majestic Lion", "Clever Cheetah"
];

// Aesthetic vibrant color palette
const COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#14B8A6"  // Teal
];

function getOrGenerateGuest() {
  if (typeof window === 'undefined') {
    return { id: 'guest', name: 'Anonymous', color: COLORS[0] };
  }

  let guestId = sessionStorage.getItem("presence_guest_id");
  if (!guestId) {
    guestId = Math.random().toString(36).substring(2, 10);
    sessionStorage.setItem("presence_guest_id", guestId);
  }

  let guestName = sessionStorage.getItem("presence_guest_name");
  if (!guestName || guestName === "Anonymous" || guestName === "Google User") {
    const randomAnimal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    guestName = randomAnimal;
    sessionStorage.setItem("presence_guest_name", guestName);
  }

  let guestColor = sessionStorage.getItem("presence_guest_color");
  if (!guestColor) {
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    guestColor = randomColor;
    sessionStorage.setItem("presence_guest_color", guestColor);
  }

  return { id: guestId, name: guestName, color: guestColor };
}

export interface PeerState {
  id: string;
  name: string;
  color: string;
  x?: number;
  y?: number;
}

export function usePresence(userProfile: any, envId: string | null) {
  const [localUser, setLocalUser] = useState(() => {
    const guest = getOrGenerateGuest();
    return { id: guest.id, name: guest.name, color: guest.color };
  });

  const [peers, setPeers] = useState<Record<string, PeerState>>({});
  const socketRef = useRef<WebSocket | null>(null);
  const lastSentRef = useRef(0);

  // Sync logged in user profile to visual identity
  useEffect(() => {
    if (userProfile) {
      const email = userProfile.email || "";
      const userId = userProfile.sub || userProfile.id || email || "user-" + Math.random().toString(36).substring(2, 6);
      
      // Select stable color based on string hash of client ID
      let hash = 0;
      for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
      }
      const colorIndex = Math.abs(hash) % COLORS.length;

      setLocalUser({
        id: userId,
        name: userProfile.name || userProfile.given_name || "Google User",
        color: COLORS[colorIndex]
      });
    } else {
      const guest = getOrGenerateGuest();
      setLocalUser({ id: guest.id, name: guest.name, color: guest.color });
    }
  }, [userProfile]);

  // Compute room ID prioritizing environment ID to align owner and coworkers in same visual room, falling back to share slug or default
  const roomId = (() => {
    if (envId) return envId;
    if (typeof window === 'undefined') return 'default';
    const params = new URLSearchParams(window.location.search);
    const shareSlug = params.get('share');
    return shareSlug || "default";
  })();

  // Main websocket connection hook
  useEffect(() => {
    if (!roomId || !localUser.id) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socketUrl = `${protocol}//${window.location.host}`;
    
    let socket: WebSocket;
    let reconnectTimeout: any;

    function connect() {
      try {
        socket = new WebSocket(socketUrl);
        socketRef.current = socket;

        socket.onopen = () => {
          socket.send(JSON.stringify({
            type: 'join',
            roomId,
            userId: localUser.id,
            name: localUser.name,
            color: localUser.color
          }));
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'init_presence') {
              const initialPeers: Record<string, PeerState> = {};
              data.users.forEach((u: any) => {
                initialPeers[u.id] = u;
              });
              setPeers(initialPeers);
            } else if (data.type === 'user_joined') {
              const { user } = data;
              setPeers(prev => ({
                ...prev,
                [user.id]: {
                  id: user.id,
                  name: user.name,
                  color: user.color
                }
              }));
            } else if (data.type === 'cursor_update') {
              const { userId, x, y, name, color } = data;
              setPeers(prev => {
                const existing = prev[userId] || {
                  id: userId,
                  name: name || "Anonymous",
                  color: color || "#3B82F6",
                  x,
                  y
                };
                return {
                  ...prev,
                  [userId]: {
                    ...existing,
                    name: name || existing.name,
                    color: color || existing.color,
                    x,
                    y
                  }
                };
              });
            } else if (data.type === 'user_left') {
              const { userId } = data;
              setPeers(prev => {
                const next = { ...prev };
                delete next[userId];
                return next;
              });
            }
          } catch (err) {
            console.error("Failed to parse websocket message", err);
          }
        };

        socket.onclose = () => {
          setPeers({});
          reconnectTimeout = setTimeout(() => {
            connect();
          }, 3000);
        };

        socket.onerror = (err) => {
          console.warn("WebSocket presence error:", err);
        };
      } catch (err) {
        console.error("WebSocket setup error:", err);
      }
    }

    connect();

    return () => {
      if (socket) {
        socket.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [roomId, localUser.id, localUser.name, localUser.color]);

  // Update cursor handler
  const wasActiveRef = useRef(false);

  const sendCursorUpdate = useCallback((clientX: number, clientY: number, forceNull = false) => {
    const now = Date.now();
    if (!forceNull && now - lastSentRef.current < 50) return; // limit to 20Hz for network performance
    lastSentRef.current = now;

    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      if (forceNull) {
        if (wasActiveRef.current) {
          socket.send(JSON.stringify({
            type: 'cursor',
            x: null,
            y: null
          }));
          wasActiveRef.current = false;
        }
        return;
      }

      const canvasEl = document.getElementById("canvas-main-viewport");
      if (!canvasEl) return;

      const rect = canvasEl.getBoundingClientRect();
      const isInside = (
        clientX >= rect.left && 
        clientX <= rect.right && 
        clientY >= rect.top && 
        clientY <= rect.bottom
      );

      if (isInside) {
        // Calculate coordinate normalized relative to the canvas container
        const x = (clientX - rect.left) / rect.width;
        const y = (clientY - rect.top) / rect.height;

        socket.send(JSON.stringify({
          type: 'cursor',
          x,
          y
        }));
        wasActiveRef.current = true;
      } else {
        if (wasActiveRef.current) {
          socket.send(JSON.stringify({
            type: 'cursor',
            x: null,
            y: null
          }));
          wasActiveRef.current = false;
        }
      }
    }
  }, []);

  // Attach mouse tracking on the current page window and listen to posted events from cross-origin iframes
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      sendCursorUpdate(e.clientX, e.clientY);
    };

    const handleMouseLeave = () => {
      sendCursorUpdate(0, 0, true); // force null/inactive
    };

    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'iframe_mousemove') {
        const iframes = document.querySelectorAll('iframe');
        let matchedIframe: HTMLIFrameElement | null = null;
        for (let i = 0; i < iframes.length; i++) {
          if (iframes[i].contentWindow === e.source) {
            matchedIframe = iframes[i];
            break;
          }
        }
        if (matchedIframe) {
          const rect = matchedIframe.getBoundingClientRect();
          const clientX = rect.left + e.data.clientX;
          const clientY = rect.top + e.data.clientY;
          sendCursorUpdate(clientX, clientY);
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('blur', handleMouseLeave);
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('blur', handleMouseLeave);
      window.removeEventListener('message', handleMessage);
    };
  }, [sendCursorUpdate]);

  // Register an iframe elements mouse tracking
  const registerIframe = useCallback((iframe: HTMLIFrameElement | null) => {
    if (!iframe) return;

    if ((iframe as any).__hasPresenceListener) {
      return;
    }
    (iframe as any).__hasPresenceListener = true;

    const handleIframeLoad = () => {
      try {
        const iframeDoc = iframe.contentWindow?.document;
        if (!iframeDoc) return;

        let lastIframeSent = 0;
        const handleIframeMouseMove = (e: MouseEvent) => {
          const now = Date.now();
          if (now - lastIframeSent < 50) return;
          lastIframeSent = now;

          const rect = iframe.getBoundingClientRect();
          const clientX = rect.left + e.clientX;
          const clientY = rect.top + e.clientY;
          sendCursorUpdate(clientX, clientY);
        };

        // Suppress pointer events inside iframe selectively if we want, but tracking mousemove is completely passive so no blocking!
        iframeDoc.addEventListener('mousemove', handleIframeMouseMove);
      } catch (err) {
        // Cross origin or window closed
      }
    };

    // Always listen to load event for future document loads/updates, e.g. when srcDoc updates
    iframe.addEventListener('load', handleIframeLoad);

    if (iframe.contentWindow?.document.readyState === 'complete') {
      handleIframeLoad();
    }
  }, [sendCursorUpdate]);

  return { peers, localUser, registerIframe };
}
