const courseCode = decodeURIComponent(
  new URLSearchParams(window.location.search).get('course')
);

const tbody = document.getElementById('assessments-tbody');
const saveBtn = document.getElementById('save-assessment');

let courseId = null;

// ---------------- FETCH COURSE + ASSESSMENTS ----------------
async function fetchCourseDetails() {
  try {
    const resCourse = await fetch('/api/courses');
    const courses = await resCourse.json();

    const course = courses.find(
      c => c.courseCode.trim().toLowerCase() === courseCode.trim().toLowerCase()
    );

    if (!course) throw new Error('Course not found');

    courseId = course.id;

    const titleEl = document.querySelector('h3.m-0.fw-bold');
    if (titleEl) titleEl.textContent = course.courseCode;

    const subtitleEl = document.querySelector('h3.m-0.fw-bold + p');
    if (subtitleEl) {
      subtitleEl.textContent = `${course.courseName} • ${course.term || ''} • Instructor: ${course.instructor || 'N/A'}`;
    }

    const res = await fetch(`/api/assessments?courseId=${courseId}`);
    const assessments = await res.json();

    renderAssessments(assessments, course);
    updateSummary(assessments);

  } catch (err) {
    console.error('Fetch error:', err);
  }
}

// ---------------- RENDER TABLE ----------------
function renderAssessments(assessments, course) {
  tbody.innerHTML = '';

  if (!assessments.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted">No assessments yet.</td>
      </tr>
    `;
    return;
  }

  assessments.forEach(a => {
    const statusBadge = a.status === 'completed' ? 'text-bg-success' : 'text-bg-warning';

    tbody.innerHTML += `
      <tr data-id="${a.id}">
        <td>
          <a href="assessment-details.html?course=${encodeURIComponent(course.courseCode)}&assessment=${a.id}" class="assessment-link">
            ${a.title}
          </a>
        </td>
        <td>${a.type}</td>
        <td>${formatDate(a.dueDate)}</td>
        <td>
          <input class="form-control form-control-sm earned-input" value="${a.earnedMarks ?? ''}" readonly />
        </td>
        <td>
          <input class="form-control form-control-sm total-input" value="${a.totalMarks ?? ''}" readonly />
        </td>
        <td>
          <span class="badge ${statusBadge}">
            ${a.status === 'completed' ? 'Completed' : 'Pending'}
          </span>
        </td>
        <td class="text-end">
          <button class="btn btn-outline-secondary btn-sm edit-btn">Edit</button>
          <br><br>
          <button class="btn btn-outline-danger btn-sm delete-btn">Delete</button>
        </td>
      </tr>
    `;
  });

  attachRowListeners(course);
}

// ---------------- FORMAT DATE ----------------
function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toISOString().split('T')[0];
}

// ---------------- EDIT / DELETE ----------------
function attachRowListeners(course) {
  tbody.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const tr = e.target.closest('tr');
      const id = tr.dataset.id;

      window.location.href = `assessment-details.html?course=${encodeURIComponent(course.courseCode)}&assessment=${id}`;
    });
  });

  tbody.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      const tr = e.target.closest('tr');
      const id = tr.dataset.id;

      if (!confirm('Are you sure?')) return;

      try {
        const res = await fetch(`/api/assessments/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to delete assessment');
        fetchCourseDetails();
      } catch (err) {
        console.error('Delete error:', err);
        alert('Could not delete assessment.');
      }
    });
  });
}

// ---------------- ADD ASSESSMENT FROM MODAL ----------------
if (saveBtn) {
  saveBtn.addEventListener('click', async () => {
    if (!courseId) {
      alert('Course not loaded yet.');
      return;
    }

    const title = document.getElementById('title').value.trim();
    const type = document.getElementById('type').value.trim();
    const dueDate = document.getElementById('dueDate').value;
    const totalMarks = document.getElementById('total').value;

    if (!title || !type || !dueDate || !totalMarks) {
      alert('Please fill all fields.');
      return;
    }

    if (Number(totalMarks) < 0) {
      alert('Total marks cannot be negative.');
      return;
    }

    try {
      const res = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          title,
          type,
          dueDate,
          weight: 0,
          earnedMarks: 0,
          totalMarks,
          status: 'pending'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add assessment');

      const modalEl = document.getElementById('addAssessmentModal');
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();

      document.getElementById('assessment-form').reset();
      fetchCourseDetails();
    } catch (err) {
      console.error('Add error:', err);
      alert('Could not save assessment.');
    }
  });
}

// ---------------- SUMMARY ----------------
function updateSummary(assessments) {
  const avgBox = document.querySelector('.summary-box h2');
  const progressBar = document.querySelector('.summary-box .progress-bar');
  const completionText = document.querySelector('.summary-box .fw-semibold');

  if (!assessments.length) {
    if (avgBox) avgBox.textContent = '-';
    if (progressBar) progressBar.style.width = '0%';
    if (completionText) completionText.textContent = '0/0';
    return;
  }

  const totalEarned = assessments.reduce((sum, a) => sum + (parseFloat(a.earnedMarks) || 0), 0);
  const totalMarks = assessments.reduce((sum, a) => sum + (parseFloat(a.totalMarks) || 0), 0);
  const avg = totalMarks ? Math.round((totalEarned / totalMarks) * 100) : 0;

  if (avgBox) avgBox.textContent = `${avg}%`;

  const completed = assessments.filter(a => a.status === 'completed').length;
  const completion = Math.round((completed / assessments.length) * 100);

  if (progressBar) progressBar.style.width = `${completion}%`;
  if (completionText) completionText.textContent = `${completed}/${assessments.length}`;
}

// ---------------- START ----------------
fetchCourseDetails();