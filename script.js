const STORAGE_KEY = "attendx_data";

const defaultData = {
    classes: [
        {
            id: "bca1a",
            name: "BCA",
            section: "1st Year A"
        },
        {
            id: "bca2a",
            name: "BCA",
            section: "2nd Year A"
        },
        {
            id: "bca3a",
            name: "BCA",
            section: "3rd Year A"
        },
        {
            id: "olevela",
            name: "O Level",
            section: "Section A"
        }
    ],

    students: [],

    attendance: {}
};

let data = JSON.parse(localStorage.getItem(STORAGE_KEY));

if (!data) {
    data = defaultData;
    saveData();
}

let currentAttendance = {};

const today = new Date().toISOString().split("T")[0];

document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("attendanceDate").value = today;

    updateDates();
    populateClassSelects();
    renderDashboard();
    renderStudents();
    renderAttendance();
    renderReports();
    setupNavigation();
    setupEvents();

});

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function updateDates() {

    const date = new Date();

    const formatted = date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

    document.getElementById("sidebarDate").textContent = formatted;
    document.getElementById("dashboardDate").textContent = formatted;
}

function setupNavigation() {

    const buttons = document.querySelectorAll(".nav-btn");

    buttons.forEach(button => {

        button.addEventListener("click", () => {

            const section = button.dataset.section;

            showPage(section);

        });

    });

    document.querySelectorAll("[data-go]").forEach(button => {

        button.addEventListener("click", () => {

            showPage(button.dataset.go);

        });

    });
}

function showPage(section) {

    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    document.getElementById(section).classList.add("active");

    document.querySelectorAll(".nav-btn").forEach(button => {
        button.classList.remove("active");

        if (button.dataset.section === section) {
            button.classList.add("active");
        }
    });

    const titles = {
        dashboard: ["Dashboard", "Manage your classes and attendance"],
        students: ["Students", "Manage student information"],
        attendance: ["Attendance", "Mark daily student attendance"],
        reports: ["Reports", "View attendance performance"]
    };

    document.getElementById("pageTitle").textContent = titles[section][0];
    document.getElementById("pageSubtitle").textContent = titles[section][1];

    document.querySelector(".sidebar").classList.remove("open");
}

function setupEvents() {

    document.getElementById("addStudentBtn").addEventListener("click", () => {

        if (data.classes.length === 0) {
            showToast("First create a class.");
            return;
        }

        document.getElementById("studentModal").classList.add("show");

    });

    document.getElementById("addClassBtn").addEventListener("click", () => {

        document.getElementById("classModal").classList.add("show");

    });

    document.querySelectorAll("[data-close]").forEach(button => {

        button.addEventListener("click", () => {

            document
                .getElementById(button.dataset.close)
                .classList.remove("show");

        });

    });

    document.getElementById("studentForm").addEventListener("submit", addStudent);

    document.getElementById("classForm").addEventListener("submit", addClass);

    document.getElementById("studentSearch").addEventListener("input", renderStudents);

    document.getElementById("studentClassFilter").addEventListener("change", renderStudents);

    document.getElementById("attendanceClass").addEventListener("change", () => {
        loadAttendance();
    });

    document.getElementById("attendanceDate").addEventListener("change", () => {
        loadAttendance();
    });

    document.getElementById("markAllPresent").addEventListener("click", () => {

        const students = getSelectedClassStudents();

        students.forEach(student => {
            currentAttendance[student.id] = "present";
        });

        renderAttendanceList();

    });

    document.getElementById("markAllAbsent").addEventListener("click", () => {

        const students = getSelectedClassStudents();

        students.forEach(student => {
            currentAttendance[student.id] = "absent";
        });

        renderAttendanceList();

    });

    document.getElementById("saveAttendance").addEventListener("click", saveAttendance);

    document.getElementById("reportClass").addEventListener("change", renderReports);

    document.getElementById("reportSearch").addEventListener("input", renderReports);

    document.getElementById("mobileMenu").addEventListener("click", () => {

        document.querySelector(".sidebar").classList.toggle("open");

    });

}

