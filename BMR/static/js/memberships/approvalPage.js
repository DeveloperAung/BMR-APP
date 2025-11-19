import { AuthService } from '../shared/services/AuthService.js';
import { NotificationService } from '../shared/services/NotificationService.js';
import { MembershipManager } from './managers/MembershipManager.js';

const actionLabels = {
    approve: 'approved',
    reject: 'rejected',
    revise: 'sent for revision'
};

const extractErrorMessage = (error) => {
    if (error?.response?.data) {
        const payload = error.response.data;
        if (typeof payload === 'string') {
            return payload;
        }
        return (
            payload?.detail ||
            payload?.message ||
            payload?.error ||
            'Unable to update membership. Please try again.'
        );
    }
    if (error?.message) {
        return error.message;
    }
    return 'Unable to update membership. Please try again.';
};

const initMembershipApprovalPage = () => {
    const actionContainer = document.getElementById('workflow-actions');
    if (!actionContainer) {
        return;
    }

    const memberUuid = actionContainer.dataset.memberUuid;
    const remarksInput = document.getElementById('remarks');
    const resultBox = document.getElementById('result');
    const statusBadge = document.getElementById('workflow-status-label');
    const actionButtons = Array.from(actionContainer.querySelectorAll('[data-action]'));

    const authService = new AuthService();
    const notificationService = new NotificationService();
    const manager = new MembershipManager({ authService, notificationService });

    const showMessage = (type, message) => {
        if (!resultBox) {
            return;
        }
        resultBox.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
    };

    const toggleButtons = (disable) => {
        actionButtons.forEach((btn) => {
            btn.disabled = disable;
        });
    };

    const handleDecision = async (action) => {
        if (!memberUuid) {
            showMessage('danger', 'Missing membership reference. Please reload and try again.');
            return;
        }

        const comment = (remarksInput?.value || '').trim();
        if ((action === 'reject' || action === 'revise') && !comment) {
            showMessage('danger', 'Remarks are required when rejecting or requesting a revision.');
            return;
        }

        toggleButtons(true);
        showMessage('info', 'Submitting decision...');

        try {
            const payload = {
                action,
                comment
            };
            const membership = await manager.workflowDecision(memberUuid, payload);

            if (statusBadge && membership?.workflow_status?.external_status) {
                statusBadge.textContent = membership.workflow_status.external_status;
            }
            if (remarksInput) {
                remarksInput.value = membership?.reason || comment;
            }

            showMessage('success', `Membership ${actionLabels[action] || 'updated'} successfully.`);
            // Redirect to membership list after a short delay so user sees confirmation
            setTimeout(() => {
                window.location.href = '/memberships/i/list/';
            }, 1200);
        } catch (error) {
            console.error('Workflow decision error:', error);
            showMessage('danger', extractErrorMessage(error));
        } finally {
            toggleButtons(false);
        }
    };

    actionButtons.forEach((button) => {
        button.addEventListener('click', () => handleDecision(button.dataset.action));
    });
};

if (typeof document !== 'undefined' && !window.__MEMBERSHIP_NO_AUTO_INIT__) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMembershipApprovalPage);
    } else {
        initMembershipApprovalPage();
    }
}
