const coursesContainer = document.getElementById('courses-container');
const upcomingContainer = document.getElementById('upcoming-container');

let allCourses = [];

const courseImages = ['https://www.concordia.ca/content/concordia/en/social/guidelines-conduct.img.png/1650398601839.png'];

// ---------------- LOAD EVERYTHING ----------------
async function loadDashboard() {
  await fetchCourses();
  await fetchUpcomingAssessments();
}

// ---------------- FETCH COURSES ----------------
async function fetchCourses() {
  try {
    const enrollRes = await fetch('/api/enrollments');
    const enrolledCourses = await enrollRes.json();
    renderCourseOverview(enrolledCourses);
  } catch (err) {
    console.error('Error fetching courses:', err);
  }
}

// ---------------- RENDER COURSE OVERVIEW ----------------
function renderCourseOverview(courses) {
  const visibleCourses = courses.filter(course => course.status === 'active');

  coursesContainer.innerHTML = '';

  if (!visibleCourses.length) {
    coursesContainer.innerHTML = `
      <p class="text-muted">No courses visible in Course Overview.</p>
    `;
    return;
  }

  visibleCourses.forEach((course, index) => {
    const avg = course.average || 0;
    const completion = course.completion || 0;

    coursesContainer.innerHTML += `
      <div class="col-12 col-sm-6 col-md-4 mb-3">
        <div class="course-card d-flex flex-column p-3" id="course-${(index % 6) + 1}">
          <a href="course-details.html?course=${encodeURIComponent(course.courseCode)}"
             class="text-decoration-none overview-link">
            <div class="d-flex align-items-center">
              <img src="${courseImages[index % courseImages.length]}" alt="${course.courseName}" class="course-img" />
              <div class="course-info ms-5">
                <h5 class="course-title">${course.courseCode}</h5>
                <p class="course-desc">${course.courseName}</p>
              </div>
            </div>
            <div class="mt-3 d-flex justify-content-between align-items-center">
              <span class="avg-label">Current Average</span>
              <span class="avg-value">${avg}%</span>
            </div>
            <div class="mt-2">
              <div class="d-flex justify-content-between">
                <span class="completion-label">Completion</span>
                <span class="completion-percent">${completion}%</span>
              </div>
              <div class="progress mt-1" style="height: 6px">
                <div class="progress-bar bg-danger" style="width: ${completion}%"></div>
              </div>
            </div>
          </a>
        </div>
      </div>
    `;
  });
}

// placeholder to avoid reference errors
function attachRemoveOverviewListeners() {
  document.querySelectorAll('.remove-overview-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      const courseId = Number(e.target.dataset.id);
      const course = allCourses.find(c => c.id === courseId);
      if (!course) return;

      try {
        const res = await fetch(`/api/courses/${courseId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseCode: course.courseCode,
            courseName: course.courseName,
            instructor: course.instructor,
            term: course.term,
            status: 'inactive'
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to remove course');

        await fetchCourses();
      } catch (err) {
        console.error('Remove course error:', err);
        alert('Could not remove course from overview.');
      }
    });
  });
}


// ---------------- UPCOMING ASSESSMENTS ----------------
async function fetchUpcomingAssessments() {
  try {
    const res = await fetch('/api/upcoming-assessments');
    const items = await res.json();

    upcomingContainer.innerHTML = '';

    if (!items.length) {
      upcomingContainer.innerHTML = `
        <div class="list-group-item text-muted">No overdue or due soon assessments.</div>
      `;
      return;
    }

    items.forEach(item => {
      const badgeClass = item.label === 'Overdue' ? 'text-bg-danger' : 'text-bg-warning';

      upcomingContainer.innerHTML += `
        <a
          href="assessment-details.html?course=${encodeURIComponent(item.courseCode)}&assessment=${item.id}"
          class="list-group-item list-group-item-action d-flex justify-content-between align-items-start gap-3"
        >
          <div>
            <div class="fw-semibold">${item.title}</div>
            <div class="text-muted small">${item.courseCode} • Due: ${formatDate(item.dueDate)}</div>
          </div>
          <span class="badge rounded-pill ${badgeClass}">${item.label}</span>
        </a>
      `;
    });
  } catch (err) {
    console.error('Upcoming assessments error:', err);
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toISOString().split('T')[0];
}

// ---------------- START ----------------
loadDashboard();
