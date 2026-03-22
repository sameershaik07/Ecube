
    // ---------- EVENT DATA ----------
    const categoriesMap = {
      "Sports & Games": ["Thug of war", "Shuttle", "Cricket", "Carroms", "Chess"],
      "Aavishkar": ["Paper presentation", "Code sprint", "Web design", "Project Expo"],
      "Fun Events": ["Slow Scooty Race", "Eating Competition", "Nail Art", "Mehendi", "Treasure Hunt", "Rangoli"],
      "Annual Day": ["Dance Competition", "Miss Ashoka"],
      "Live Music Concert": ["Dance Competition"]
    };
    const categoryKeys = ["Sports & Games", "Aavishkar", "Fun Events", "Annual Day", "Live Music Concert"];

    let registrations = []; // paid registrations
    let pendingRegistration = null;

    function saveRegistrations() { localStorage.setItem("aavishkar_registrations", JSON.stringify(registrations)); }
    function loadRegistrations() {
      const stored = localStorage.getItem("aavishkar_registrations");
      registrations = stored ? JSON.parse(stored) : [];
      renderRegistrationTable();
    }

    function showToast(msg, isError = false) {
      const toast = document.createElement('div');
      toast.className = 'toast-msg';
      toast.innerText = msg;
      toast.style.background = isError ? '#E15554' : '#FFB347';
      toast.style.color = '#fff';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2800);
    }

    // Payment Validation Functions
    function luhnCheck(cardNum) {
      let sum = 0;
      let alternate = false;
      for (let i = cardNum.length - 1; i >= 0; i--) {
        let n = parseInt(cardNum[i], 10);
        if (alternate) {
          n *= 2;
          if (n > 9) n -= 9;
        }
        sum += n;
        alternate = !alternate;
      }
      return sum % 10 === 0;
    }

    function validateCardNumber(number) {
      const cleaned = number.replace(/\s/g, '');
      if (!/^\d+$/.test(cleaned)) return false;
      if (cleaned.length < 13 || cleaned.length > 19) return false;
      return luhnCheck(cleaned);
    }

    function getCardType(number) {
      const cleaned = number.replace(/\s/g, '');
      if (/^4/.test(cleaned)) return 'visa';
      if (/^5[1-5]/.test(cleaned)) return 'mastercard';
      if (/^3[47]/.test(cleaned)) return 'amex';
      return null;
    }

    function validateExpiry(expiry) {
      if (!/^\d{2}\/\d{2}$/.test(expiry)) return false;
      const [month, year] = expiry.split('/').map(Number);
      if (month < 1 || month > 12) return false;
      const now = new Date();
      const currentYear = now.getFullYear() % 100;
      const currentMonth = now.getMonth() + 1;
      if (year < currentYear) return false;
      if (year === currentYear && month < currentMonth) return false;
      return true;
    }

    function validateCVV(cvv, cardType) {
      if (!/^\d+$/.test(cvv)) return false;
      if (cardType === 'amex') return cvv.length === 4;
      return cvv.length === 3;
    }

    function formatCardNumber(value) {
      const cleaned = value.replace(/\D/g, '');
      const groups = cleaned.match(/.{1,4}/g);
      return groups ? groups.join(' ') : cleaned;
    }

    function formatExpiry(value) {
      const cleaned = value.replace(/\D/g, '');
      if (cleaned.length >= 2) return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
      return cleaned;
    }

    // Update card icons
    function updateCardIcons(cardNumber) {
      const type = getCardType(cardNumber);
      document.getElementById('visaIcon').classList.remove('active');
      document.getElementById('masterIcon').classList.remove('active');
      document.getElementById('amexIcon').classList.remove('active');
      if (type === 'visa') document.getElementById('visaIcon').classList.add('active');
      else if (type === 'mastercard') document.getElementById('masterIcon').classList.add('active');
      else if (type === 'amex') document.getElementById('amexIcon').classList.add('active');
    }

    // Payment modal handlers
    function setupPaymentModal() {
      const cardNumInput = document.getElementById('cardNumber');
      const expiryInput = document.getElementById('cardExpiry');
      const cvvInput = document.getElementById('cardCvv');
      const payBtn = document.getElementById('confirmPaymentBtn');

      cardNumInput.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\s/g, '');
        val = val.replace(/\D/g, '').slice(0, 16);
        e.target.value = formatCardNumber(val);
        updateCardIcons(val);
        const errorDiv = document.getElementById('cardNumError');
        if (val.length > 0 && !validateCardNumber(val)) errorDiv.innerText = 'Invalid card number';
        else errorDiv.innerText = '';
      });

      expiryInput.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '').slice(0, 4);
        e.target.value = formatExpiry(val);
        const errorDiv = document.getElementById('expiryError');
        if (val.length === 4 && !validateExpiry(e.target.value)) errorDiv.innerText = 'Invalid or expired date';
        else errorDiv.innerText = '';
      });

      cvvInput.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '');
        const cardNum = cardNumInput.value.replace(/\s/g, '');
        const cardType = getCardType(cardNum);
        const maxLen = cardType === 'amex' ? 4 : 3;
        val = val.slice(0, maxLen);
        e.target.value = val;
        const errorDiv = document.getElementById('cvvError');
        if (val.length > 0 && !validateCVV(val, cardType)) errorDiv.innerText = `CVV must be ${maxLen} digits`;
        else errorDiv.innerText = '';
      });
    }

    function resetPaymentModal() {
      document.getElementById('cardName').value = '';
      document.getElementById('cardNumber').value = '';
      document.getElementById('cardExpiry').value = '';
      document.getElementById('cardCvv').value = '';
      document.getElementById('cardNumError').innerText = '';
      document.getElementById('expiryError').innerText = '';
      document.getElementById('cvvError').innerText = '';
      updateCardIcons('');
    }

    function validatePaymentForm() {
      const name = document.getElementById('cardName').value.trim();
      const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
      const expiry = document.getElementById('cardExpiry').value;
      const cvv = document.getElementById('cardCvv').value;
      const cardType = getCardType(cardNumber);
      if (!name) { showToast("Please enter cardholder name", true); return false; }
      if (!validateCardNumber(cardNumber)) { showToast("Invalid card number", true); return false; }
      if (!validateExpiry(expiry)) { showToast("Invalid or expired expiry date", true); return false; }
      if (!validateCVV(cvv, cardType)) { showToast(`Invalid CVV (${cardType === 'amex' ? '4 digits' : '3 digits'})`, true); return false; }
      return true;
    }

    // Events Grid
    function renderEventsGrid() {
      const container = document.getElementById('eventsContainer');
      if (!container) return;
      container.innerHTML = '';
      for (let cat of categoryKeys) {
        const events = categoriesMap[cat];
        const card = document.createElement('div'); card.className = 'category-card';
        let icon = '<i class="fas fa-trophy"></i>';
        if (cat === 'Aavishkar') icon = '<i class="fas fa-microchip"></i>';
        else if (cat === 'Fun Events') icon = '<i class="fas fa-mask"></i>';
        else if (cat === 'Annual Day') icon = '<i class="fas fa-star"></i>';
        else if (cat === 'Live Music Concert') icon = '<i class="fas fa-music"></i>';
        card.innerHTML = `<div class="cat-name">${icon} ${cat}</div>
          <div class="event-list">${events.map(ev => `<div class="event-badge" data-category="${cat}" data-event="${ev}"><i class="fas fa-hand-peace"></i> ${ev}</div>`).join('')}</div>
          <div class="register-trigger"><span class="reg-sm-btn" data-category="${cat}" data-event="${events[0]}"><i class="fas fa-pen-alt"></i> Quick register</span></div>`;
        container.appendChild(card);
      }
      document.querySelectorAll('.event-badge').forEach(badge => {
        badge.addEventListener('click', (e) => {
          const category = badge.getAttribute('data-category');
          const eventName = badge.getAttribute('data-event');
          prefetchForm(category, eventName);
          document.getElementById('registerPanel').scrollIntoView({ behavior: 'smooth' });
          showToast(`📌 ${eventName} selected, complete payment to register`);
        });
      });
      document.querySelectorAll('.reg-sm-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const category = btn.getAttribute('data-category');
          let eventVal = btn.getAttribute('data-event') || categoriesMap[category]?.[0];
          if (category && eventVal) prefetchForm(category, eventVal);
          document.getElementById('registerPanel').scrollIntoView({ behavior: 'smooth' });
          showToast(`🎯 Category: ${category} | Event ready for registration`);
        });
      });
    }

    function populateCategoryDropdown(selectedCategory = null, selectedEvent = null) {
      const catSelect = document.getElementById('regCategory');
      const eventSelect = document.getElementById('regEvent');
      if (!catSelect) return;
      catSelect.innerHTML = '';
      categoryKeys.forEach(cat => { let opt = document.createElement('option'); opt.value = cat; opt.textContent = cat; catSelect.appendChild(opt); });
      if (selectedCategory && categoryKeys.includes(selectedCategory)) catSelect.value = selectedCategory;
      else selectedCategory = catSelect.value;
      function updateEvents(category) {
        const events = categoriesMap[category] || [];
        eventSelect.innerHTML = '';
        events.forEach(ev => { let opt = document.createElement('option'); opt.value = ev; opt.textContent = ev; eventSelect.appendChild(opt); });
        if (selectedEvent && events.includes(selectedEvent)) eventSelect.value = selectedEvent;
        else if (eventSelect.options.length) eventSelect.selectedIndex = 0;
      }
      updateEvents(selectedCategory);
      catSelect.addEventListener('change', () => updateEvents(catSelect.value));
    }

    function prefetchForm(category, eventName) {
      const catSelect = document.getElementById('regCategory');
      if (catSelect) { catSelect.value = category; catSelect.dispatchEvent(new Event('change')); }
      setTimeout(() => {
        const eventSelect = document.getElementById('regEvent');
        if (eventSelect) { for (let i = 0; i < eventSelect.options.length; i++) { if (eventSelect.options[i].value === eventName) { eventSelect.selectedIndex = i; break; } } }
      }, 20);
    }

    function handleRegistrationClick() {
      const name = document.getElementById('regName').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const phone = document.getElementById('regPhone').value.trim();
      const category = document.getElementById('regCategory').value;
      const eventSelected = document.getElementById('regEvent').value;
      if (!name || !email || !phone) { showToast("❌ Please fill all fields", true); return; }
      if (!email.includes('@') || !email.includes('.')) { showToast("❌ Valid email required", true); return; }
      if (phone.length < 8 || isNaN(phone)) { showToast("❌ Valid phone number", true); return; }
      if (!category || !eventSelected) { showToast("❌ Select category & event", true); return; }
      const existing = registrations.find(r => r.email === email && r.event === eventSelected && r.category === category);
      if (existing) { showToast(`⚠️ ${name} already registered for ${eventSelected}`, true); return; }
      pendingRegistration = { name, email, phone, category, event: eventSelected };
      document.getElementById('payEventName').innerText = `${eventSelected} (${category})`;
      resetPaymentModal();
      document.getElementById('paymentModal').style.display = 'flex';
    }

    async function completePayment() {
      if (!pendingRegistration) return;
      if (!validatePaymentForm()) return;
      const payBtn = document.getElementById('confirmPaymentBtn');
      const originalText = payBtn.innerHTML;
      payBtn.innerHTML = '<span class="spinner"></span> Processing...';
      payBtn.disabled = true;
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      const newReg = { ...pendingRegistration, id: Date.now() + Math.random(), timestamp: new Date().toLocaleString() };
      registrations.push(newReg);
      saveRegistrations();
      renderRegistrationTable();
      document.getElementById('regName').value = '';
      document.getElementById('regEmail').value = '';
      document.getElementById('regPhone').value = '';
      showToast(`✅ Payment successful! Registered for ${newReg.event}`, false);
      pendingRegistration = null;
      document.getElementById('paymentModal').style.display = 'none';
      payBtn.innerHTML = originalText;
      payBtn.disabled = false;
    }

    function renderRegistrationTable() {
      const tbody = document.getElementById('regTbody');
      if (!tbody) return;
      if (registrations.length === 0) { tbody.innerHTML = `<tr><td colspan="5" class="empty-msg">No paid registrations yet. Register & pay ₹100!</td></tr>`; return; }
      tbody.innerHTML = '';
      registrations.forEach(reg => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = reg.name;
        row.insertCell(1).textContent = reg.email;
        row.insertCell(2).textContent = reg.event;
        row.insertCell(3).textContent = reg.category;
        const delCell = row.insertCell(4);
        const delBtn = document.createElement('button'); delBtn.textContent = 'Cancel'; delBtn.className = 'delete-btn';
        delBtn.onclick = () => { registrations = registrations.filter(r => r.id !== reg.id); saveRegistrations(); renderRegistrationTable(); showToast("Registration cancelled", false); };
        delCell.appendChild(delBtn);
      });
    }

    // Countdown
    function updateCountdown() {
      const target = new Date(2026, 2, 24, 0, 0, 0).getTime();
      const now = new Date().getTime();
      const diff = target - now;
      if (diff <= 0) { document.getElementById('days').innerText = "00"; document.getElementById('hours').innerText = "00"; document.getElementById('minutes').innerText = "00"; document.getElementById('seconds').innerText = "00"; return; }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      document.getElementById('days').innerText = days < 10 ? '0' + days : days;
      document.getElementById('hours').innerText = hours < 10 ? '0' + hours : hours;
      document.getElementById('minutes').innerText = minutes < 10 ? '0' + minutes : minutes;
      document.getElementById('seconds').innerText = seconds < 10 ? '0' + seconds : seconds;
    }

    // Chatbot logic (same as before)
    function getBotReply(msg) {
      const lower = msg.toLowerCase();
      if (lower.includes('date') || lower.includes('when')) return "📅 Aavishkar 2026 runs from 23rd March to 29th March 2026. The inaugural day is 23rd March!";
      if (lower.includes('register') || lower.includes('registration')) return "✅ To register: fill your details, select event, then complete the ₹100 payment via our secure gateway. After payment you'll appear in the list.";
      if (lower.includes('payment') || lower.includes('pay') || lower.includes('fee')) return "💳 Registration fee is ₹100 per event. You'll be redirected to a payment modal after clicking 'Register & Pay'. All major cards accepted (demo mode with validation).";
      if (lower.includes('event') || lower.includes('category')) return "🎯 We have 5 categories: Sports & Games, Aavishkar (tech), Fun Events, Annual Day, Live Music Concert. Click on any event badge to auto-select!";
      if (lower.includes('sports')) return "🏆 Sports events: Thug of war, Shuttle, Cricket, Carroms, Chess. Come show your athletic spirit!";
      if (lower.includes('aavishkar')) return "💡 Aavishkar category: Paper presentation, Code sprint, Web design, Project Expo. Innovate and present!";
      if (lower.includes('fun')) return "🎉 Fun Events: Slow Scooty Race, Eating Competition, Nail Art, Mehendi, Treasure Hunt, Rangoli. Loads of entertainment!";
      if (lower.includes('annual')) return "🌟 Annual Day: Dance Competition & Miss Ashoka. A star-studded night!";
      if (lower.includes('concert')) return "🎤 Live Music Concert features a Dance Competition. Groove to amazing performances!";
      if (lower.includes('refund') || lower.includes('cancel')) return "You can cancel registration from the table. Refunds are handled by the college desk. Contact coordinator.";
      return "🤖 I'm here to help! Ask about dates, registration, payment, event categories (Sports, Aavishkar, Fun, Annual Day, Concert). Try: 'How to register?' or 'List fun events'";
    }

    function setupChat() {
      const toggle = document.getElementById('chatbotToggle');
      const chatWin = document.getElementById('chatWindow');
      const closeChat = document.getElementById('closeChat');
      const sendBtn = document.getElementById('sendChatBtn');
      const chatInput = document.getElementById('chatInput');
      const messagesDiv = document.getElementById('chatMessages');
      toggle.onclick = () => { chatWin.style.display = chatWin.style.display === 'flex' ? 'none' : 'flex'; };
      closeChat.onclick = () => { chatWin.style.display = 'none'; };
      function addMessage(text, isUser) {
        const msgDiv = document.createElement('div');
        msgDiv.className = isUser ? 'user-msg' : 'bot-msg';
        msgDiv.innerHTML = isUser ? `<i class="fas fa-user"></i> ${text}` : `<i class="fas fa-robot"></i> ${text}`;
        messagesDiv.appendChild(msgDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
      }
      sendBtn.onclick = () => {
        const q = chatInput.value.trim();
        if (!q) return;
        addMessage(q, true);
        const reply = getBotReply(q);
        setTimeout(() => addMessage(reply, false), 300);
        chatInput.value = '';
      };
      chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendBtn.click(); });
    }

    function init() {
      renderEventsGrid();
      loadRegistrations();
      populateCategoryDropdown();
      document.getElementById('submitRegistration').addEventListener('click', handleRegistrationClick);
      document.getElementById('confirmPaymentBtn').addEventListener('click', completePayment);
      document.getElementById('closeModalBtn').addEventListener('click', () => { document.getElementById('paymentModal').style.display = 'none'; pendingRegistration = null; });
      window.onclick = (e) => { if (e.target === document.getElementById('paymentModal')) document.getElementById('paymentModal').style.display = 'none'; };
      setInterval(updateCountdown, 1000);
      updateCountdown();
      setupChat();
      setupPaymentModal();
    }
    window.addEventListener('DOMContentLoaded', init);
  