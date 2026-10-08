import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { CLASSES, SUBJECTS } from '@/data/catalog';
import { useAuth } from '@/context/AuthContext';
import { usePlatform } from '@/context/PlatformContext';
import { useSecurity } from '@/context/SecurityContext';
import { useToast } from '@/context/ToastContext';
import { contentProvider } from '@/services/content';
import { config, isDemoContent } from '@/config/env';
import { EmptyState, PageHeader } from '@/components/common';
import { fmtDate } from '@/utils/format';

export function ProfilePage() {
  const { session } = useAuth();
  if (!session) return null;
  const t = session.teacher;
  return (
    <Box>
      <PageHeader title="Profile" crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Profile' }]} />
      <Card variant="outlined">
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ sm: 'center' }}>
            <Avatar sx={{ width: 76, height: 76, bgcolor: 'primary.main', fontSize: 26, fontWeight: 800 }}>
              {t.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                {t.name}
              </Typography>
              <Typography color="text.secondary">{t.role}</Typography>
              <Typography variant="body2" color="text.secondary">
                Employee ID {t.employeeId} · {t.email}
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Classes
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {t.classIds.map((id) => (
                  <Chip key={id} label={CLASSES.find((c) => c.id === id)?.name ?? id} component={RouterLink} to={`/classes/${id}`} clickable />
                ))}
              </Stack>
            </Box>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Subjects
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {t.subjectIds.map((id) => (
                  <Chip key={id} label={SUBJECTS.find((s) => s.id === id)?.name ?? id} variant="outlined" />
                ))}
              </Stack>
            </Box>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3 }}>
            Joined {fmtDate(t.joinedOn)}. Profile details are managed by your school administrator.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

export function SettingsPage() {
  const { colorPref, setColorPref, resetDemo } = usePlatform();
  const { protection, captureAttempts } = useSecurity();
  const { toast } = useToast();
  const [health, setHealth] = useState<{ ok: boolean; detail: string } | null>(null);

  useEffect(() => {
    let alive = true;
    void contentProvider.healthCheck().then((h) => alive && setHealth(h));
    return () => {
      alive = false;
    };
  }, []);

  const levelLabel = {
    enforced: 'Enforced by the operating system',
    partial: 'Partially enforced',
    'deterrent-only': 'Deterrents only',
  }[protection.level];

  return (
    <Box>
      <PageHeader title="Settings" crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Settings' }]} />

      <Stack spacing={2.5}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Appearance
            </Typography>
            <TextField select size="small" label="Theme" value={colorPref} onChange={(e) => setColorPref(e.target.value as 'light' | 'dark' | 'system')} sx={{ minWidth: 200 }}>
              <MenuItem value="system">Match system</MenuItem>
              <MenuItem value="light">Light</MenuItem>
              <MenuItem value="dark">Dark</MenuItem>
            </TextField>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <ShieldOutlinedIcon color="primary" />
              <Typography variant="h6">Content protection</Typography>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mb: 1.5 }} flexWrap="wrap" useFlexGap>
              <Chip
                label={levelLabel}
                color={protection.level === 'enforced' ? 'success' : protection.level === 'partial' ? 'primary' : 'default'}
                icon={protection.level === 'enforced' ? <CheckCircleOutlineIcon /> : <ErrorOutlineIcon />}
              />
              <Chip label={`Platform: ${protection.platform}`} variant="outlined" />
              <Chip label={`Capture attempts this session: ${captureAttempts}`} variant="outlined" />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {protection.detail}
            </Typography>
            {protection.level !== 'enforced' && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Screenshot blocking is enforced by the operating system only in the Android app. Install the mobile app for the strongest protection.
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Content source
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1.5 }} flexWrap="wrap" useFlexGap>
              <Chip label={contentProvider.label} color={isDemoContent ? 'default' : 'primary'} icon={<LockOutlinedIcon />} />
              <Chip label={`Build ${config.buildId}`} variant="outlined" />
            </Stack>
            {health && (
              <Alert severity={health.ok ? 'success' : 'warning'} sx={{ mb: 1 }}>
                {health.detail}
              </Alert>
            )}
            {isDemoContent && (
              <Typography variant="body2" color="text.secondary">
                Set <code>VITE_CONTENT_SOURCE=azure</code> with the Azure values in <code>.env.local</code> to serve lesson plans from Azure Blob
                Storage. See <code>docs/AZURE_SETUP.md</code>.
              </Typography>
            )}
          </CardContent>
        </Card>

        {isDemoContent && (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Demo data
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Restores teaching records, activity and highlights to their original state. Useful before a client presentation.
              </Typography>
              <Button
                variant="outlined"
                onClick={() => {
                  resetDemo();
                  toast('Demo data reset.');
                }}
              >
                Reset demo data
              </Button>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Box>
  );
}

export function NotFoundPage() {
  return (
    <EmptyState
      title="Page not found"
      description="The page you were looking for does not exist or you do not have access to it."
      action={
        <Button component={RouterLink} to="/" variant="contained">
          Back to dashboard
        </Button>
      }
    />
  );
}
