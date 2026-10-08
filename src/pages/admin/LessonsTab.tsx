import { useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import LibraryAddOutlinedIcon from '@mui/icons-material/LibraryAddOutlined';
import SearchIcon from '@mui/icons-material/Search';
import { useDirectory } from '@/context/DirectoryContext';
import { usePlatform } from '@/context/PlatformContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { DEFAULT_TOPICS } from '@/data/catalog';
import { deriveBlobPrefix, deriveContentKey, deriveLessonId, displayLocation, validateLessonTitle, type ContentScope } from '@/services/lessonKey';
import type { Lesson } from '@/types';

/**
 * Lesson management.
 *
 * An admin types a lesson TITLE and the system derives the id, the content key
 * and the Azure folder — nobody types a storage path. The derived location is
 * shown live while typing, so it is obvious where content will go.
 */
export function LessonsTab() {
  const directory = useDirectory();
  const { session } = useAuth();
  const { log } = usePlatform();
  const { toast } = useToast();

  const [query, setQuery] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [uploadFor, setUploadFor] = useState<Lesson | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return directory.lessons
      .filter((l) => (classFilter === 'all' ? true : l.classId === classFilter))
      .filter((l) => !q || l.title.toLowerCase().includes(q) || l.contentKey.includes(q))
      .sort((a, b) => a.classId.localeCompare(b.classId) || a.title.localeCompare(b.title));
  }, [directory.lessons, query, classFilter]);

  const togglePublish = (lesson: Lesson) => {
    directory.setPublished(lesson.id, !lesson.published);
    if (session) log(session.user.id, 'admin', `${lesson.published ? 'Unpublished' : 'Published'} “${lesson.title}” for ${lesson.classId}`);
    toast(lesson.published ? 'Lesson hidden from teachers.' : 'Lesson published to assigned teachers.');
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search lessons or folders"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ maxWidth: { sm: 300 } }}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <TextField select size="small" value={classFilter} onChange={(e) => setClassFilter(e.target.value)} sx={{ minWidth: 150 }}>
          <MenuItem value="all">All classes</MenuItem>
          {directory.classes.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.name}
            </MenuItem>
          ))}
        </TextField>
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" startIcon={<LibraryAddOutlinedIcon />} onClick={() => setCreateOpen(true)}>
          Add lesson
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Lesson</TableCell>
              <TableCell>Class</TableCell>
              <TableCell>Azure folder</TableCell>
              <TableCell align="right">Topics</TableCell>
              <TableCell align="center">Published</TableCell>
              <TableCell align="right">Content</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((l) => {
              const shared = directory.lessons.filter((o) => o.contentKey === l.contentKey);
              return (
                <TableRow key={l.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {l.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {l.chapter} · {l.durationMin} min · {l.difficulty}
                    </Typography>
                  </TableCell>
                  <TableCell>{l.classId}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <FolderOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" fontFamily="monospace">
                        {displayLocation(l.blobPrefix)}
                      </Typography>
                      {shared.length > 1 && (
                        <Tooltip title={`Shared with ${shared.filter((o) => o.id !== l.id).map((o) => o.classId).join(', ')}`}>
                          <Chip size="small" label={`shared ×${shared.length}`} variant="outlined" />
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell align="right">{l.topics.length}</TableCell>
                  <TableCell align="center">
                    <Switch size="small" checked={l.published} onChange={() => togglePublish(l)} inputProps={{ 'aria-label': `Publish ${l.title}` }} />
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" startIcon={<CloudUploadOutlinedIcon />} onClick={() => setUploadFor(l)}>
                      Upload
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>

      <Alert severity="info" sx={{ mt: 2 }}>
        Teachers see a lesson only when it is <strong>published</strong> and they are assigned to its class and subject. Build a lesson fully, then
        publish it.
      </Alert>

      <CreateLessonDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      {uploadFor && <UploadDialog lesson={uploadFor} onClose={() => setUploadFor(null)} />}
    </Box>
  );
}

function CreateLessonDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const directory = useDirectory();
  const { session } = useAuth();
  const { log } = usePlatform();
  const { toast } = useToast();

  const [classIds, setClassIds] = useState<string[]>([]);
  const [subjectId, setSubjectId] = useState('math');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [chapter, setChapter] = useState('');
  const [durationMin, setDurationMin] = useState(45);
  const [difficulty, setDifficulty] = useState<Lesson['difficulty']>('Beginner');
  const [topics, setTopics] = useState<string[]>(DEFAULT_TOPICS);
  const [newTopic, setNewTopic] = useState('');
  const [scope, setScope] = useState<ContentScope>('shared');
  const [linkExisting, setLinkExisting] = useState(false);
  const [existingKey, setExistingKey] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const subject = directory.subjects.find((s) => s.id === subjectId);
  const eligibleClasses = directory.classes.filter((c) => c.subjectIds.includes(subjectId));

  // Live preview of where content will live — the key reassurance for an admin.
  const previews = useMemo(() => {
    if (!title.trim() || classIds.length === 0) return [];
    return classIds.map((classId) => {
      const key = linkExisting && existingKey ? existingKey : deriveContentKey(scope, classId, subjectId, title);
      return { classId, lessonId: deriveLessonId(classId, subjectId, title), location: displayLocation(deriveBlobPrefix(key)) };
    });
  }, [title, classIds, subjectId, scope, linkExisting, existingKey]);

  const reset = () => {
    setClassIds([]);
    setTitle('');
    setDescription('');
    setChapter('');
    setDurationMin(45);
    setDifficulty('Beginner');
    setTopics(DEFAULT_TOPICS);
    setScope('shared');
    setLinkExisting(false);
    setExistingKey(null);
    setErrors([]);
  };

  const submit = () => {
    const problems: string[] = [];
    if (classIds.length === 0) problems.push('Select at least one class.');
    if (!chapter.trim()) problems.push('Enter a chapter.');
    if (topics.length === 0) problems.push('Add at least one coverage topic — this is the checklist teachers record against.');
    if (linkExisting && !existingKey) problems.push('Choose the existing folder to link, or turn linking off.');
    for (const classId of classIds) {
      const check = validateLessonTitle(title, directory.lessons.map((l) => l.id), classId, subjectId);
      if (!check.ok && check.error) problems.push(`${classId}: ${check.error}`);
    }
    setErrors([...new Set(problems)]);
    if (problems.length) return;

    const created = directory.createLessons({
      classIds,
      subjectId,
      title,
      description,
      chapter,
      durationMin,
      difficulty,
      topics,
      objectives: [],
      materials: ['Lesson Plan'],
      contentScope: scope,
      linkExistingKey: linkExisting && existingKey ? existingKey : undefined,
    });
    if (session) log(session.user.id, 'admin', `Created “${title}” for ${created.map((l) => l.classId).join(', ')}`);
    toast(`${created.length} lesson${created.length === 1 ? '' : 's'} created. Upload content, then publish.`);
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Add a lesson</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 0.5 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField select label="Subject" value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setClassIds([]); }} fullWidth>
              {directory.subjects.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </TextField>
            <Autocomplete
              multiple
              options={eligibleClasses.map((c) => c.id)}
              value={classIds}
              onChange={(_, v) => setClassIds(v)}
              renderInput={(params) => <TextField {...params} label="Classes" placeholder="Select classes" />}
              sx={{ flex: 1 }}
            />
          </Stack>

          <TextField
            label="Lesson title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            placeholder="Introduction to Fractions"
            helperText="The folder name is derived from this title. Changing it later does not move existing content."
          />
          <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline minRows={2} />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Autocomplete
              freeSolo
              options={subject?.chapters ?? []}
              value={chapter}
              onInputChange={(_, v) => setChapter(v)}
              renderInput={(params) => <TextField {...params} label="Chapter" />}
              sx={{ flex: 1 }}
            />
            <TextField
              label="Duration (minutes)"
              type="number"
              value={durationMin}
              onChange={(e) => setDurationMin(Number(e.target.value))}
              inputProps={{ min: 5, max: 240 }}
              sx={{ width: { sm: 180 } }}
            />
            <TextField select label="Difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value as Lesson['difficulty'])} sx={{ width: { sm: 180 } }}>
              {['Beginner', 'Intermediate', 'Advanced'].map((d) => (
                <MenuItem key={d} value={d}>
                  {d}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Divider />

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Coverage topics
            </Typography>
            <Typography variant="caption" color="text.secondary">
              The checklist teachers tick when recording what they taught. Keep them in teaching order.
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1.5, mb: 1 }}>
              <TextField
                size="small"
                placeholder="Add a topic"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTopic.trim()) {
                    e.preventDefault();
                    setTopics((prev) => [...prev, newTopic.trim()]);
                    setNewTopic('');
                  }
                }}
                fullWidth
              />
              <Button
                startIcon={<AddIcon />}
                onClick={() => {
                  if (!newTopic.trim()) return;
                  setTopics((prev) => [...prev, newTopic.trim()]);
                  setNewTopic('');
                }}
              >
                Add
              </Button>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {topics.map((t, i) => (
                <Chip key={`${t}-${i}`} label={`${i + 1}. ${t}`} onDelete={() => setTopics((prev) => prev.filter((_, idx) => idx !== i))} />
              ))}
            </Stack>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Content folder
            </Typography>
            <RadioGroup value={scope} onChange={(e) => setScope(e.target.value as ContentScope)}>
              <FormControlLabel
                value="shared"
                control={<Radio />}
                disabled={linkExisting}
                label={
                  <Box>
                    <Typography variant="body2">Share one folder across the selected classes</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Upload the plan once. A correction reaches every class at the same time.
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="per-class"
                control={<Radio />}
                disabled={linkExisting}
                label={
                  <Box>
                    <Typography variant="body2">A separate folder for each class</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Use when the plan genuinely differs by class.
                    </Typography>
                  </Box>
                }
              />
            </RadioGroup>

            <FormControlLabel
              sx={{ mt: 1 }}
              control={<Checkbox checked={linkExisting} onChange={(e) => setLinkExisting(e.target.checked)} />}
              label={<Typography variant="body2">Link an existing folder instead</Typography>}
            />
            {linkExisting && (
              <Autocomplete
                options={directory.contentKeys()}
                value={existingKey}
                onChange={(_, v) => setExistingKey(v)}
                renderInput={(params) => <TextField {...params} label="Existing folder" size="small" />}
                sx={{ maxWidth: 460, mt: 1 }}
              />
            )}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Folders are picked from a list, never typed, so a lesson cannot be pointed outside its container.
            </Typography>
          </Box>

          {previews.length > 0 && (
            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'action.hover' }}>
              <Typography variant="caption" color="text.secondary">
                Content will be read from:
              </Typography>
              {previews.map((p) => (
                <Typography key={p.classId} variant="caption" fontFamily="monospace" sx={{ display: 'block' }}>
                  {p.classId} → {p.location}
                </Typography>
              ))}
            </Paper>
          )}

          {errors.length > 0 && (
            <Alert severity="error">
              {errors.map((e) => (
                <div key={e}>{e}</div>
              ))}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={!title.trim()}>
          Create lesson
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const UPLOAD_KINDS = [
  { key: 'plan', label: 'Lesson plan', hint: 'Word or PDF, converted to protected text blocks on upload', target: 'plan.json' },
  { key: 'video', label: 'Video', hint: 'Transcoded to HLS and served via short-lived SAS', target: 'videos/' },
  { key: 'resource', label: 'Resource', hint: 'Worksheets and references, view-only for teachers', target: 'resources/' },
];

function UploadDialog({ lesson, onClose }: { lesson: Lesson; onClose: () => void }) {
  const { toast } = useToast();
  const { log } = usePlatform();
  const { session } = useAuth();
  const [kind, setKind] = useState(UPLOAD_KINDS[0]);
  const [progress, setProgress] = useState<number | null>(null);

  const run = () => {
    setProgress(0);
    const timer = window.setInterval(() => {
      setProgress((p) => {
        if (p === null) return null;
        if (p >= 100) {
          window.clearInterval(timer);
          window.setTimeout(() => {
            setProgress(null);
            if (session) log(session.user.id, 'admin', `Uploaded a ${kind.label.toLowerCase()} to ${lesson.contentKey}`);
            toast(`${kind.label} uploaded to ${displayLocation(lesson.blobPrefix)}${kind.target}.`);
            onClose();
          }, 400);
          return 100;
        }
        return p + 14;
      });
    }, 170);
  };

  return (
    <Dialog open onClose={progress === null ? onClose : undefined} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        Upload content — {lesson.title}
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 10, top: 10 }} aria-label="Close" disabled={progress !== null}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          Upload is simulated in demo mode. With Azure configured, the file is converted and written to the folder below.
        </Alert>

        <Paper variant="outlined" sx={{ p: 1.5, mb: 2, bgcolor: 'action.hover' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <FolderOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="body2" fontFamily="monospace">
              {displayLocation(lesson.blobPrefix)}
              {kind.target}
            </Typography>
          </Stack>
        </Paper>

        <Stack spacing={1.5}>
          {UPLOAD_KINDS.map((k) => (
            <Card key={k.key} variant="outlined" sx={{ borderColor: kind.key === k.key ? 'primary.main' : undefined }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <FormControlLabel
                  control={<Radio checked={kind.key === k.key} onChange={() => setKind(k)} />}
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {k.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {k.hint}
                      </Typography>
                    </Box>
                  }
                />
              </CardContent>
            </Card>
          ))}
        </Stack>

        {progress !== null && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="caption" color="text.secondary">
              {progress}%
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={progress !== null}>
          Cancel
        </Button>
        <Button variant="contained" startIcon={<CloudUploadOutlinedIcon />} onClick={run} disabled={progress !== null}>
          Upload
        </Button>
      </DialogActions>
    </Dialog>
  );
}
