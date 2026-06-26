import { useState, useEffect, useRef } from 'react';

export function useMoisture(url = 'ws://localhost:8080') {
  const [data, setData] = useState(null);
  const [connected, setConnected] = useState(false);
  const [history, setHistory] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (e) => {
      const d = JSON.parse(e.data);
      setData(d);
      setHistory(h => [...h.slice(-59), { ...d, t: Date.now() }]);
    };
    return () => ws.close();
  }, [url]);

  return { data, connected, history };
}