// API Base URL (Relative since frontend is hosted on the same server)
const API_URL = '/stands';

// Application State
let stands = [];
let editingStandId = null;
let gamesList = [];
let contestsList = [];
let offersList = [];

// DOM Elements
const standForm = document.getElementById('stand-form');
const standIdInput = document.getElementById('stand-id');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const charCountSpan = document.getElementById('char-count');
const abstractTextarea = document.getElementById('abstract');

// Tags elements
const gameInput = document.getElementById('game-input');
const addGameBtn = document.getElementById('add-game-btn');
const gamesTagsContainer = document.getElementById('games-tags');

const contestInput = document.getElementById('contest-input');
const addContestBtn = document.getElementById('add-contest-btn');
const contestsTagsContainer = document.getElementById('contests-tags');

const offerInput = document.getElementById('offer-input');
const addOfferBtn = document.getElementById('add-offer-btn');
const offersTagsContainer = document.getElementById('offers-tags');

// Accordion elements
const socialAccordionBtn = document.getElementById('social-accordion-btn');
const socialAccordionContent = document.getElementById('social-accordion-content');

// Dashboard elements
const standsGrid = document.getElementById('stands-grid');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');
const standsCountSpan = document.getElementById('stands-count');
const toastContainer = document.getElementById('toast-container');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    fetchStands();
    setupEventListeners();
});

// Event Listeners Setup
function setupEventListeners() {
    // Accordion Toggle
    socialAccordionBtn.addEventListener('click', toggleSocialAccordion);

    // Form input character counter
    abstractTextarea.addEventListener('input', () => {
        charCountSpan.textContent = abstractTextarea.value.length;
    });

    // Dynamic Lists (Add item triggers)
    addGameBtn.addEventListener('click', () => addTagItem('game'));
    gameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); addTagItem('game'); }
    });

    addContestBtn.addEventListener('click', () => addTagItem('contest'));
    contestInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); addTagItem('contest'); }
    });

    addOfferBtn.addEventListener('click', () => addTagItem('offer'));
    offerInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); addTagItem('offer'); }
    });

    // Form Submit & Cancel
    standForm.addEventListener('submit', handleFormSubmit);
    cancelEditBtn.addEventListener('click', exitEditMode);

    // Search Operations
    let searchDebounceTimer;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchDebounceTimer);
        // Show/hide clear search button
        if (searchInput.value.trim() !== '') {
            clearSearchBtn.classList.remove('hidden');
        } else {
            clearSearchBtn.classList.add('hidden');
        }
        
        searchDebounceTimer = setTimeout(() => {
            fetchStands(searchInput.value.trim());
        }, 300);
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearSearchBtn.classList.add('hidden');
        fetchStands();
    });
}

// Accordion Logic
function toggleSocialAccordion() {
    const parent = socialAccordionBtn.parentElement;
    parent.classList.toggle('active');
}

// Dynamic Tag Adding
function addTagItem(type) {
    let inputEl, listArr, containerEl;

    if (type === 'game') {
        inputEl = gameInput;
        listArr = gamesList;
        containerEl = gamesTagsContainer;
    } else if (type === 'contest') {
        inputEl = contestInput;
        listArr = contestsList;
        containerEl = contestsTagsContainer;
    } else if (type === 'offer') {
        inputEl = offerInput;
        listArr = offersList;
        containerEl = offersTagsContainer;
    }

    const value = inputEl.value.trim();
    if (!value) return;

    if (listArr.includes(value)) {
        showToast('error', 'Duplicate Item', `"${value}" is already in the list.`);
        return;
    }

    listArr.push(value);
    inputEl.value = '';
    renderTags(type, listArr, containerEl);
}

// Remove Tag Item
function removeTagItem(type, index) {
    let listArr, containerEl;

    if (type === 'game') {
        listArr = gamesList;
        containerEl = gamesTagsContainer;
    } else if (type === 'contest') {
        listArr = contestsList;
        containerEl = contestsTagsContainer;
    } else if (type === 'offer') {
        listArr = offersList;
        containerEl = offersTagsContainer;
    }

    listArr.splice(index, 1);
    renderTags(type, listArr, containerEl);
}

