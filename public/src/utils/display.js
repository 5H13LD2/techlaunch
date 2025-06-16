// display.js - Utility functions for UI feedback

// Show loading spinner
export const showLoading = () => {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        spinner.style.display = 'flex';
    } else {
        // Create spinner if it doesn't exist
        const newSpinner = document.createElement('div');
        newSpinner.id = 'loading-spinner';
        newSpinner.className = 'loading-spinner';
        newSpinner.innerHTML = `
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        `;
        document.body.appendChild(newSpinner);
    }
};

// Hide loading spinner
export const hideLoading = () => {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        spinner.style.display = 'none';
    }
};

// Show toast notification
export const showToast = (message, type = 'success') => {
    // Remove any existing toasts
    const existingToast = document.querySelector('.toast-container');
    if (existingToast) {
        existingToast.remove();
    }

    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : 'success'} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    // Toast content
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    // Add toast to container
    toastContainer.appendChild(toast);

    // Initialize and show toast
    const bsToast = new bootstrap.Toast(toast, {
        animation: true,
        autohide: true,
        delay: 3000
    });
    bsToast.show();

    // Remove toast after it's hidden
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
};

// Add required CSS
const style = document.createElement('style');
style.textContent = `
    .loading-spinner {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    }

    .toast-container {
        z-index: 9999;
    }

    .toast {
        min-width: 250px;
    }
`;
document.head.appendChild(style); 