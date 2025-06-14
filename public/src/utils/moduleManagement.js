const API_BASE_URL = 'http://localhost:3001/api';
let allModules = [];

function showLoading() {
  document.getElementById('loading-spinner').style.display = 'flex';
}

function hideLoading() {
  document.getElementById('loading-spinner').style.display = 'none';
}

async function loadModules() {
  showLoading();
  try {
    const response = await fetch(`${API_BASE_URL}/modules`);
    const data = await response.json();
    if (data.success) {
      allModules = data.data;
      displayModules(allModules);
    } else {
      throw new Error(data.message || 'Error loading modules');
    }
  } catch (error) {
    console.error(error);
    alert('Error loading modules');
  } finally {
    hideLoading();
  }
}

function displayModules(modules) {
  const tableBody = document.getElementById('modules-table');
  tableBody.innerHTML = '';
  if (modules.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No modules found</td></tr>';
    return;
  }
  modules.forEach(mod => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${mod.moduleId}</td>
      <td>${mod.title}</td>
      <td>${mod.description || ''}</td>
      <td>${mod.courseId || ''}</td>
      <td>${mod.order || ''}</td>
      <td>${mod.status || ''}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-2" onclick="editModule('${mod.moduleId}')">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteModule('${mod.moduleId}')">
          <i class="fas fa-trash"></i> Delete
        </button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

function filterModules() {
  const search = document.getElementById('searchModule').value.toLowerCase();
  const filtered = allModules.filter(m =>
    m.moduleId.toLowerCase().includes(search) ||
    m.title.toLowerCase().includes(search) ||
    (m.description || '').toLowerCase().includes(search) ||
    (m.courseId || '').toLowerCase().includes(search) ||
    (m.status || '').toLowerCase().includes(search)
  );
  displayModules(filtered);
}

async function createModule() {
  const moduleId = document.getElementById('module-id').value;
  const title = document.getElementById('module-title').value;
  const description = document.getElementById('module-description').value;
  const courseId = document.getElementById('module-course-id').value;
  const order = parseInt(document.getElementById('module-order').value) || null;
  const status = document.getElementById('module-status').value;

  if (!moduleId || !title) {
    alert('Please fill in the required fields');
    return;
  }
  showLoading();
  try {
    const response = await fetch(`${API_BASE_URL}/modules`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ moduleId, title, description, courseId, order, status })
    });
    const data = await response.json();
    if (data.success) {
      bootstrap.Modal.getInstance(document.getElementById('addModuleModal')).hide();
      document.getElementById('add-module-form').reset();
      loadModules();
      alert('Module created successfully!');
    } else {
      alert(data.message || 'Error creating module');
    }
  } catch (error) {
    console.error(error);
    alert('Error creating module');
  } finally {
    hideLoading();
  }
}

async function editModule(moduleId) {
  showLoading();
  try {
    const response = await fetch(`${API_BASE_URL}/modules/${moduleId}`);
    const data = await response.json();
    if (data.success) {
      const mod = data.data;
      document.getElementById('edit-module-id').value = mod.moduleId;
      document.getElementById('edit-module-title').value = mod.title;
      document.getElementById('edit-module-description').value = mod.description || '';
      document.getElementById('edit-module-course-id').value = mod.courseId || '';
      document.getElementById('edit-module-order').value = mod.order || '';
      document.getElementById('edit-module-status').value = mod.status || 'Active';

      new bootstrap.Modal(document.getElementById('editModuleModal')).show();
    } else {
      alert(data.message || 'Error fetching module');
    }
  } catch (error) {
    console.error(error);
    alert('Error fetching module');
  } finally {
    hideLoading();
  }
}

async function updateModule() {
  const moduleId = document.getElementById('edit-module-id').value;
  const title = document.getElementById('edit-module-title').value;
  const description = document.getElementById('edit-module-description').value;
  const courseId = document.getElementById('edit-module-course-id').value;
  const order = parseInt(document.getElementById('edit-module-order').value) || null;
  const status = document.getElementById('edit-module-status').value;

  if (!title) {
    alert('Title is required');
    return;
  }
  showLoading();
  try {
    const response = await fetch(`${API_BASE_URL}/modules/${moduleId}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ title, description, courseId, order, status })
    });
    const data = await response.json();
    if (data.success) {
      bootstrap.Modal.getInstance(document.getElementById('editModuleModal')).hide();
      loadModules();
      alert('Module updated successfully!');
    } else {
      alert(data.message || 'Error updating module');
    }
  } catch (error) {
    console.error(error);
    alert('Error updating module');
  } finally {
    hideLoading();
  }
}

async function deleteModule(moduleId) {
  if (!confirm('Are you sure you want to delete this module?')) return;
  showLoading();
  try {
    const response = await fetch(`${API_BASE_URL}/modules/${moduleId}`, {
      method: 'DELETE'
    });
    const data = await response.json();
    if (data.success) {
      loadModules();
      alert('Module deleted successfully!');
    } else {
      alert(data.message || 'Error deleting module');
    }
  } catch (error) {
    console.error(error);
    alert('Error deleting module');
  } finally {
    hideLoading();
  }
}

// Make functions globally available
window.loadModules = loadModules;
window.createModule = createModule;
window.editModule = editModule;
window.updateModule = updateModule;
window.deleteModule = deleteModule;
window.filterModules = filterModules;

document.addEventListener('DOMContentLoaded', loadModules);