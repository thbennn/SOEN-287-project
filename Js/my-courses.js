const myCoursesContainer = document.getElementById('my-courses-container');

async function fetchMyCourses() {
  try {
    const res = await fetch('/api/courses');
    const courses = await res.json();

    const activeCourses = courses.filter(course => course.status === 'active');

    renderMyCourses(activeCourses);
  } catch (err) {
    console.error('Error fetching my courses:', err);
  }
}

function renderMyCourses(courses) {
  myCoursesContainer.innerHTML = '';

  if (!courses.length) {
    myCoursesContainer.innerHTML = `
      <p class="text-muted">No active courses available.</p>
    `;
    return;
  }

  courses.forEach((course, index) => {
    const avg = course.average || 0;
    const completion = course.completion || 0;

    myCoursesContainer.innerHTML += `
      <div class="col-12 col-sm-6 col-md-4 mb-3">
        <a
          href="course-details.html?course=${encodeURIComponent(course.courseCode)}"
          class="course-card d-flex flex-column p-3 text-decoration-none overview-link"
          id="course-${(index % 6) + 1}"
        >
          <div class="d-flex align-items-center">
            <img
              src="../Photos/Onephoto.jpg"
              alt="${course.courseName}"
              class="course-img"
            />
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
    `;
  });
}

fetchMyCourses();