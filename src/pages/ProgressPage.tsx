import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { CLASSES, SUBJECTS, getClass } from '@/data/catalog';
import { usePlatform } from '@/context/PlatformContext';
import { averageCoverage, chapters, statusCounts } from '@/services/progressService';
import { PageHeader, ProgressRing, ProgressRow } from '@/components/common';

export function ProgressPage() {
  const { records } = usePlatform();
  const [classId, setClassId] = useState(CLASSES[0].id);
  const [subjectId, setSubjectId] = useState('math');

  const cls = getClass(classId);
  const availableSubjects = useMemo(() => SUBJECTS.filter((s) => cls?.subjectIds.includes(s.id)), [cls]);
  const effectiveSubject = availableSubjects.some((s) => s.id === subjectId) ? subjectId : availableSubjects[0]?.id ?? 'math';

  const counts = useMemo(() => statusCounts(records, classId, effectiveSubject), [records, classId, effectiveSubject]);
  const grouped = useMemo(() => chapters(records, classId, effectiveSubject), [records, classId, effectiveSubject]);
  const overall = useMemo(() => averageCoverage(records, classId, effectiveSubject), [records, classId, effectiveSubject]);

  return (
    <Box>
      <PageHeader
        title="Teaching progress"
        subtitle="Coverage by class, subject, chapter and lesson, derived from your saved teaching records."
        crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Teaching progress' }]}
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2.5 }}>
        <TextField select size="small" label="Class" value={classId} onChange={(e) => setClassId(e.target.value)} sx={{ minWidth: 180 }}>
          {CLASSES.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField select size="small" label="Subject" value={effectiveSubject} onChange={(e) => setSubjectId(e.target.value)} sx={{ minWidth: 180 }}>
          {availableSubjects.map((s) => (
            <MenuItem key={s.id} value={s.id}>
              {s.name}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, mb: 3 }}>
        {[
          { label: 'Total lessons', value: counts.total },
          { label: 'Completed', value: counts.completed },
          { label: 'In progress', value: counts.in_progress },
          { label: 'Not started', value: counts.not_started },
        ].map((stat) => (
          <Card key={stat.label} variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                {stat.label}
              </Typography>
              <Typography variant="h4" fontWeight={800}>
                {stat.value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={3} alignItems="center">
            <ProgressRing value={overall} size={88} />
            <Box>
              <Typography variant="h6">
                {cls?.name} · {SUBJECTS.find((s) => s.id === effectiveSubject)?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average coverage across {counts.total} lessons in this subject.
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            By chapter
          </Typography>
          <Stack divider={<Divider flexItem />} spacing={2}>
            {grouped.map((chapter) => (
              <Box key={chapter.chapter} sx={{ pt: 1 }}>
                <ProgressRow label={chapter.chapter} value={chapter.coverage} />
                <Box sx={{ pl: { sm: 2 }, mt: 1 }}>
                  {chapter.lessons.map((l) => (
                    <ProgressRow key={l.id} label={l.title} value={l.coverage} />
                  ))}
                </Box>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
