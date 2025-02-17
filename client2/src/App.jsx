import { useState, useEffect, useRef } from 'react';
import CustomWallet from './CustomWallet';

function NumbersList({ numbers }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [numbers]);

  return (
    <div 
      ref={containerRef}
      className="bg-white p-4 rounded-lg shadow" 
      style={{ maxHeight: '160px', overflowY:'scroll' }}
    >
      <h2 className="text-lg font-semibold mb-4">Streaming Numbers</h2>
      <ul className="space-y-2">
        {numbers.map((num, index) => (
          <li key={index} className="p-2 bg-gray-50 rounded">
            {num} --
          </li>
        ))}
      </ul>
    </div>
  );
}

function App() {
  const [number, setNumber] = useState(0);
  const [numbers, setNumbers] = useState([]);
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001');
    ws.onmessage = (event) => {
      console.log('Received:', event.data);
      setNumber(Number(event.data));
      setNumbers((prevNumbers) => [...prevNumbers, event.data]);
    };
    return () => ws.close();
  }, []);

  return (
    <div className="App">
      Streaming number: {number}
      <CustomWallet />
      <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow-sm">
              <div className="max-w-7xl mx-auto px-4 py-3">
                <h1 className="text-xl font-semibold">Solana Wallet Login</h1>
              </div>
            </nav>
            <div className="flex max-w-7xl mx-auto">
              <div className="w-1/2 p-6">
                {/* <WalletConnection /> */}
              </div>
              <div className="w-1/2 p-6">
                <NumbersList numbers={numbers} />
              </div>
            </div>
          </div>
    </div>

    
  );
}

export default App;