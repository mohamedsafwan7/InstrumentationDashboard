import { useState, useEffect, useRef } from 'react';

export interface MoistureData {
  time: number;
  pct: number;
  temp: number | null;
  humidity: number | null;
  pump: boolean;
}

export interface MoisturePoint extends MoistureData {
  t: number; // client-side timestamp for charting
}

export function useMoisture(url = 'ws://localhost:8080') {
  const [data, setData] = useState<MoistureData | null>(null);
  const [connected, setConnected] = useState(false);
  const [history, setHistory] = useState<MoisturePoint[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (e: MessageEvent) => {
      try {
        const d = JSON.parse(e.data) as MoistureData;
        setData(d);
        setHistory(h => [...h.slice(-59), { ...d, t: Date.now() }]);
      } catch {
        /* ignore non-JSON lines */
      }
    };

    return () => ws.close();
  }, [url]);

  return { data, connected, history };
}