// Render Tags to UI
function renderTags(type, list, container) {
    container.innerHTML = '';
    list.forEach((item, index) => {
        const tagEl = document.createElement('span');
        tagEl.className = 'tag';
        tagEl.innerHTML = `
            <span>${item}</span>
            <span class="tag-remove" data-index="${index}"><i class="fa-solid fa-xmark"></i></span>
        `;
        tagEl.querySelector('.tag-remove').addEventListener('click', () => {
            removeTagItem(type, index);
        });
        container.appendChild(tagEl);
    });
}

// Fetch Stands from API
async function fetchStands(searchQuery = '') {
    showGridLoading();
    try {
        let url = API_URL;
        if (searchQuery) {
            url += `?search=${encodeURIComponent(searchQuery)}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        stands = await response.json();
        renderStands();
    } catch (error) {
        console.error('Error fetching stands:', error);
        showGridError('Could not load stands. Make sure MongoDB and the API service are running.');
        showToast('error', 'Connection Error', 'Failed to retrieve stands from the database.');
    }
}

// Render Grid of Cards
function renderStands() {
    standsGrid.innerHTML = '';
    standsCountSpan.textContent = `${stands.length} registered`;

    if (stands.length === 0) {
        standsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-store-slash"></i>
                <h3>No Stands Found</h3>
                <p>Register a new conference stand to display it on the registry board.</p>
            </div>
        `;
        return;
    }

    stands.forEach(stand => {
        const card = document.createElement('article');
        card.className = 'stand-card';
        
        // Format date
        const dateFormatted = new Date(stand.created_at).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        // Electrical connection label
        const powerBadge = stand.electrical_req 
            ? `<span class="card-power-badge"><i class="fa-solid fa-bolt"></i> Power Outlet Required</span>` 
            : '';

        // Stand location badge
        const standBadge = stand.stand_number 
            ? `<span class="card-stand-number">${stand.stand_number}</span>` 
            : `<span class="card-stand-number card-no-stand">No Location</span>`;

        // Games section
        let gamesSection = '';
        if (stand.games && stand.games.length > 0) {
            const badges = stand.games.map(g => `<span class="badge badge-game"><i class="fa-solid fa-gamepad"></i> ${g}</span>`).join('');
            gamesSection = `
                <div>
                    <span class="card-section-title">Games & Entertainment</span>
                    <div class="card-list-badges">${badges}</div>
                </div>
            `;
        }

        // Contests section
        let contestsSection = '';
        if (stand.contests && stand.contests.length > 0) {
            const badges = stand.contests.map(c => `<span class="badge badge-contest"><i class="fa-solid fa-trophy"></i> ${c}</span>`).join('');
            contestsSection = `
                <div>
                    <span class="card-section-title">Contests & Tournaments</span>
                    <div class="card-list-badges">${badges}</div>
                </div>
            `;
        }

        // Giveaways / Offers section
        let offersSection = '';
        if (stand.special_offers && stand.special_offers.length > 0) {
            const badges = stand.special_offers.map(o => `<span class="badge badge-offer"><i class="fa-solid fa-gift"></i> ${o}</span>`).join('');
            offersSection = `
                <div>
                    <span class="card-section-title">Prizes & Offers</span>
                    <div class="card-list-badges">${badges}</div>
                </div>
            `;
        }

        // Social Media icons
        let socialLinks = '';
        const sm = stand.social_media || {};
        if (sm.linkedin) socialLinks += `<a href="${sm.linkedin}" target="_blank" title="LinkedIn"><i class="fa-brands fa-linkedin text-linkedin"></i></a>`;
        if (sm.instagram) socialLinks += `<a href="${sm.instagram}" target="_blank" title="Instagram"><i class="fa-brands fa-instagram text-instagram"></i></a>`;
        if (sm.twitter) socialLinks += `<a href="${sm.twitter}" target="_blank" title="Twitter/X"><i class="fa-brands fa-x-twitter text-twitter"></i></a>`;
        if (sm.facebook) socialLinks += `<a href="${sm.facebook}" target="_blank" title="Facebook"><i class="fa-brands fa-facebook text-facebook"></i></a>`;
        if (sm.website) socialLinks += `<a href="${sm.website}" target="_blank" title="Website"><i class="fa-solid fa-globe text-website"></i></a>`;

        card.innerHTML = `
            <div class="card-header-gradient"></div>
            <div class="card-header-content">
                <div class="card-company-info">
                    <h3>${escapeHtml(stand.company_name)}</h3>
                    <div class="card-meta">
                        <span><i class="fa-solid fa-envelope"></i> <a href="mailto:${stand.contact_email}">${escapeHtml(stand.contact_email)}</a></span>
                        ${stand.contact_phone ? `<span><i class="fa-solid fa-phone"></i> ${escapeHtml(stand.contact_phone)}</span>` : ''}
                        <span><i class="fa-solid fa-calendar-days"></i> ${dateFormatted}</span>
                    </div>
                </div>
                ${standBadge}
            </div>
            
            <div class="card-body">
                <p class="card-abstract">${escapeHtml(stand.abstract)}</p>
                ${gamesSection}
                ${contestsSection}
                ${offersSection}
            </div>
            
            <div class="card-footer">
                <div class="card-socials">
                    ${socialLinks || '<span style="font-size:0.75rem; color:#64748B;">No social profiles</span>'}
                </div>
                
                <div style="display:flex; align-items:center; gap:0.75rem;">
                    ${powerBadge}
                    <div class="card-actions">
                        <button class="btn-card-edit" onclick="enterEditMode('${stand.id}')" title="Edit Registration"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-card-delete" onclick="deleteStand('${stand.id}', '${escapeJsString(stand.company_name)}')" title="Delete Registration"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            </div>
        `;
        standsGrid.appendChild(card);
    });
}

// UI State Helpers
function showGridLoading() {
    standsGrid.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading registered stands...</p>
        </div>
    `;
}

function showGridError(message) {
    standsGrid.innerHTML = `
        <div class="loading-state" style="border-color: var(--accent-rose);">
            <i class="fa-solid fa-circle-exclamation" style="font-size: 2.5rem; color: var(--accent-rose);"></i>
            <p style="color: #FDA4AF;">Error: ${message}</p>
            <button class="btn-secondary" onclick="fetchStands()" style="margin-top: 0.5rem;"><i class="fa-solid fa-rotate"></i> Retry Connection</button>
        </div>
    `;
}

// Handle Form Submission
async function handleFormSubmit(e) {
    e.preventDefault();

    const payload = {
        company_name: document.getElementById('company_name').value.trim(),
        contact_email: document.getElementById('contact_email').value.trim(),
        contact_phone: document.getElementById('contact_phone').value.trim() || null,
        stand_number: document.getElementById('stand_number').value.trim() || null,
        abstract: document.getElementById('abstract').value.trim(),
        games: gamesList,
        contests: contestsList,
        special_offers: offersList,
        social_media: {
            linkedin: document.getElementById('social_linkedin').value.trim() || null,
            instagram: document.getElementById('social_instagram').value.trim() || null,
            twitter: document.getElementById('social_twitter').value.trim() || null,
            facebook: document.getElementById('social_facebook').value.trim() || null,
            website: document.getElementById('social_website').value.trim() || null
        },
        electrical_req: document.getElementById('electrical_req').checked
    };

    try {
        let response;
        if (editingStandId) {
            // Edit / Update mode
            response = await fetch(`${API_URL}/${editingStandId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } else {
            // Registration mode
            response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }

        const data = await response.json();
        
        if (!response.ok) {
            if (data.detail && Array.isArray(data.detail)) {
                // validation error
                const messages = data.detail.map(d => `${d.loc.join('.')}: ${d.msg}`).join('<br>');
                throw new Error(messages);
            }
            throw new Error(data.detail || 'An error occurred during submission.');
        }

        showToast(
            'success',
            editingStandId ? 'Stand Updated' : 'Stand Registered',
            `Successfully saved registration for "${payload.company_name}".`
        );

        standForm.reset();
        exitEditMode();
        fetchStands();
        
    } catch (error) {
        console.error('Submission error:', error);
        showToast('error', 'Submission Failed', error.message || 'Check connection to backend server.');
    }
}

