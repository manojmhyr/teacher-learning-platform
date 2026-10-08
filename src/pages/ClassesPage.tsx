import { Link as RouterLink, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MeetingRoomOutlinedIcon from '@mui/icons-material/MeetingRoomOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import { CLASSES, SUBJECTS, getClass, getSubject, lessonsFor } from '@/data/catalog';
import { usePlatform } from '@/context/PlatformContext';
import { averageCoverage, lessonCoverage } from '@/services/progressService';
import { PageHeader, ProgressRow, SubjectIcon } from '@/components/common';
import { fmtDate } from '@/utils/format';

export function ClassesPage() {
  const { records } = usePlatform();

  return (
    <Box>
      <PageHeader
        title="My classes"
        subtitle="Classes assigned to you for the 2026–27 academic year."
        crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'My classes' }]}
      />
      <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        {CLASSES.map((cls) => {
          const lessons = lessonsFor(cls.id);
          const coverage = averageCoverage(records, cls.id);
          const last = records.filter((r) => r.classId === cls.id).map((r) => r.dateTaught).sort().pop();
          return (
            <Card key={cls.id} variant="outlined">
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Grade {cls.grade}
                    </Typography>
                    <Typography variant="h5" fontWeight={700}>
                      {cls.name}
                    </Typography>
                  </Box>
                  <Chip label={cls.id} color="primary" sx={{ fontWeight: 800 }} />
                </Stack>

                <Stack direction="row" spacing={0.75} sx={{ my: 1.5 }} flexWrap="wrap" useFlexGap>
                  {cls.subjectIds.map((sid) => (
                    <Chip key={sid} size="small" variant="outlined" label={getSubject(sid)?.name} icon={<SubjectIcon icon={getSubject(sid)!.icon} fontSize="small" />} />
                  ))}
                </Stack>

                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ color: 'text.secondary', mb: 1.5 }}>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <PeopleOutlineIcon sx={{ fontSize: 17 }} />
                    <Typography variant="body2">{cls.students} students</Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <MeetingRoomOutlinedIcon sx={{ fontSize: 17 }} />
                    <Typography variant="body2">{cls.room}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <ScheduleOutlinedIcon sx={{ fontSize: 17 }} />
                    <Typography variant="body2">{cls.schedule}</Typography>
                  </Stack>
                </Stack>

                <Divider sx={{ mb: 1 }} />
                <ProgressRow label={`${lessons.length} lessons`} value={coverage} caption={`${coverage}% complete`} />
                {last && (
                  <Typography variant="caption" color="text.secondary">
                    Last activity: {fmtDate(last)}
                  </Typography>
                )}

                <Button component={RouterLink} to={`/classes/${cls.id}`} variant="contained" fullWidth endIcon={<ArrowForwardIcon />} sx={{ mt: 2 }}>
                  Open class
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}

/** Subjects for one class, or all subjects when reached from the sidebar. */
export function SubjectsPage() {
  const { classId } = useParams();
  const { records } = usePlatform();
  const cls = getClass(classId);
  const subjects = cls ? SUBJECTS.filter((s) => cls.subjectIds.includes(s.id)) : SUBJECTS;

  return (
    <Box>
      <PageHeader
        title={cls ? `${cls.name} — subjects` : 'Subjects'}
        subtitle={cls ? `Subjects you teach to ${cls.name}.` : 'Subjects assigned to you across all classes.'}
        crumbs={
          cls
            ? [{ label: 'Dashboard', to: '/' }, { label: 'My classes', to: '/classes' }, { label: cls.name }]
            : [{ label: 'Dashboard', to: '/' }, { label: 'Subjects' }]
        }
      />
      <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        {subjects.map((subject) => {
          const scopeClass = cls?.id;
          const lessons = lessonsFor(scopeClass, subject.id);
          const coverage = averageCoverage(records, scopeClass, subject.id);
          const completed = lessons.filter((l) => lessonCoverage(records, l.id) >= 100).length;
          return (
            <Card key={subject.id} variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                  <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: 'action.hover', color: 'primary.main', display: 'grid', placeItems: 'center' }}>
                    <SubjectIcon icon={subject.icon} />
                  </Box>
                  <Box>
                    <Typography variant="h6">{subject.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {subject.chapters.length} chapters · {lessons.length} lessons
                    </Typography>
                  </Box>
                </Stack>
                <ProgressRow label="Coverage" value={coverage} />
                <Typography variant="caption" color="text.secondary">
                  {completed} of {lessons.length} lessons fully covered
                </Typography>
                <Button
                  component={RouterLink}
                  to={cls ? `/classes/${cls.id}/${subject.id}` : `/lessons?subject=${subject.id}`}
                  variant="contained"
                  fullWidth
                  endIcon={<ArrowForwardIcon />}
                  sx={{ mt: 2 }}
                >
                  View lessons
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}
