import { useCallback, useEffect, useState } from 'react';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';

import { _tasks, _posts, _timeline } from 'src/_mock';
import { DashboardContent } from 'src/layouts/dashboard';

import { AnalyticsNews } from '../analytics-news';
import { AnalyticsTasks } from '../analytics-tasks';
import { AnalyticsCurrentVisits } from '../analytics-current-visits';
import { AnalyticsOrderTimeline } from '../analytics-order-timeline';
import { AnalyticsWebsiteVisits } from '../analytics-website-visits';
import { AnalyticsWidgetSummary } from '../analytics-widget-summary';
import { AnalyticsTrafficBySite } from '../analytics-traffic-by-site';
import { AnalyticsCurrentSubject } from '../analytics-current-subject';
import { AnalyticsConversionRates } from '../analytics-conversion-rates';

// ----------------------------------------------------------------------

export const useMessages = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const websocket = new WebSocket('ws://localhost:3001');

    websocket.onopen = () => {
      console.log('Connected to server');
      ws?.send('start');
      setIsConnected(true);
    };

    websocket.onmessage = (event) => {
      console.log('Received:', event.data);
      setMessages(prev => [...prev, event.data]);
    };

    websocket.onclose = () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    };

    setWs(websocket);

    return () => {
      websocket.close();
      setWs(null);
    };
  }, []);

  const sendMessage = useCallback((message: string) => {
    if (ws && isConnected) {
      ws.send(message);
    } else {
      console.warn('WebSocket is not connected');
    }
  }, [ws, isConnected]);

  return {
    messages,
    isConnected,
    sendMessage
  };
};

// Usage example:
export function OverviewAnalyticsView() {

  const { messages, sendMessage } = useMessages();
  const tasks = messages.map((message: any) => ({ id: message, title: message, status: 'done', name: message }));

  return (
    <DashboardContent maxWidth="xl">
      <Grid container spacing={3}>
        <Grid xs={12} md={6} lg={8}>
          <AnalyticsTasks title="Opportunities" list={tasks} />
        </Grid>
        <Grid xs={12} md={6} lg={4}>
          <AnalyticsTrafficBySite
            sendMessage={sendMessage}
            title=""
            list={[
              { value: 'start', label: 'Start', total: 323234 },
              { value: 'stop', label: 'Stop', total: 341212 },
            ]}
          />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