// Edit Mode management
function enterEditMode(id) {
    const stand = stands.find(s => s.id === id);
    if (!stand) return;

    editingStandId = id;
    standIdInput.value = id;
    
    // Change Form Visual Mode
    formTitle.innerHTML = `<i class="fa-solid fa-edit"></i> Edit Stand Registration`;
    submitBtn.innerHTML = `Update Stand <i class="fa-solid fa-save"></i>`;
    cancelEditBtn.classList.remove('hidden');
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });

    // Populate standard values
    document.getElementById('company_name').value = stand.company_name;
    document.getElementById('stand_number').value = stand.stand_number || '';
    document.getElementById('contact_email').value = stand.contact_email;
    document.getElementById('contact_phone').value = stand.contact_phone || '';
    document.getElementById('abstract').value = stand.abstract;
    charCountSpan.textContent = stand.abstract.length;
    
    // Populate checkboxes
    document.getElementById('electrical_req').checked = stand.electrical_req;

    // Populate lists
    gamesList = [...(stand.games || [])];
    renderTags('game', gamesList, gamesTagsContainer);

    contestsList = [...(stand.contests || [])];
    renderTags('contest', contestsList, contestsTagsContainer);

    offersList = [...(stand.special_offers || [])];
    renderTags('offer', offersList, offersTagsContainer);

    // Populate social media
    const sm = stand.social_media || {};
    document.getElementById('social_linkedin').value = sm.linkedin || '';
    document.getElementById('social_instagram').value = sm.instagram || '';
    document.getElementById('social_twitter').value = sm.twitter || '';
    document.getElementById('social_facebook').value = sm.facebook || '';
    document.getElementById('social_website').value = sm.website || '';

    // Expand accordion if closed
    const socialAccordion = socialAccordionBtn.parentElement;
    if (!socialAccordion.classList.contains('active')) {
        socialAccordion.classList.add('active');
    }
}

