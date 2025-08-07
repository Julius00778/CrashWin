import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export function useWebSocket() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);

  useEffect(() => {
    const connect = () => {
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        console.log('🔗 Attempting WebSocket connection to:', wsUrl);
        console.log('Current location:', window.location.host);
        
        const ws = new WebSocket(wsUrl);

        ws.onopen = async () => {
          console.log('WebSocket connected');
          setIsConnected(true);
          reconnectAttemptsRef.current = 0;
          
          // Send authentication message
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              ws.send(JSON.stringify({
                type: 'authenticate',
                userId: user.id
              }));
              console.log('Authenticated with user ID:', user.id);
            } else {
              // Use default user for non-authenticated users (matches server storage)
              ws.send(JSON.stringify({
                type: 'authenticate',
                userId: 'default-user'
              }));
              console.log('Authenticated as default user');
            }
          } catch (error) {
            console.error('Authentication error:', error);
          }
        };

        ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          console.log('Was clean:', event.wasClean);
          setIsConnected(false);
          setSocket(null);

          // Reconnect with exponential backoff
          if (reconnectAttemptsRef.current < 5) {
            const delay = Math.pow(2, reconnectAttemptsRef.current) * 1000;
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttemptsRef.current++;
              connect();
            }, delay);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket connection error:', error);
          console.error('Failed to connect to:', wsUrl);
          setIsConnected(false);
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          console.log('🔗 WebSocket Hook - Received:', data.type, data);
        };

        setSocket(ws);
      } catch (error) {
        console.error('Failed to create WebSocket:', error);
      }
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        socket.close();
      }
    };
  }, []);

  return { socket, isConnected };
}
