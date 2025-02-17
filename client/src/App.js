import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CustomWallet from './CustomWallet';

const queryClient = new QueryClient();

function App() {
  const [number, setNumber] = useState(0);
  
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001');
    ws.onmessage = (event) => {
      setNumber(Number(event.data));
    };
    return () => ws.close();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="App">
        Streaming number: {number}
        <CustomWallet />
      </div>
    </QueryClientProvider>
  );
}

export default App;