// js/app.js
import { recordService } from "./data.js";

// DOM Elements
const sections = document.querySelectorAll(".page-section");
const navLinks = document.querySelectorAll(".nav-link");
const recordForm = document.getElementById("record-form");
const recordsListContainer = document.getElementById("records-list");
const searchInput = document.getElementById("search-input");
const filterStatus = document.getElementById("filter-status");
const displayedCountEl = document.getElementById("displayed-count");
const totalCountEl = document.getElementById("total-count");
const pendingCountEl = document.getElementById("pending-count");
const completedCountEl = document.getElementById("completed-count");
const feedbackEl = document.getElementById("feedback-message");
const cancelBtn = document.getElementById("cancel-btn");
const formHeading = document.getElementById("form-heading");
const saveBtn = document.getElementById("save-btn");
const recordIdInput = document.getElementById("record-id");

let allRecords = [];
let feedbackTimeoutId = null;

// Initialize App on DOM load
document.addEventListener("DOMContentLoaded", async () => {
    setupNavigation();
    setupEventListeners();
    await loadAndRenderRecords();
});

// Navigation Handling
function setupNavigation() {
    navLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const targetId = link.getAttribute("data-target");

            navLinks.forEach(l => l.classList.remove("active"));
            link.classList.add("active");

            sections.forEach(section => {
                section.classList.remove("active");
                if (section.id === targetId) {
                    section.classList.add("active");
                }
            });
        });
    });

    const gotoManageBtn = document.getElementById("goto-manage-btn");
    if (gotoManageBtn) {
        gotoManageBtn.addEventListener("click", () => {
            document.querySelector('[data-target="manage"]').click();
        });
    }
}

// Load and Render Records
async function loadAndRenderRecords() {
    recordsListContainer.innerHTML = "";
    const loadingEl = document.createElement("p");
    loadingEl.className = "text-muted";
    loadingEl.style.gridColumn = "span 2";
    loadingEl.style.textAlign = "center";
    loadingEl.style.padding = "2rem";
    loadingEl.textContent = "Loading records...";
    recordsListContainer.appendChild(loadingEl);

    try {
        const records = await recordService.list();
        allRecords = Array.isArray(records) ? records : [];
        updateStats(allRecords);
        filterAndRenderList();
    } catch (error) {
        allRecords = [];
        updateStats([]);
        recordsListContainer.innerHTML = "";
        const errorEl = document.createElement("p");
        errorEl.className = "text-muted";
        errorEl.style.gridColumn = "span 2";
        errorEl.style.textAlign = "center";
        errorEl.style.padding = "2rem";
        errorEl.textContent = error.message || "Unable to load records.";
        recordsListContainer.appendChild(errorEl);
        showFeedback(error.message, "error");
    }
}

// Update Dashboard Statistics
function updateStats(records) {
    const total = records.length;
    const pending = records.filter(r => r.status === "Pending").length;
    const completed = records.filter(r => r.status === "Completed").length;

    totalCountEl.textContent = total;
    pendingCountEl.textContent = pending;
    completedCountEl.textContent = completed;
}

// Event Listeners for Form & Filters
function setupEventListeners() {
    recordForm.addEventListener("submit", handleFormSubmit);
    cancelBtn.addEventListener("click", resetForm);
    searchInput.addEventListener("input", filterAndRenderList);
    filterStatus.addEventListener("change", filterAndRenderList);
}

// Filter and Search Logic
function filterAndRenderList() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedStatus = filterStatus.value;

    const filtered = allRecords.filter(record => {
        const matchesSearch =
            !searchTerm ||
            record.title.toLowerCase().includes(searchTerm) ||
            record.category.toLowerCase().includes(searchTerm) ||
            record.description.toLowerCase().includes(searchTerm);
        const matchesStatus = selectedStatus === "All" || record.status === selectedStatus;
        return matchesSearch && matchesStatus;
    });

    renderRecords(filtered);
}

// Render Records to DOM using safe .textContent
function renderRecords(records) {
    recordsListContainer.innerHTML = "";
    displayedCountEl.textContent = records.length;

    if (records.length === 0) {
        const emptyEl = document.createElement("p");
        emptyEl.className = "text-muted";
        emptyEl.style.gridColumn = "span 2";
        emptyEl.style.textAlign = "center";
        emptyEl.style.padding = "2rem";
        emptyEl.textContent = "No matching records found.";
        recordsListContainer.appendChild(emptyEl);
        return;
    }

    records.forEach(record => {
        const card = document.createElement("div");
        card.className = "record-card";

        let statusClass = "status-pending";
        if (record.status === "In progress") statusClass = "status-in-progress";
        if (record.status === "Completed") statusClass = "status-completed";

        const header = document.createElement("div");
        header.className = "record-header";

        const titleEl = document.createElement("h3");
        titleEl.className = "record-title";
        titleEl.textContent = record.title;

        const badgeEl = document.createElement("span");
        badgeEl.className = "record-id-badge";
        badgeEl.textContent = `ID: ${record.id}`;

        header.appendChild(titleEl);
        header.appendChild(badgeEl);

        const categoryEl = document.createElement("span");
        categoryEl.className = "record-category";
        categoryEl.textContent = record.category;

        const descEl = document.createElement("p");
        descEl.className = "record-desc";
        descEl.textContent = record.description;

        const footer = document.createElement("div");
        footer.className = "record-footer";

        const statusEl = document.createElement("span");
        statusEl.className = `status-badge ${statusClass}`;
        statusEl.textContent = record.status;

        const actionsEl = document.createElement("div");
        actionsEl.className = "record-actions";

        const viewBtn = document.createElement("button");
        viewBtn.type = "button";
        viewBtn.className = "action-btn view-btn";
        viewBtn.textContent = "View";
        viewBtn.addEventListener("click", () => openViewModal(record.id));

        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "action-btn edit-btn";
        editBtn.textContent = "Edit";
        editBtn.addEventListener("click", () => populateFormForEdit(record));

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "action-btn delete-btn";
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", () => confirmAndDelete(record.id));

        actionsEl.appendChild(viewBtn);
        actionsEl.appendChild(editBtn);
        actionsEl.appendChild(deleteBtn);

        footer.appendChild(statusEl);
        footer.appendChild(actionsEl);

        card.appendChild(header);
        card.appendChild(categoryEl);
        card.appendChild(descEl);
        card.appendChild(footer);

        recordsListContainer.appendChild(card);
    });
}