function populateClassSelects() {

    const selects = [
        "studentClass",
        "studentClassFilter",
        "attendanceClass",
        "reportClass"
    ];

    selects.forEach(id => {

        const select = document.getElementById(id);

        const oldValue = select.value;

        if (id === "studentClassFilter") {

            select.innerHTML = `<option value="">All Classes</option>`;

        } else {

            select.innerHTML = "";

        }

        data.classes.forEach(cls => {

            const option = document.createElement("option");

            option.value = cls.id;
            option.textContent = `${cls.name} - ${cls.section}`;

            select.appendChild(option);

        });

        if (oldValue && data.classes.some(c => c.id === oldValue)) {
            select.value = oldValue;
        }

    });

    if (data.classes.length > 0) {

        const attendanceSelect = document.getElementById("attendanceClass");

        if (!attendanceSelect.value) {
            attendanceSelect.value = data.classes[0].id;
        }

    }

}

function addClass(event) {

    event.preventDefault();

    const name = document.getElementById("className").value.trim();
    const section = document.getElementById("classSection").value.trim();

    if (!name || !section) {
        return;
    }

    const exists = data.classes.some(cls =>
        cls.name.toLowerCase() === name.toLowerCase() &&
        cls.section.toLowerCase() === section.toLowerCase()
    );

    if (exists) {

        showToast("This class already exists.");
        return;

    }

    data.classes.push({
        id: generateId(),
        name,
        section
    });

    saveData();

    document.getElementById("classForm").reset();
    document.getElementById("classModal").classList.remove("show");

    populateClassSelects();
    renderDashboard();

    showToast("Class added successfully.");

}

function addStudent(event) {

    event.preventDefault();

    const name = document.getElementById("studentName").value.trim();
    const roll = document.getElementById("studentRoll").value.trim();
    const classId = document.getElementById("studentClass").value;

    if (!name || !roll || !classId) {
        return;
    }

    const sameClass = data.students.filter(student => student.classId === classId);

    const duplicateRoll = sameClass.some(student =>
        student.roll.toLowerCase() === roll.toLowerCase()
    );

    if (duplicateRoll) {

        showToast("This roll number already exists in this class.");
        return;

    }

    data.students.push({
        id: generateId(),
        name,
        roll,
        classId
    });

    saveData();

    document.getElementById("studentForm").reset();
    document.getElementById("studentModal").classList.remove("show");

    renderDashboard();
    renderStudents();
    renderAttendance();
    renderReports();

    showToast("Student added successfully.");

}

function renderDashboard() {

    const total = data.students.length;

    const todayRecords = getTodayRecords();

    const present = todayRecords.filter(r => r.status === "present").length;

    const absent = todayRecords.filter(r => r.status === "absent").length;

    let totalAttendance = 0;
    let totalRecords = 0;

    Object.values(data.attendance).forEach(records => {

        Object.values(records).forEach(status => {

            totalRecords++;

            if (status === "present") {
                totalAttendance++;
            }

        });

    });

    const percentage = totalRecords
        ? ((totalAttendance / totalRecords) * 100).toFixed(1)
        : 0;

    document.getElementById("totalStudents").textContent = total;
    document.getElementById("presentToday").textContent = present;
    document.getElementById("absentToday").textContent = absent;
    document.getElementById("overallAttendance").textContent = percentage + "%";

    renderClassList();

}

function renderClassList() {

    const container = document.getElementById("classList");

    if (data.classes.length === 0) {

        container.innerHTML = `
            <div class="empty">
                No classes created yet.
            </div>
        `;

        return;
    }

    container.innerHTML = data.classes.map(cls => {

        const count = data.students.filter(
            student => student.classId === cls.id
        ).length;

        return `
            <div class="class-item">

                <div class="class-info">
                    <strong>${escapeHtml(cls.name)}</strong>
                    <small>${escapeHtml(cls.section)} • ${count} Students</small>
                </div>

                <div class="class-actions">

                    <button
                        class="small-btn"
                        onclick="openClassAttendance('${cls.id}')">
                        Attendance
                    </button>

                    <button
                        class="small-btn delete-btn"
                        onclick="deleteClass('${cls.id}')">
                        Delete
                    </button>

                </div>

            </div>
        `;

    }).join("");

}

