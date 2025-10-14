import { ApiErrorHandler } from '../../../shared/services/ApiErrorHandler.js';
import { EventManager } from '../managers/EventManager.js';

export class EventFormHandler {
  /**
   * @param {HTMLFormElement} form
   * @param {object} services - { authService, notificationService }
   */
  constructor(form, { authService, notificationService }) {
    if (!form) throw new Error('Form element is required');
    if (!notificationService) throw new Error('NotificationService is required');

    this.form = form;
    this.authService = authService;
    this.notificationService = notificationService;

    this.manager = new EventManager({
      authService,
      notificationService,
    });

    // Detect Quill editor
    this.quill = typeof editor7 !== 'undefined' ? editor7 : window.editor7 || null;

    this.multiPicker = null;
    this.rangePicker = null;

    this.bindEvents();
  }

  bindEvents() {

    this.form.addEventListener('submit', (e) => this.handleSubmit(e));

    const coverInput = this.form.querySelector('#cover_image');
    if (coverInput) {
      coverInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        const preview = document.getElementById('cover_image_preview');
        if (file) {
          preview.src = URL.createObjectURL(file);
          preview.style.display = 'block';
        } else {
          preview.style.display = 'none';
        }
      });
    }

    this.initializeDatePickers();
  }

  initializeDatePickers() {
    const shortCourseCheckbox = document.getElementById('is_short_course');
    const multiContainer = document.getElementById('multi-date-container');
    const rangeContainer = document.getElementById('range-date-container');
    const multiInput = document.getElementById('multiple-date');
    const rangeInput = document.getElementById('range-date');

    // --- Safe parse existing data for edit mode ---
    const isShort = this.form.dataset.isShortCourse === 'true';
    let eventDates = [];
    try {
      const raw = this.form.dataset.eventDates;
      eventDates = JSON.parse(raw || '[]');
    } catch (e) {
      console.warn("Invalid eventDates JSON:", this.form.dataset.eventDates, e);
      eventDates = [];
    }

    // --- Initialize Flatpickr ---
    this.multiPicker = flatpickr(multiInput, {
      mode: 'multiple',
      dateFormat: 'Y-m-d',
    });

    this.rangePicker = flatpickr(rangeInput, {
      mode: 'range',
      dateFormat: 'Y-m-d',
    });

    // --- Helper to toggle display ---
    const togglePickers = () => {
      if (shortCourseCheckbox.checked) {
        multiContainer.style.display = 'flex';
        rangeContainer.style.display = 'none';
      } else {
        multiContainer.style.display = 'none';
        rangeContainer.style.display = 'flex';
      }
    };
    shortCourseCheckbox.addEventListener('change', togglePickers);

    // --- Prepopulate for edit ---
    if (isShort) {
      shortCourseCheckbox.checked = true;
      togglePickers();
      if (eventDates.length > 0) this.multiPicker.setDate(eventDates);
    } else {
      shortCourseCheckbox.checked = false;
      togglePickers();
      if (eventDates.length >= 2)
        this.rangePicker.setDate([eventDates[0], eventDates[eventDates.length - 1]]);
    }

    togglePickers(); // initialize visibility
  }

  /** Clear inline field errors */
  clearFieldErrors() {
    this.form.querySelectorAll('.is-invalid').forEach((el) => {
      el.classList.remove('is-invalid');
    });
    this.form.querySelectorAll('.invalid-feedback').forEach((el) => el.remove());
  }

  /** Build FormData including Flatpickr dates */
  getFormData() {
    if (this.quill && this.quill.root) {
      const hidden = this.form.querySelector('#description');
      if (hidden) hidden.value = this.quill.root.innerHTML;
    }

    const formData = new FormData(this.form);

    const switches = [
      'is_published',
      'is_active',
      'set_banner',
      'need_registration',
      'is_short_course',
    ];
    switches.forEach((name) => {
      const field = this.form.querySelector(`[name="${name}"]`);
      formData.set(name, field?.checked ? 'true' : 'false');
    });

    const isShort = this.form.querySelector('#is_short_course').checked;
    formData.delete('event_dates');

    if (isShort && this.multiPicker) {
      (this.multiPicker.selectedDates || []).forEach((date) => {
        formData.append('event_dates[]', date.toISOString().split('T')[0]);
      });
      formData.set('is_short_course', 'true');
    } else if (this.rangePicker) {
      const selected = this.rangePicker.selectedDates;
      formData.set('is_short_course', 'false');
      if (selected.length === 2) {
        const start = selected[0];
        const end = selected[1];
        formData.append('start_date', start.toISOString().split('T')[0]);
        formData.append('end_date', end.toISOString().split('T')[0]);
        // Include all days between start and end
        let d = new Date(start);
        while (d <= end) {
          formData.append('event_dates[]', d.toISOString().split('T')[0]);
          d.setDate(d.getDate() + 1);
        }
      }
    }

    const coverImage = formData.get('cover_image');
    if (!coverImage || !coverImage.name) formData.delete('cover_image');

    const mediaFile = formData.get('media');
    if (!mediaFile || !mediaFile.name) formData.delete('media');

    return formData;
  }

  /** Handle form submission */
  async handleSubmit(event) {
    event.preventDefault();
    this.clearFieldErrors();

    if (!this.form.checkValidity()) {
      this.form.classList.add('was-validated');
      this.notificationService.showWarning('Please correct the errors in the form.');
      return;
    }

    try {
      const formData = this.getFormData();
      const eventId = this.form.dataset.eventId;
      console.log('🔍 Sending FormData to API:');
        for (const [key, value] of formData.entries()) {
          console.log(`${key}:`, value);
        }
      if (eventId) {
        await this.manager.updateEvent(eventId, formData);
        this.notificationService.showSuccess('Event updated successfully!');
      } else {
        await this.manager.createEvent(formData);
        this.notificationService.showSuccess('Event created successfully!');
      }

      setTimeout(() => {
        window.location.href = '/events/i/list/';
      }, 1500);
    } catch (error) {
      console.error('catch error', error);
      ApiErrorHandler.handle(error, this.notificationService, { form: this.form });
    }
  }
}
