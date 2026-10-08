import { useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ClassOutlinedIcon from '@mui/icons-material/ClassOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import LibraryBooksOutlinedIcon from '@mui/icons-material/LibraryBooksOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import { CLASSES, LESSONS, SUBJECTS, getLesson } from '@/data/catalog';
import { usePlatform } from '@/context/PlatformContext';
import { useAuth } from '@/context/AuthContext';
import { averageCoverage, lessonCoverage, statusCounts } from '@/services/progressService';
import { PageHeader, ProgressRing, ProgressRow } from '@/components/common';
import { ActivityList } from '@/pages/ActivityPage';
import { greeting } from '@/utils/format';

function StatCard({ icon, label, value, caption }: { icon: React.ReactNode; label: string; value: string; caption?: string }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary', mb: 1 }}>
          {icon}
          <Typography variant="body2" fontWeight={600}>
            {label}
          </Typography>
        </Stack>
        <Typography variant="h4" fontWeight={800}>
          {value}
        </Typography>
        {caption && (
          <Typography variant="caption" color="text.secondary">
            {caption}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { session } = useAuth();
  const { records, activities, ready } = usePlatform();

  const counts = useMemo(() => statusCounts(records), [records]);
  const overall = useMemo(() => averageCoverage(records), [records]);

  // The lesson most worth returning to: partly covered, most recently taught.
  const continueLesson = useMemo(() => {
    const inProgress = records
      .map((r) => r.lessonId)
      .filter((id, i, arr) => arr.indexOf(id) === i)
      .map((id) => ({ id, coverage: lessonCoverage(records, id) }))
      .filter((l) => l.coverage > 0 && l.coverage < 100);
    return inProgress.length ? getLesson(inProgress[0].id) : undefined;
  }, [records]);

  if (!ready || !session) {
    return (
      <Box>
        <Skeleton variant="text" width={280} height={48} />
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, mt: 3 }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={120} />
          ))}
        </Box>
        <Skeleton variant="rounded" height={280} sx={{ mt: 3 }} />
      </Box>
    );
  }

  const teacher = session.teacher;

  return (
    <Box>
      <PageHeader
        title={`${greeting()}, ${teacher.name.split(' ')[0]}`}
        subtitle={`${teacher.role} · Employee ID ${teacher.employeeId}`}
        actions={<Chip label={`${CLASSES.length} classes · ${SUBJECTS.length} subjects`} variant="outlined" />}
      />

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' } }}>
        <StatCard icon={<GroupsOutlinedIcon fontSize="small" />} label="My Classes" value={String(teacher.classIds.length)} caption="Assigned this year" />
        <StatCard icon={<ClassOutlinedIcon fontSize="small" />} label="Subjects" value={String(teacher.subjectIds.length)} caption="Mathematics, Science" />
        <StatCard
          icon={<LibraryBooksOutlinedIcon fontSize="small" />}
          label="Active Lessons"
          value={String(counts.in_progress + counts.not_started)}
          caption={`${LESSONS.length} lessons in total`}
        />
        <StatCard icon={<TrendingUpOutlinedIcon fontSize="small" />} label="Lessons Covered" value={`${overall}%`} caption={`${counts.completed} completed`} />
      </Box>

      {continueLesson && (
        <Card variant="outlined" sx={{ mt: 3 }}>
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between">
              <Stack direction="row" spacing={2} alignItems="center">
                <ProgressRing value={lessonCoverage(records, continueLesson.id)} />
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Continue teaching
                  </Typography>
                  <Typography variant="h6">{continueLesson.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Class {continueLesson.classId} · {continueLesson.chapter}
                  </Typography>
                </Box>
              </Stack>
              <Button component={RouterLink} to={`/lessons/${continueLesson.id}`} variant="contained" endIcon={<ArrowForwardIcon />}>
                Open lesson
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, mt: 3 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Teaching progress by class
            </Typography>
            {CLASSES.map((c) => (
              <ProgressRow key={c.id} label={c.name} value={averageCoverage(records, c.id)} />
            ))}
            <Divider sx={{ my: 2 }} />
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip size="small" label={`${counts.completed} completed`} color="success" variant="outlined" />
              <Chip size="small" label={`${counts.in_progress} in progress`} color="primary" variant="outlined" />
              <Chip size="small" label={`${counts.not_started} not started`} variant="outlined" />
            </Stack>
            <Button component={RouterLink} to="/progress" sx={{ mt: 2 }} endIcon={<ArrowForwardIcon />}>
              View full progress
            </Button>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent activity
            </Typography>
            <ActivityList activities={activities.slice(0, 6)} dense />
            <Button component={RouterLink} to="/activity" sx={{ mt: 1 }} endIcon={<ArrowForwardIcon />}>
              View all activity
            </Button>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
