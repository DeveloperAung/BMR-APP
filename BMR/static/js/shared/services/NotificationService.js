export class NotificationService {
    constructor() {
        this.container = this.createContainer();
    }

    createContainer() {
        let container = document.getElementById('notifications-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notifications-container';
            container.className = 'position-fixed top-0 end-0 p-3';
            container.style.zIndex = '1050';
            document.body.appendChild(container);
        }
        return container;
    }

    showSuccess(message) {
        this.show(message, 'success');
    }

    showError(message, error = null) {
        const fullMessage = error ? `${message}: ${error.message}` : message;
        this.show(fullMessage, 'danger');
        console.error('NotificationService Error:', error);
    }

    showWarning(message) {
        this.show(message, 'warning');
    }

    showInfo(message) {
        this.show(message, 'info');
    }

    showLoading(message = 'Loading...') {
        // prevent duplicate loaders
        if (this.loaderEl) return;

        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay d-flex justify-content-center align-items-center';
        overlay.innerHTML = `
            <div class="text-center">
                <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;"></div>
                <div class="mt-3 fw-bold text-primary">${message}</div>
            </div>
        `;

        Object.assign(overlay.style, {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            zIndex: 2000,
        });

        document.body.appendChild(overlay);
        this.loaderEl = overlay;
    }

    hideLoading() {
        if (this.loaderEl) {
            this.loaderEl.remove();
            this.loaderEl = null;
        }
    }

    show(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show`;
        notification.innerHTML = `
            <strong>${type.charAt(0).toUpperCase() + type.slice(1)}:</strong> ${this.escapeHtml(message).replace(/\n/g, '<br>')}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        this.container.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}