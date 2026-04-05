const params = new URLSearchParams(window.location.search);
const courseCode = decodeURIComponent(params.get('course'));
const assessmentId = params.get('assessment');

let currentAssessment = null;
let currentCourse = null;
let currentGrade = { earnedMarks: 0, isClosed: 0 };

const assessmentTitle = document.getElementById('assessment-title');
const assessmentSubtitle = document.getElementById('assessment-subtitle');
const assessmentStatusBadge = document.getElementById('assessment-status-badge');

const infoCourse = document.getElementById('info-course');
const infoDueDate = document.getElementById('info-dueDate');
const infoWeight = document.getElementById('info-weight');
const infoType = document.getElementById('info-type');

const earnedMarksInput = document.getElementById('earnedMarks');
const totalMarksInput = document.getElementById('totalMarks');

const scoreText = document.getElementById('score-text');
const scoreBar = document.getElementById('score-bar');

const submissionDate = document.getElementById('submission-date');

const saveMarksBtn = document.getElementById('save-marks-btn');
const markCompletedBtn = document.getElementById('mark-completed-btn');

async function fetchAssessmentDetails() {
  try {
    const [courseRes, assessmentRes, gradeRes] = await Promise.all([
      fetch('/api/courses'),
      fetch(`/api/assessment/${assessmentId}`),
      fetch(`/api/grades?assessmentId=${assessmentId}`)
    ]);

    const courses = await courseRes.json();
    const assessment = await assessmentRes.json();
    const grade = await gradeRes.json();

    currentCourse = courses.find(
      c => c.courseCode.trim().toLowerCase() === courseCode.trim().toLowerCase()
    );

    if (!currentCourse) throw new Error('Course not found');
    if (assessment.error) throw new Error(assessment.error);

    currentAssessment = assessment;
    currentGrade = grade;
    renderAssessment();
  } catch (err) {
    console.error('Assessment details error:', err);
  }
}

function renderAssessment() {
  if (!currentAssessment || !currentCourse) return;

  const weightValue = currentAssessment.weight ? `${currentAssessment.weight}%` : '10%';

  assessmentTitle.textContent = currentAssessment.title;
  assessmentSubtitle.textContent = `${currentCourse.courseCode} • Due: ${formatDate(currentAssessment.dueDate)} • Weight: ${weightValue}`;

  const isCompleted = currentGrade.isClosed === 1;
  assessmentStatusBadge.textContent = isCompleted ? 'Completed' : 'Pending';
  assessmentStatusBadge.className = `badge ${isCompleted ? 'text-bg-success' : 'text-bg-warning'}`;

  infoCourse.textContent = `${currentCourse.courseCode} - ${currentCourse.courseName}`;
  infoDueDate.textContent = formatDate(currentAssessment.dueDate);
  infoWeight.textContent = weightValue;
  infoType.textContent = currentAssessment.type;

  earnedMarksInput.value = currentGrade.earnedMarks ?? 0;
  totalMarksInput.value = currentAssessment.totalMarks ?? 0;

  updateScoreUI();

  submissionDate.textContent = formatDate(currentAssessment.dueDate);
}

function updateScoreUI() {
  const earned = parseFloat(earnedMarksInput.value) || 0;
  const total = parseFloat(totalMarksInput.value) || 0;
  const percent = total > 0 ? Math.round((earned / total) * 100) : 0;
  scoreText.textContent = `${percent}%`;
  scoreBar.style.width = `${percent}%`;
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toISOString().split('T')[0];
}

// Save Marks
saveMarksBtn.addEventListener('click', async () => {
  if (!currentAssessment) return;

  const earnedMarks = parseFloat(earnedMarksInput.value) || 0;
  const totalMarks = parseFloat(totalMarksInput.value) || 0;

  if (earnedMarks < 0 || totalMarks < 0) {
    alert('Marks cannot be negative.');
    return;
  }

  if (earnedMarks > totalMarks) {
    alert('Earned marks cannot be greater than total marks.');
    return;
  }

  try {
    const res = await fetch('/api/grades', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assessmentId: currentAssessment.id,
        earnedMarks,
        isClosed: currentGrade.isClosed
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save marks');

    currentGrade.earnedMarks = earnedMarks;
    updateScoreUI();
    alert('Marks saved successfully!');
  } catch (err) {
    console.error('Save marks error:', err);
    alert('Could not save marks.');
  }
});

// Mark as Completed
markCompletedBtn.addEventListener('click', async () => {
  if (!currentAssessment) return;

  try {
    const res = await fetch('/api/grades', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assessmentId: currentAssessment.id,
        earnedMarks: parseFloat(earnedMarksInput.value) || 0,
        isClosed: 1
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to mark completed');

    currentGrade.isClosed = 1;
    renderAssessment();
    alert('Assessment marked as completed!');
  } catch (err) {
    console.error('Completion error:', err);
    alert('Could not update completion status.');
  }
});

earnedMarksInput.addEventListener('input', updateScoreUI);
totalMarksInput.addEventListener('input', updateScoreUI);

fetchAssessmentDetails();
