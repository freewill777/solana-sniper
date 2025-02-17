import type { CardProps } from '@mui/material/Card';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';

import { fShortenNumber } from 'src/utils/format-number';

import { varAlpha } from 'src/theme/styles';
import { Glow, GlowCapture } from '@codaworks/react-glow';
import { Iconify } from 'src/components/iconify';
import { Button } from '@mui/material';
import { useMessages } from './view/overview-analytics-view';

// ----------------------------------------------------------------------

type Props = CardProps & {
  title?: string;
  subheader?: string;
  list: { value: string; label: string; total: number }[];
  sendMessage: (message: string) => void;
};

export function AnalyticsTrafficBySite({ title, subheader, list, sx, sendMessage, ...other }: Props) {

  const handleStartBot = () => {
    sendMessage('start');
  };
  const handleStopBot = () => {
    sendMessage('stop');
  };
  return (
    <Card sx={sx} {...other} elevation={0}>
      <Box display="grid" gap={2} gridTemplateColumns="repeat(2, 1fr)" sx={{ p: 3 }}>
        {list.map((site) => (
          <Button onClick={site.value === 'start' ? handleStartBot : handleStopBot}>
            <Box
              key={site.label}
              sx={(theme) => ({
                py: 2.5,
                display: 'flex',
                borderRadius: 1.5,
                textAlign: 'center',
                alignItems: 'center',
                flexDirection: 'column',
                border: `solid 1px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.12)}`,
                width: '100%',
              })}
            >
              {site.value === 'start' && (
                <Iconify icon="eva:play-circle-fill" color="#1877F2" width={32} />
              )}
              {site.value === 'stop' && <Iconify icon="ci:stop-sign" width={32} />}
              {site.value === 'linkedin' && (
                <Iconify icon="eva:linkedin-fill" color="#0A66C2" width={32} />
              )}
              {site.value === 'twitter' && <Iconify icon="ri:twitter-x-fill" width={32} />}

              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {site.label}
              </Typography>
            </Box>
          </Button>

        ))}
      </Box>
    </Card>
  );
}
