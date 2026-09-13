/***** SCRIPT PERSONALIZZATO *****/
(function () {
  'use strict';

  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  function toIsoDate(value) {
    var match = /^([0-3]\d)\/([0-1]\d)\/(\d{4})$/.exec(value || '');
    return match ? match[3] + '-' + match[2] + '-' + match[1] : value;
  }

  function toItalianDate(value) {
    var match = /^(\d{4})-([0-1]\d)-([0-3]\d)$/.exec(value || '');
    return match ? match[3] + '/' + match[2] + '/' + match[1] : value;
  }

  function parseConstraint(value) {
    if (!value) {
      return [];
    }
    try {
      var parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function prepareNativeDates() {
    document.querySelectorAll('.gs-native-date').forEach(function (input) {
      input.value = toIsoDate(input.value);
      input.type = 'date';

      if (input.dataset.gsDateMin) {
        input.min = toIsoDate(input.dataset.gsDateMin);
      }
      if (input.dataset.gsDateMax) {
        input.max = toIsoDate(input.dataset.gsDateMax);
      }

      var disabledDates = parseConstraint(input.dataset.gsDateDisabled).map(toIsoDate);
      var disabledWeekdays = parseConstraint(input.dataset.gsDateDisabledWeekdays).map(Number);
      var validateDate = function () {
        var selected = input.value;
        var weekday = selected ? new Date(selected + 'T00:00:00').getDay() : -1;
        var unavailable = disabledDates.indexOf(selected) !== -1 || disabledWeekdays.indexOf(weekday) !== -1;
        input.setCustomValidity(unavailable ? 'La data selezionata non è disponibile.' : '');
      };

      input.addEventListener('change', validateDate);
      validateDate();

      if (input.form && !input.form.dataset.gsNativeDatesReady) {
        input.form.dataset.gsNativeDatesReady = 'true';
        input.form.addEventListener('submit', function () {
          var fields = input.form.querySelectorAll('.gs-native-date');
          var values = [];
          fields.forEach(function (field) {
            values.push(field.value);
            field.type = 'text';
            field.value = toItalianDate(field.value);
          });
          window.setTimeout(function () {
            fields.forEach(function (field, index) {
              field.value = values[index];
              field.type = 'date';
            });
          }, 0);
        });
      }
    });
  }

  function prepareResponsiveTables() {
    var pageTitle = document.querySelector('#gs-main h1');
    var title = pageTitle ? pageTitle.textContent.trim() : 'dati';

    document.querySelectorAll('.table-responsive').forEach(function (container) {
      var table = container.querySelector('table');
      if (!table) {
        return;
      }
      table.classList.add('gs-data-table');
      if (!table.classList.contains('gs-user-table') && !container.hasAttribute('tabindex')) {
        container.setAttribute('tabindex', '0');
      }
      if (!container.hasAttribute('role')) {
        container.setAttribute('role', 'region');
      }
      if (!container.hasAttribute('aria-label')) {
        container.setAttribute('aria-label', 'Tabella dati: ' + title);
      }

      var body = table.tBodies.length ? table.tBodies[0] : null;
      if (body && body.rows.length === 0) {
        var emptyRow = body.insertRow();
        var emptyCell = emptyRow.insertCell();
        emptyRow.className = 'gs-table-empty-row';
        emptyCell.colSpan = Math.max(table.querySelectorAll('thead th').length, 1);
        emptyCell.innerHTML = '<div class="gs-table-empty"><strong>Nessun risultato</strong><span>Modifica i filtri oppure aggiungi un nuovo elemento.</span></div>';
      }
    });
  }

  function prepareConfirmModals() {
    document.querySelectorAll('#gs-modal-confirm').forEach(function (modal) {
      if (modal.dataset.gsConfirmReady === 'true') {
        return;
      }
      modal.dataset.gsConfirmReady = 'true';
      modal.addEventListener('show.bs.modal', function (event) {
        var trigger = event.relatedTarget;
        if (!trigger) {
          return;
        }

        var title = modal.querySelector('#gs-modal-confirm-titolo');
        var content = modal.querySelector('#gs-modal-confirm-contenuto');
        var confirm = modal.querySelector('#gs-modal-confirm-yes');
        if (title) {
          title.textContent = trigger.getAttribute('data-titolo') || trigger.getAttribute('title') || 'Conferma operazione';
        }
        if (content) {
          content.textContent = trigger.getAttribute('data-contenuto') || trigger.getAttribute('data-text') || 'Vuoi continuare?';
        }
        if (confirm) {
          var destructive = trigger.getAttribute('data-variante') === 'danger' || trigger.classList.contains('btn-danger') || trigger.classList.contains('text-danger');
          var variant = destructive ? 'btn-danger' : 'btn-primary';
          confirm.setAttribute('href', trigger.getAttribute('data-href') || '#');
          confirm.classList.remove('btn-primary', 'btn-danger');
          confirm.classList.add(variant);
        }
      });
    });
  }

  function prepareFilters() {
    document.querySelectorAll('.gs-filter-form').forEach(function (form) {
      var panel = form.closest('.gs-filter-panel');
      var counter = panel ? panel.querySelector('[data-gs-filter-count]') : null;
      var fields = Array.prototype.slice.call(form.querySelectorAll('input, select, textarea')).filter(function (field) {
        return field.type !== 'hidden' && field.type !== 'submit' && field.type !== 'button';
      });

      var isActive = function (field) {
        if (field.type === 'checkbox' || field.type === 'radio') {
          return field.checked;
        }
        if (field.tagName === 'SELECT' && field.multiple) {
          return Array.prototype.some.call(field.options, function (option) { return option.selected && option.value !== ''; });
        }
        return String(field.value || '').trim() !== '';
      };

      var updateCounter = function () {
        var activeCount = fields.filter(isActive).length;
        if (counter) {
          counter.textContent = activeCount + (activeCount === 1 ? ' attivo' : ' attivi');
          counter.hidden = activeCount === 0;
        }
      };

      fields.forEach(function (field) {
        field.addEventListener('change', updateCounter);
        field.addEventListener('input', updateCounter);
      });

      updateCounter();
    });
  }

  ready(function () {
    prepareNativeDates();
    prepareResponsiveTables();
    prepareFilters();
    prepareConfirmModals();

    var sidebar = document.getElementById('gs-sidebar');
    var toggle = document.getElementById('gs-sidebar-toggle');
    var close = document.getElementById('gs-sidebar-close');
    var overlay = document.getElementById('gs-sidebar-overlay');
    var desktopQuery = window.matchMedia('(min-width: 992px)');
    var sidebarStorageKey = 'gs-admin-sidebar-collapsed';

    document.querySelectorAll('[data-gs-sidebar-group]').forEach(function (button) {
      var submenu = document.getElementById(button.getAttribute('aria-controls'));
      if (!submenu) {
        return;
      }
      button.addEventListener('click', function () {
        var expanded = button.getAttribute('aria-expanded') === 'true';
        button.setAttribute('aria-expanded', String(!expanded));
        submenu.hidden = expanded;
      });
    });

    if (!sidebar || !toggle || !overlay) {
      return;
    }

    function getStoredDesktopState() {
      try {
        return window.localStorage.getItem(sidebarStorageKey) === 'true';
      } catch (error) {
        return false;
      }
    }

    function storeDesktopState(collapsed) {
      try {
        window.localStorage.setItem(sidebarStorageKey, String(collapsed));
      } catch (error) {
        // La sidebar resta utilizzabile anche se lo storage non è disponibile.
      }
    }

    function setDesktopSidebar(collapsed, persist) {
      document.body.classList.toggle('gs-sidebar-collapsed', collapsed);
      document.body.classList.remove('gs-sidebar-open');
      toggle.setAttribute('aria-expanded', String(!collapsed));
      toggle.setAttribute('aria-label', collapsed ? 'Mostra il menu principale' : 'Nascondi il menu principale');
      overlay.hidden = true;
      sidebar.inert = collapsed;
      sidebar.setAttribute('aria-hidden', String(collapsed));
      if (persist) {
        storeDesktopState(collapsed);
      }
    }

    function setMobileSidebar(open, restoreFocus) {
      document.body.classList.toggle('gs-sidebar-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Chiudi il menu principale' : 'Apri il menu principale');
      overlay.hidden = !open;
      sidebar.inert = !open;
      sidebar.setAttribute('aria-hidden', String(!open));
      if (open) {
        var firstLink = sidebar.querySelector('.gs-sidebar-link.active, a, button');
        if (firstLink) {
          firstLink.focus();
        }
      } else if (restoreFocus !== false) {
        toggle.focus();
      }
    }

    toggle.addEventListener('click', function () {
      if (desktopQuery.matches) {
        setDesktopSidebar(!document.body.classList.contains('gs-sidebar-collapsed'), true);
      } else {
        setMobileSidebar(!document.body.classList.contains('gs-sidebar-open'));
      }
    });
    if (close) {
      close.addEventListener('click', function () { setMobileSidebar(false); });
    }
    overlay.addEventListener('click', function () { setMobileSidebar(false); });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && document.body.classList.contains('gs-sidebar-open')) {
        setMobileSidebar(false);
      }
    });
    sidebar.addEventListener('keydown', function (event) {
      if (event.key !== 'Tab' || !document.body.classList.contains('gs-sidebar-open')) {
        return;
      }
      var focusable = Array.prototype.slice.call(sidebar.querySelectorAll('a[href], button:not([disabled])'));
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    var resetSidebar = function (event) {
      if (event.matches) {
        setDesktopSidebar(getStoredDesktopState(), false);
      } else {
        document.body.classList.remove('gs-sidebar-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Apri il menu principale');
        overlay.hidden = true;
        sidebar.inert = true;
        sidebar.setAttribute('aria-hidden', 'true');
      }
    };
    if (desktopQuery.addEventListener) {
      desktopQuery.addEventListener('change', resetSidebar);
    } else {
      desktopQuery.addListener(resetSidebar);
    }
    resetSidebar(desktopQuery);
  });
}());
