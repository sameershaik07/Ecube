
    // ---------- EVENT DATA ----------
    const categoriesMap = {
      "Sports & Games": ["Thug of war", "Shuttle", "Cricket", "Carroms", "Chess"],
      "Aavishkar": ["Paper presentation", "Code sprint", "Web design", "Project Expo"],
      "Fun Events": ["Slow Scooty Race", "Eating Competition", "Nail Art", "Mehendi", "Treasure Hunt", "Rangoli"],
      "Annual Day": ["Dance Competition", "Miss Ashoka"],
      "Live Music Concert": ["Dance Competition"]
    };
    const categoryKeys = ["Sports & Games", "Aavishkar", "Fun Events", "Annual Day", "Live Music Concert"];
    
    // Local storage key
    let registrations = []; // each obj: { id, name, email, phone, category, event, timestamp }

    // Helper: save to localStorage
    function saveRegistrations() {
      localStorage.setItem("aavishkar_registrations", JSON.stringify(registrations));
    }

    function loadRegistrationsFromStorage() {
      const stored = localStorage.getItem("aavishkar_registrations");
      if(stored) {
        registrations = JSON.parse(stored);
      } else {
        registrations = [];
      }
      renderRegistrationTable();
    }

    // Helper: show toast
    function showToast(msg, isError = false) {
      const toast = document.createElement('div');
      toast.className = 'toast-msg';
      toast.innerText = msg;
      toast.style.background = isError ? '#E15554' : '#FFB347';
      toast.style.color = '#fff';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2800);
    }

    // render all event cards (category blocks)
    function renderEventsGrid() {
      const container = document.getElementById('eventsContainer');
      if(!container) return;
      container.innerHTML = '';
      for(let cat of categoryKeys) {
        const events = categoriesMap[cat];
        const card = document.createElement('div');
        card.className = 'category-card';
        card.style.animationDelay = `${Math.random() * 0.2}s`;
        // icon based on category
        let icon = '<i class="fas fa-trophy"></i>';
        if(cat === 'Aavishkar') icon = '<i class="fas fa-microchip"></i>';
        else if(cat === 'Fun Events') icon = '<i class="fas fa-mask"></i>';
        else if(cat === 'Annual Day') icon = '<i class="fas fa-star"></i>';
        else if(cat === 'Live Music Concert') icon = '<i class="fas fa-music"></i>';
        card.innerHTML = `
          <div class="cat-name">${icon} ${cat}</div>
          <div class="event-list">
            ${events.map(ev => `<div class="event-badge" data-category="${cat}" data-event="${ev}"><i class="fas fa-hand-peace"></i> ${ev}</div>`).join('')}
          </div>
          <div class="register-trigger"><span class="reg-sm-btn" data-category="${cat}" data-event="${events[0]}"><i class="fas fa-pen-alt"></i> Quick register from this category</span></div>
        `;
        container.appendChild(card);
      }
      // attach event listeners to all badges & quick register buttons
      document.querySelectorAll('.event-badge').forEach(badge => {
        badge.addEventListener('click', (e) => {
          e.stopPropagation();
          const category = badge.getAttribute('data-category');
          const eventName = badge.getAttribute('data-event');
          prefetchRegistrationForm(category, eventName);
          document.getElementById('registerPanel').scrollIntoView({ behavior: 'smooth', block: 'center' });
          showToast(`📌 ${eventName} selected, fill details & register`);
        });
      });
      document.querySelectorAll('.reg-sm-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const category = btn.getAttribute('data-category');
          let eventVal = btn.getAttribute('data-event');
          if(!eventVal && category) {
            const firstEv = categoriesMap[category]?.[0];
            if(firstEv) eventVal = firstEv;
          }
          if(category && eventVal) prefetchRegistrationForm(category, eventVal);
          document.getElementById('registerPanel').scrollIntoView({ behavior: 'smooth', block: 'center' });
          showToast(`🎯 Category: ${category} | Event: ${eventVal} ready`, false);
        });
      });
    }

    // populate category & event dropdowns and prefill selected values
    function populateCategoryDropdown(selectedCategory = null, selectedEvent = null) {
      const catSelect = document.getElementById('regCategory');
      const eventSelect = document.getElementById('regEvent');
      if(!catSelect) return;
      let currentCategory = catSelect.value;
      catSelect.innerHTML = '';
      categoryKeys.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        catSelect.appendChild(option);
      });
      // set selected category if provided else keep first
      if(selectedCategory && categoryKeys.includes(selectedCategory)) {
        catSelect.value = selectedCategory;
      } else {
        selectedCategory = catSelect.value;
      }
      // populate events accordingly
      function updateEventsDropdown(category) {
        const events = categoriesMap[category] || [];
        eventSelect.innerHTML = '';
        events.forEach(ev => {
          const opt = document.createElement('option');
          opt.value = ev;
          opt.textContent = ev;
          eventSelect.appendChild(opt);
        });
        if(selectedEvent && events.includes(selectedEvent)) {
          eventSelect.value = selectedEvent;
        } else if(eventSelect.options.length) {
          eventSelect.selectedIndex = 0;
        }
      }
      updateEventsDropdown(selectedCategory);
      catSelect.addEventListener('change', function() {
        const newCat = catSelect.value;
        updateEventsDropdown(newCat);
      });
    }

    function prefetchRegistrationForm(category, eventName) {
      if(!category || !eventName) return;
      const catSelect = document.getElementById('regCategory');
      const eventSelect = document.getElementById('regEvent');
      if(catSelect) {
        catSelect.value = category;
        // trigger change to populate events based on category
        const changeEv = new Event('change');
        catSelect.dispatchEvent(changeEv);
        setTimeout(() => {
          if(eventSelect) {
            for(let i=0; i<eventSelect.options.length; i++) {
              if(eventSelect.options[i].value === eventName) {
                eventSelect.selectedIndex = i;
                break;
              }
            }
          }
        }, 10);
      }
    }

    // register new participant
    function registerStudent() {
      const name = document.getElementById('regName').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const phone = document.getElementById('regPhone').value.trim();
      const category = document.getElementById('regCategory').value;
      const eventSelected = document.getElementById('regEvent').value;
      
      if(!name || !email || !phone) {
        showToast("❌ Please fill name, email & phone", true);
        return;
      }
      if(!email.includes('@') || !email.includes('.')) {
        showToast("❌ Enter valid email address", true);
        return;
      }
      if(phone.length < 8 || isNaN(phone)) {
        showToast("❌ Valid phone number required", true);
        return;
      }
      if(!category || !eventSelected) {
        showToast("❌ Choose category & event", true);
        return;
      }
      // duplicate check (optional but user-friendly warning)
      const existing = registrations.find(r => r.email === email && r.event === eventSelected && r.category === category);
      if(existing) {
        showToast(`⚠️ ${name} already registered for ${eventSelected}`, true);
        return;
      }
      const newReg = {
        id: Date.now() + Math.random(),
        name: name,
        email: email,
        phone: phone,
        category: category,
        event: eventSelected,
        timestamp: new Date().toLocaleString()
      };
      registrations.push(newReg);
      saveRegistrations();
      renderRegistrationTable();
      // clear name/email/phone but keep category/event selected same (for next reg)
      document.getElementById('regName').value = '';
      document.getElementById('regEmail').value = '';
      document.getElementById('regPhone').value = '';
      showToast(`✅ Registered for ${eventSelected} (${category}) successfully!`);
    }

    function renderRegistrationTable() {
      const tbody = document.getElementById('regTbody');
      if(!tbody) return;
      if(registrations.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-msg">No registrations yet. Be the first to register! 🎉</td></tr>`;
        return;
      }
      tbody.innerHTML = '';
      registrations.forEach(reg => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = reg.name;
        row.insertCell(1).textContent = reg.email;
        row.insertCell(2).textContent = reg.event;
        row.insertCell(3).textContent = reg.category;
        const delCell = row.insertCell(4);
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Cancel';
        delBtn.className = 'delete-btn';
        delBtn.addEventListener('click', () => {
          removeRegistration(reg.id);
        });
        delCell.appendChild(delBtn);
      });
    }

    function removeRegistration(id) {
      registrations = registrations.filter(r => r.id !== id);
      saveRegistrations();
      renderRegistrationTable();
      showToast("Registration removed", false);
    }

    // initial setup, plus ensure the dropdowns work on load
    function init() {
      renderEventsGrid();
      loadRegistrationsFromStorage();
      populateCategoryDropdown();
      // attach register button event
      const regBtn = document.getElementById('submitRegistration');
      if(regBtn) regBtn.addEventListener('click', registerStudent);
      // also allow manual submit with enter on fields? just btn click
      // adjust video fallback if error
      const video = document.querySelector('.video-background');
      if(video) {
        video.play().catch(e => console.log("autoplay blocked, but background visible"));
      }
    }

    // dynamic event sync for category dropdown in register panel also after reg we re-populate maybe not needed
    window.addEventListener('DOMContentLoaded', init);