function openClassAttendance(classId) {

    document.getElementById("attendanceClass").value = classId;

    showPage("attendance");

    loadAttendance();

}

function deleteClass(classId) {

    const students = data.students.filter(
        student => student.classId === classId
    );

    if (students.length > 0) {

        const confirmDelete = confirm(
            "This class contains students. Delete class and all its students?"
        );

        if (!confirmDelete) {
            return;
        }

        data.students = data.students.filter(
            student => student.classId !== classId
        );

    } else {

        if (!confirm("Delete this class?")) {
            return;
        }

    }

    delete data.attendance[classId];

    data.classes = data.classes.filter(
        cls => cls.id !== classId
    );

    saveData();

    populateClassSelects();
    renderDashboard();
    renderStudents();
    renderAttendance();
    renderReports();

    showToast("Class deleted.");

}

function renderStudents() {

    const tbody = document.getElementById("studentsTable");

    const search = document
        .getElementById("studentSearch")
        .value
        .toLowerCase();

    const classFilter = document.getElementById("studentClassFilter").value;

    let students = data.students;

    if (classFilter) {

        students = students.filter(
            student => student.classId === classFilter
        );

    }

    if (search) {

        students = students.filter(student =>
            student.name.toLowerCase().includes(search) ||
            student.roll.toLowerCase().includes(search)
        );

    }

    if (students.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty">
                        No students found.
                    </div>
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML = students.map(student => {

        const stats = getStudentStats(student.id);

        const cls = getClass(student.classId);

        const percentage = stats.percentage;

        let badgeClass = "status-good";

        if (percentage < 75) {
            badgeClass = "status-danger";
        } else if (percentage < 85) {
            badgeClass = "status-warning";
        }

        return `
            <tr>

                <td>${escapeHtml(student.roll)}</td>

                <td>
                    <span class="student-name">
                        ${escapeHtml(student.name)}
                    </span>
                </td>

                <td>
                    ${cls ? escapeHtml(cls.name + " - " + cls.section) : "-"}
                </td>

                <td class="green-text">${stats.present}</td>

                <td class="red-text">${stats.absent}</td>

                <td>
                    <span class="status-badge ${badgeClass}">
                        ${percentage}%
                    </span>
                </td>

                <td>

                    <button
                        class="action-btn"
                        onclick="showStudentDetail('${student.id}')">
                        View
                    </button>

                    <button
                        class="action-btn delete"
                        onclick="deleteStudent('${student.id}')">
                        Delete
                    </button>

                </td>

            </tr>
        `;

    }).join("");

}

function deleteStudent(studentId) {

    const student = data.students.find(
        s => s.id === studentId
    );

    if (!student) {
        return;
    }

    if (!confirm(`Delete ${student.name}?`)) {
        return;
    }

    data.students = data.students.filter(
        s => s.id !== studentId
    );

    Object.keys(data.attendance).forEach(classId => {

        Object.keys(data.attendance[classId]).forEach(date => {

            delete data.attendance[classId][date][studentId];

        });

    });

    saveData();

    renderDashboard();
    renderStudents();
    renderAttendance();
    renderReports();

    showToast("Student deleted.");

}

function renderAttendance() {

    if (data.classes.length === 0) {

        document.getElementById("attendanceList").innerHTML = `
            <div class="empty">
                Please create a class first.
            </div>
        `;

        return;
    }

    loadAttendance();

}

function loadAttendance() {

    const classId = document.getElementById("attendanceClass").value;
    const date = document.getElementById("attendanceDate").value;

    if (!classId || !date) {
        return;
    }

    const students = data.students.filter(
        student => student.classId === classId
    );

    const saved =
        data.attendance[classId]?.[date] || {};

    currentAttendance = {};

    students.forEach(student => {

        currentAttendance[student.id] =
            saved[student.id] || "present";

    });

    renderAttendanceList();

}

function renderAttendanceList() {

    const classId = document.getElementById("attendanceClass").value;

    const students = data.students.filter(
        student => student.classId === classId
    );

    const container = document.getElementById("attendanceList");

    if (students.length === 0) {

        container.innerHTML = `
            <div class="empty">
                No students in this class.
                Add students first.
            </div>
        `;

        updateAttendanceSummary();

        return;
    }

    container.innerHTML = students.map(student => {

        const status = currentAttendance[student.id] || "present";

        const initial = student.name.charAt(0).toUpperCase();

        return `
            <div class="attendance-row">

                <div class="attendance-student">

                    <div class="avatar">
                        ${escapeHtml(initial)}
                    </div>

                    <div>
                        <strong>${escapeHtml(student.name)}</strong>
                        <small>Roll No: ${escapeHtml(student.roll)}</small>
                    </div>

                </div>

                <div class="attendance-buttons">

                    <button
                        class="attendance-btn present ${status === "present" ? "active" : ""}"
                        onclick="setAttendance('${student.id}', 'present')">
                        ✓ Present
                    </button>

                    <button
                        class="attendance-btn absent ${status === "absent" ? "active" : ""}"
                        onclick="setAttendance('${student.id}', 'absent')">
                        ✕ Absent
                    </button>

                </div>

            </div>
        `;

    }).join("");

    updateAttendanceSummary();

}

function setAttendance(studentId, status) {

    currentAttendance[studentId] = status;

    renderAttendanceList();

}

function updateAttendanceSummary() {

    const classId = document.getElementById("attendanceClass").value;

    const students = data.students.filter(
        student => student.classId === classId
    );

    let present = 0;
    let absent = 0;

    students.forEach(student => {

        if (currentAttendance[student.id] === "present") {
            present++;
        }

        if (currentAttendance[student.id] === "absent") {
            absent++;
        }

    });

    document.getElementById("attendanceTotal").textContent = students.length;
    document.getElementById("attendancePresent").textContent = present;
    document.getElementById("attendanceAbsent").textContent = absent;

}

function saveAttendance() {

    const classId = document.getElementById("attendanceClass").value;
    const date = document.getElementById("attendanceDate").value;

    if (!classId || !date) {
        showToast("Select class and date.");
        return;
    }

    if (!data.attendance[classId]) {
        data.attendance[classId] = {};
    }

    data.attendance[classId][date] = {
        ...currentAttendance
    };

    saveData();

    renderDashboard();
    renderStudents();
    renderReports();

    showToast("Attendance saved successfully.");

}

function getTodayRecords() {

    const records = [];

    data.classes.forEach(cls => {

        const todayData =
            data.attendance[cls.id]?.[today];

        if (!todayData) {
            return;
        }

        Object.entries(todayData).forEach(([studentId, status]) => {

            records.push({
                studentId,
                status
            });

        });

    });

    return records;

}

function getStudentStats(studentId) {

    let present = 0;
    let absent = 0;

    Object.values(data.attendance).forEach(classRecords => {

        Object.values(classRecords).forEach(dayRecords => {

            if (dayRecords[studentId] === "present") {
                present++;
            }

            if (dayRecords[studentId] === "absent") {
                absent++;
            }

        });

    });

    const total = present + absent;

    const percentage = total
        ? ((present / total) * 100).toFixed(1)
        : "0.0";

    return {
        present,
        absent,
        total,
        percentage
    };

}

function showStudentDetail(studentId) {

    const student = data.students.find(
        s => s.id === studentId
    );

    if (!student) {
        return;
    }

    const cls = getClass(student.classId);

    const stats = getStudentStats(studentId);

    document.getElementById("detailName").textContent = student.name;

    document.getElementById("detailClass").textContent =
        `${cls?.name || ""} - ${cls?.section || ""} • Roll No: ${student.roll}`;

    const history = [];

    Object.entries(data.attendance).forEach(([classId, records]) => {

        if (classId !== student.classId) {
            return;
        }

        Object.entries(records).forEach(([date, students]) => {

            if (students[studentId]) {

                history.push({
                    date,
                    status: students[studentId]
                });

            }

        });

    });

    history.sort((a, b) =>
        new Date(b.date) - new Date(a.date)
    );

    const historyHTML = history.length
        ? history.map(item => {

            const formattedDate =
                new Date(item.date + "T00:00:00").toLocaleDateString(
                    "en-IN",
                    {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                    }
                );

            return `
                <div class="history-item">

                    <span>${formattedDate}</span>

                    <strong class="${
                        item.status === "present"
                            ? "green-text"
                            : "red-text"
                    }">
                        ${
                            item.status === "present"
                                ? "✓ Present"
                                : "✕ Absent"
                        }
                    </strong>

                </div>
            `;

        }).join("")
        : `
            <div class="empty">
                No attendance history available.
            </div>
        `;

    document.getElementById("studentDetail").innerHTML = `

        <div class="detail-stats">

            <div class="detail-stat">
                <span>Total Days</span>
                <strong>${stats.total}</strong>
            </div>

            <div class="detail-stat">
                <span>Present</span>
                <strong class="green-text">${stats.present}</strong>
            </div>

            <div class="detail-stat">
                <span>Absent</span>
                <strong class="red-text">${stats.absent}</strong>
            </div>

            <div class="detail-stat">
                <span>Attendance</span>
                <strong>${stats.percentage}%</strong>
            </div>

        </div>

        <h3 class="history-title">
            Attendance History
        </h3>

        ${historyHTML}

    `;

    document.getElementById("detailModal").classList.add("show");

}

function renderReports() {

    const select = document.getElementById("reportClass");

    const classId = select.value;

    const search =
        document.getElementById("reportSearch").value.toLowerCase();

    let students = data.students;

    if (classId) {

        students = students.filter(
            student => student.classId === classId
        );

    }

    if (search) {

        students = students.filter(student =>
            student.name.toLowerCase().includes(search) ||
            student.roll.toLowerCase().includes(search)
        );

    }

    let totalPresent = 0;
    let totalAbsent = 0;

    students.forEach(student => {

        const stats = getStudentStats(student.id);

        totalPresent += stats.present;
        totalAbsent += stats.absent;

    });

    const totalRecords = totalPresent + totalAbsent;

    const percentage = totalRecords
        ? ((totalPresent / totalRecords) * 100).toFixed(1)
        : "0.0";

    document.getElementById("reportTotal").textContent = students.length;
    document.getElementById("reportPresent").textContent = totalPresent;
    document.getElementById("reportAbsent").textContent = totalAbsent;
    document.getElementById("reportPercentage").textContent = percentage + "%";

    const tbody = document.getElementById("reportTable");

    if (students.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty">
                        No students found.
                    </div>
                </td>
            </tr>
        `;

        return;

    }

    tbody.innerHTML = students.map(student => {

        const stats = getStudentStats(student.id);
        const cls = getClass(student.classId);

        let badgeClass = "status-good";

        if (stats.percentage < 75) {
            badgeClass = "status-danger";
        } else if (stats.percentage < 85) {
            badgeClass = "status-warning";
        }

        return `
            <tr>

                <td>${escapeHtml(student.roll)}</td>

                <td>
                    <span class="student-name">
                        ${escapeHtml(student.name)}
                    </span>
                </td>

                <td>
                    ${cls
                        ? escapeHtml(cls.name + " - " + cls.section)
                        : "-"
                    }
                </td>

                <td class="green-text">
                    ${stats.present}
                </td>

                <td class="red-text">
                    ${stats.absent}
                </td>

                <td>
                    ${stats.total}
                </td>

                <td>
                    <span class="status-badge ${badgeClass}">
                        ${stats.percentage}%
                    </span>
                </td>

            </tr>
        `;

    }).join("");

}

function getClass(classId) {

    return data.classes.find(
        cls => cls.id === classId
    );

}

function generateId() {

    return Date.now().toString(36) +
        Math.random().toString(36).substring(2);

}

function showToast(message) {

    const toast = document.getElementById("toast");

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 2500);

}

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}