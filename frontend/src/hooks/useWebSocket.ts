import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketOptions {
  url: string;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

interface WebSocketState {
  isConnected: boolean;
  error: Event | null;
  reconnectCount: number;
}

export const useWebSocket = <T = any>({
  url,
  reconnectAttempts = 3,
  reconnectInterval = 5000,
  onOpen,
  onClose,
  onError,
}: WebSocketOptions) => {
  const ws = useRef<WebSocket | null>(null);
  const [data, setData] = useState<T | null>(null);
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    error: null,
    reconnectCount: 0,
  });

  const connect = useCallback(() => {
    try {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        setState(prev => ({
          ...prev,
          isConnected: true,
          error: null,
          reconnectCount: 0,
        }));
        onOpen?.();
      };

      ws.current.onclose = () => {
        setState(prev => ({ ...prev, isConnected: false }));
        onClose?.();

        // Attempt reconnection if we haven't exceeded the limit
        if (state.reconnectCount < reconnectAttempts) {
          setTimeout(() => {
            setState(prev => ({
              ...prev,
              reconnectCount: prev.reconnectCount + 1,
            }));
            connect();
          }, reconnectInterval);
        }
      };

      ws.current.onerror = (error: Event) => {
        setState(prev => ({ ...prev, error }));
        onError?.(error);
      };

      ws.current.onmessage = (event: MessageEvent) => {
        try {
          const parsedData = JSON.parse(event.data) as T;
          setData(parsedData);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      setState(prev => ({
        ...prev,
        error: error as Event,
        isConnected: false,
      }));
    }
  }, [url, reconnectAttempts, reconnectInterval, onOpen, onClose, onError, state.reconnectCount]);

  useEffect(() => {
    connect();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message: string | object) => {
    if (ws.current && state.isConnected) {
      const stringifiedMessage = typeof message === 'string' 
        ? message 
        : JSON.stringify(message);
      ws.current.send(stringifiedMessage);
    } else {
      console.warn('WebSocket is not connected');
    }
  }, [state.isConnected]);

  return {
    sendMessage,
    data,
    isConnected: state.isConnected,
    error: state.error,
    reconnectCount: state.reconnectCount,
  };
};