function exitEditMode() {
    editingStandId = null;
    standIdInput.value = '';
    
    formTitle.innerHTML = `<i class="fa-solid fa-plus-circle"></i> Register Stand`;
    submitBtn.innerHTML = `Register Stand <i class="fa-solid fa-paper-plane"></i>`;
    cancelEditBtn.classList.add('hidden');

    standForm.reset();
    charCountSpan.textContent = '0';
    
    gamesList = [];
    gamesTagsContainer.innerHTML = '';
    
    contestsList = [];
    contestsTagsContainer.innerHTML = '';
    
    offersList = [];
    offersTagsContainer.innerHTML = '';

    // Close accordion
    const socialAccordion = socialAccordionBtn.parentElement;
    socialAccordion.classList.remove('active');
}

// Delete Stand Action
async function deleteStand(id, companyName) {
    if (!confirm(`Are you sure you want to unregister and delete the stand for "${companyName}"?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`Failed to delete (HTTP ${response.status})`);
        }

        showToast('success', 'Stand Removed', `Successfully deleted "${companyName}" registration.`);
        
        // If we are currently editing the deleted stand, exit edit mode
        if (editingStandId === id) {
            exitEditMode();
        }
        
        fetchStands();
    } catch (error) {
        console.error('Deletion error:', error);
        showToast('error', 'Deletion Failed', 'Failed to remove stand from the database.');
    }
}

// Toast Notifications System
function showToast(type, title, message) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = type === 'success' 
        ? '<i class="fa-solid fa-circle-check"></i>' 
        : '<i class="fa-solid fa-circle-xmark"></i>';

    toast.innerHTML = `
        ${icon}
        <div class="toast-content">
            <div class="toast-title">${escapeHtml(title)}</div>
            <div class="toast-message">${escapeHtml(message)}</div>
        </div>
        <button class="toast-close" title="Close"><i class="fa-solid fa-xmark"></i></button>
    `;

    // Hook close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    });

    toastContainer.appendChild(toast);

    // Auto-remove after 4.5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }
    }, 4500);
}

// Utility Escaping Functions
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeJsString(str) {
    if (!str) return '';
    return str.replace(/'/g, "\\'").replace(/"/g, '\\"');
}
