import { useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import SportsEsportsOutlinedIcon from '@mui/icons-material/SportsEsportsOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import VideoCallOutlinedIcon from '@mui/icons-material/VideoCallOutlined';
import { CLASSES, LESSONS, SUBJECTS, TEACHER, getClass, lessonsFor } from '@/data/catalog';
import { usePlatform } from '@/context/PlatformContext';
import { useToast } from '@/context/ToastContext';
import { averageCoverage } from '@/services/progressService';
import { config, isDemoContent } from '@/config/env';
import { PageHeader } from '@/components/common';

const ACTIONS = [
  { key: 'plan', label: 'Upload lesson plan', icon: <CloudUploadOutlinedIcon />, hint: 'JSON or DOCX converted to protected blocks on upload' },
  { key: 'video', label: 'Upload video', icon: <VideoCallOutlinedIcon />, hint: 'Transcoded to HLS and served via short-lived SAS' },
  { key: 'resource', label: 'Add resource', icon: <FolderOutlinedIcon />, hint: 'Worksheets and references, view-only for teachers' },
  { key: 'qna', label: 'Manage Q&A', icon: <QuizOutlinedIcon />, hint: 'Questions shown to teachers in the lesson' },
  { key: 'game', label: 'Manage game', icon: <SportsEsportsOutlinedIcon />, hint: 'Question bank for the in-lesson activity' },
  { key: 'topics', label: 'Manage coverage topics', icon: <FactCheckOutlinedIcon />, hint: 'The checklist teachers record against' },
];

export function AdminPage() {
  const { records } = usePlatform();
  const { toast } = useToast();

  const [classId, setClassId] = useState(CLASSES[0].id);
  const [subjectId, setSubjectId] = useState('math');
  const [lessonId, setLessonId] = useState(LESSONS[0].id);
  const [uploadFor, setUploadFor] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const cls = getClass(classId);
  const subjects = useMemo(() => SUBJECTS.filter((s) => cls?.subjectIds.includes(s.id)), [cls]);
  const effectiveSubject = subjects.some((s) => s.id === subjectId) ? subjectId : subjects[0]?.id ?? 'math';
  const lessons = useMemo(() => lessonsFor(classId, effectiveSubject), [classId, effectiveSubject]);
  const effectiveLesson = lessons.some((l) => l.id === lessonId) ? lessonId : lessons[0]?.id;

  const runUpload = (label: string) => {
    setUploadFor(label);
    setProgress(0);
    const timer = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          window.clearInterval(timer);
          window.setTimeout(() => {
            setUploadFor(null);
            toast(`${label} completed. In a live deployment the file would now be in Azure Blob Storage.`);
          }, 450);
          return 100;
        }
        return p + 12;
      });
    }, 180);
  };

  return (
    <Box>
      <PageHeader
        title="Admin console"
        subtitle="Manage the content teachers see. This area is restricted to administrators."
        crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Admin console' }]}
        actions={<Chip label="Administrator view" color="secondary" />}
      />

      {isDemoContent && (
        <Alert severity="info" sx={{ mb: 2.5 }}>
          This console is a working prototype of content management. Uploads are simulated and nothing is persisted. With{' '}
          <code>VITE_CONTENT_SOURCE=azure</code> configured, these actions write to the <code>{config.azureContainer}</code> container.
        </Alert>
      )}

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, mb: 3 }}>
        {[
          { label: 'Teachers', value: 1 },
          { label: 'Classes', value: CLASSES.length },
          { label: 'Subjects', value: SUBJECTS.length },
          { label: 'Lessons', value: LESSONS.length },
        ].map((s) => (
          <Card key={s.label} variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                {s.label}
              </Typography>
              <Typography variant="h4" fontWeight={800}>
                {s.value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Content management
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2.5 }}>
            <TextField select size="small" label="Class" value={classId} onChange={(e) => setClassId(e.target.value)} fullWidth>
              {CLASSES.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField select size="small" label="Subject" value={effectiveSubject} onChange={(e) => setSubjectId(e.target.value)} fullWidth>
              {subjects.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField select size="small" label="Lesson" value={effectiveLesson ?? ''} onChange={(e) => setLessonId(e.target.value)} fullWidth>
              {lessons.map((l) => (
                <MenuItem key={l.id} value={l.id}>
                  {l.title}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)' } }}>
            {ACTIONS.map((a) => (
              <Card key={a.key} variant="outlined">
                <CardContent>
                  <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1, color: 'primary.main' }}>
                    {a.icon}
                    <Typography fontWeight={700} color="text.primary">
                      {a.label}
                    </Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', minHeight: 34 }}>
                    {a.hint}
                  </Typography>
                  <Button size="small" variant="outlined" fullWidth sx={{ mt: 1.5 }} onClick={() => runUpload(a.label)}>
                    Open
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Box>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Teaching progress overview
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {TEACHER.name} · {TEACHER.employeeId}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {CLASSES.map((c) => (
              <Chip key={c.id} label={`${c.name}: ${averageCoverage(records, c.id)}%`} variant="outlined" />
            ))}
          </Stack>
        </CardContent>
      </Card>

      <Dialog open={Boolean(uploadFor)} maxWidth="xs" fullWidth>
        <DialogTitle>{uploadFor}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Uploading to {config.azureContainer}/{effectiveLesson}…
          </Typography>
          <LinearProgress variant="determinate" value={progress} />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {progress}%
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadFor(null)} disabled={progress >= 100}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