// Handle Form Submission (Create or Update)
async function handleFormSubmit(e) {
    e.preventDefault();

    const id = recordIdInput.value;
    const title = document.getElementById("title").value.trim();
    const category = document.getElementById("category").value.trim();
    const description = document.getElementById("description").value.trim();
    const status = document.getElementById("status").value;

    if (title.length < 3 || title.length > 80) {
        showFeedback("Title must be between 3 and 80 characters.", "error");
        return;
    }
    if (category.length < 2 || category.length > 40) {
        showFeedback("Please select a valid category.", "error");
        return;
    }
    if (description.length < 5 || description.length > 300) {
        showFeedback("Description must be between 5 and 300 characters.", "error");
        return;
    }

    const recordData = { title, category, description, status };
    const originalBtnText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = id ? "Updating..." : "Saving...";

    try {
        if (id) {
            await recordService.update(id, recordData);
            showFeedback("Record updated successfully!", "success");
        } else {
            await recordService.create(recordData);
            showFeedback("New record added successfully!", "success");
        }

        resetForm();
        await loadAndRenderRecords();
    } catch (error) {
        showFeedback(error.message, "error");
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = id ? "Update Record" : originalBtnText;
    }
}

// Populate Form for Editing
function populateFormForEdit(record) {
    recordIdInput.value = record.id;
    document.getElementById("title").value = record.title;
    document.getElementById("category").value = record.category;
    document.getElementById("description").value = record.description;
    document.getElementById("status").value = record.status;

    formHeading.textContent = `Edit Record (ID: ${record.id})`;
    saveBtn.textContent = "Update Record";
    cancelBtn.style.display = "inline-block";

    document.querySelector(".form-card").scrollIntoView({ behavior: "smooth" });
}

// Reset Form State
function resetForm() {
    recordForm.reset();
    recordIdInput.value = "";
    formHeading.textContent = "Add New Request";
    saveBtn.textContent = "Save Record";
    cancelBtn.style.display = "none";
}

// Confirm and Delete Record
async function confirmAndDelete(id) {
    const confirmed = window.confirm(`Are you sure you want to delete record ID ${id}?`);
    if (!confirmed) {
        showFeedback("Deletion cancelled.", "success");
        return;
    }

    try {
        await recordService.remove(id);
        showFeedback("Record deleted successfully.", "success");
        await loadAndRenderRecords();
    } catch (error) {
        showFeedback(error.message, "error");
    }
}

// View Record Modal Logic
async function openViewModal(id) {
    const modal = document.getElementById("view-modal");
    document.getElementById("modal-id-badge").textContent = `ID: ${id}`;
    document.getElementById("modal-category").textContent = "Loading...";
    document.getElementById("modal-title").textContent = "Loading record...";
    document.getElementById("modal-desc").textContent = "Fetching record details from server.";

    const statusBadge = document.getElementById("modal-status");
    statusBadge.textContent = "Pending";
    statusBadge.className = "status-badge status-pending";

    modal.style.display = "flex";

    const closeModal = () => { modal.style.display = "none"; };
    document.getElementById("close-modal-btn").onclick = closeModal;
    document.getElementById("modal-done-btn").onclick = closeModal;
    modal.onclick = (e) => { if (e.target === modal) closeModal(); };

    try {
        const record = await recordService.get(id);
        document.getElementById("modal-id-badge").textContent = `ID: ${record.id}`;
        document.getElementById("modal-category").textContent = record.category;
        document.getElementById("modal-title").textContent = record.title;
        document.getElementById("modal-desc").textContent = record.description;

        statusBadge.textContent = record.status;
        statusBadge.className = "status-badge";
        if (record.status === "Pending") statusBadge.classList.add("status-pending");
        if (record.status === "In progress") statusBadge.classList.add("status-in-progress");
        if (record.status === "Completed") statusBadge.classList.add("status-completed");
    } catch (error) {
        document.getElementById("modal-title").textContent = "Error loading record";
        document.getElementById("modal-desc").textContent = error.message;
        showFeedback(error.message, "error");
    }
}

// Feedback Message Utility
function showFeedback(message, type) {
    if (feedbackTimeoutId) {
        clearTimeout(feedbackTimeoutId);
    }
    feedbackEl.textContent = message;
    feedbackEl.className = `feedback-message ${type}`;
    feedbackEl.style.display = "block";

    feedbackTimeoutId = setTimeout(() => {
        feedbackEl.style.display = "none";
    }, 4000);
}