const myCoursesContainer = document.getElementById('my-courses-container');
const courseDropdown = document.getElementById('course-dropdown');
const enrollBtn = document.getElementById('enroll-btn');

const courseImages = ['https://www.concordia.ca/content/concordia/en/social/guidelines-conduct.img.png/1650398601839.png'];

let allCourses = [];
let enrolledCourseIds = [];

// ---------------- INIT ----------------
async function init() {
  await Promise.all([fetchAllCourses(), fetchEnrolledCourses()]);
  populateDropdown();
}

// ---------------- FETCH ALL AVAILABLE COURSES (for dropdown) ----------------
async function fetchAllCourses() {
  try {
    const res = await fetch('/api/courses');
    allCourses = await res.json();
    allCourses = allCourses.filter(c => c.status === 'active');
  } catch (err) {
    console.error('Error fetching courses:', err);
  }
}

// ---------------- FETCH ENROLLED COURSES ----------------
async function fetchEnrolledCourses() {
  try {
    const res = await fetch('/api/enrollments');
    const courses = await res.json();
    enrolledCourseIds = courses.map(c => c.id);
    renderMyCourses(courses);
  } catch (err) {
    console.error('Error fetching enrollments:', err);
  }
}

// ---------------- POPULATE DROPDOWN (only unenrolled courses) ----------------
function populateDropdown() {
  const unenrolled = allCourses.filter(c => !enrolledCourseIds.includes(c.id));

  courseDropdown.innerHTML = '<option value="">-- Select a course --</option>';

  if (!unenrolled.length) {
    courseDropdown.innerHTML = '<option value="">No more courses to enroll in</option>';
    enrollBtn.disabled = true;
    return;
  }

  enrollBtn.disabled = false;
  unenrolled.forEach(c => {
    courseDropdown.innerHTML += `<option value="${c.id}">${c.courseCode} - ${c.courseName}</option>`;
  });
}

// ---------------- ENROLL ----------------
enrollBtn.addEventListener('click', async () => {
  const courseId = courseDropdown.value;
  if (!courseId) {
    alert('Please select a course.');
    return;
  }

  try {
    const res = await fetch('/api/enrollments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId: Number(courseId) })
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.message || 'Could not enroll.');
      return;
    }

    await fetchEnrolledCourses();
    populateDropdown();
  } catch (err) {
    console.error('Enroll error:', err);
    alert('Could not enroll.');
  }
});

// ---------------- RENDER ENROLLED COURSES ----------------
function renderMyCourses(courses) {
  myCoursesContainer.innerHTML = '';

  if (!courses.length) {
    myCoursesContainer.innerHTML = `
      <p class="text-muted">You have not enrolled in any courses yet. Use the dropdown above to add one.</p>
    `;
    return;
  }

  courses.forEach((course, index) => {
    const avg = course.average || 0;
    const completion = course.completion || 0;

    myCoursesContainer.innerHTML += `
      <div class="col-12 col-sm-6 col-md-4 mb-3">
        <div class="course-card d-flex flex-column p-3" id="course-${(index % 6) + 1}">
          <a
            href="course-details.html?course=${encodeURIComponent(course.courseCode)}"
            class="text-decoration-none overview-link"
          >
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
          <div class="mt-3 text-end">
            <button class="btn btn-outline-danger btn-sm unenroll-btn" data-id="${course.id}">
              Unenroll
            </button>
          </div>
        </div>
      </div>
    `;
  });

  attachUnenrollListeners();
}

// ---------------- UNENROLL ----------------
function attachUnenrollListeners() {
  document.querySelectorAll('.unenroll-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      const courseId = e.target.dataset.id;
      if (!confirm('Unenroll from this course?')) return;

      try {
        const res = await fetch(`/api/enrollments/${courseId}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) {
          alert(data.message || 'Could not unenroll.');
          return;
        }

        await fetchEnrolledCourses();
        populateDropdown();
      } catch (err) {
        console.error('Unenroll error:', err);
        alert('Could not unenroll.');
      }
    });
  });
}

init();
