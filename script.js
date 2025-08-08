document.addEventListener('DOMContentLoaded', () => {
    const entryForm = document.getElementById('entry-form');
    const typeInput = document.getElementById('type');
    const dateInput = document.getElementById('date');
    const durationInput = document.getElementById('duration');
    const entryList = document.getElementById('entry-list');
    const totalHoursSpan = document.getElementById('total-hours');
    const totalDaysSpan = document.getElementById('total-days');

    // Load entries from localStorage or initialize an empty array
    let entries = JSON.parse(localStorage.getItem('overtime_entries')) || [];

    // --- Core Functions ---

    /**
     * Saves the current entries array to localStorage.
     */
    function saveEntries() {
        localStorage.setItem('overtime_entries', JSON.stringify(entries));
    }

    /**
     * Calculates and updates the summary display.
     */
    function updateSummary() {
        const totalOvertime = entries
            .filter(entry => entry.type === 'overtime')
            .reduce((sum, entry) => sum + parseFloat(entry.duration), 0);

        const totalOffInLieu = entries
            .filter(entry => entry.type === 'off-in-lieu')
            .reduce((sum, entry) => sum + parseFloat(entry.duration), 0);

        const netHours = totalOvertime - totalOffInLieu;
        const netDays = netHours / 8;

        totalHoursSpan.textContent = netHours.toFixed(2);
        totalDaysSpan.textContent = netDays.toFixed(2);
    }

    /**
     * Renders all entries to the list in the DOM.
     */
    function renderEntries() {
        entryList.innerHTML = ''; // Clear the list first

        if (entries.length === 0) {
            entryList.innerHTML = '<li class="no-entries">暂无记录</li>';
            return;
        }

        entries.forEach(entry => {
            const li = document.createElement('li');
            li.dataset.id = entry.id;
            li.className = entry.type; // for styling overtime vs off-in-lieu

            li.innerHTML = `
                <div class="entry-details">
                    <span class="entry-type">${entry.type === 'overtime' ? '加班' : '调休'}</span>
                    <span class="entry-date">${entry.date}</span>
                    <span class="entry-duration">${parseFloat(entry.duration).toFixed(1)} 小时</span>
                </div>
                <div class="entry-actions">
                    <button class="edit-btn">编辑</button>
                    <button class="delete-btn">删除</button>
                </div>
            `;
            entryList.appendChild(li);
        });
    }

    /**
     * Handles adding a new entry.
     */
    function addEntry(e) {
        e.preventDefault();

        const type = typeInput.value;
        const date = dateInput.value;
        const duration = durationInput.value;

        if (!date || !duration) {
            alert('请填写所有字段');
            return;
        }

        const newEntry = {
            id: Date.now(), // Simple unique ID
            type,
            date,
            duration,
        };

        entries.push(newEntry);

        // Sort entries by date, most recent first
        entries.sort((a, b) => new Date(b.date) - new Date(a.date));

        saveEntries();
        renderEntries();
        updateSummary();

        entryForm.reset();
        // Set a default date for the next entry
        dateInput.valueAsDate = new Date();
    }

    /**
     * Handles clicks on the entry list for edit/delete actions.
     */
    function handleListClick(e) {
        const target = e.target;
        const li = target.closest('li');
        if (!li) return;

        const entryId = Number(li.dataset.id);

        if (target.classList.contains('delete-btn')) {
            if (confirm('确定要删除这条记录吗？')) {
                entries = entries.filter(entry => entry.id !== entryId);
                saveEntries();
                renderEntries();
                updateSummary();
            }
        } else if (target.classList.contains('edit-btn')) {
            editEntry(li, entryId);
        } else if (target.classList.contains('save-btn')) {
            saveEditedEntry(li, entryId);
        }
    }

    /**
     * Switches a list item to an editable state.
     */
    function editEntry(li, entryId) {
        const entry = entries.find(e => e.id === entryId);
        if (!entry) return;

        li.innerHTML = `
            <div class="entry-details editable">
                <select class="edit-type">
                    <option value="overtime" ${entry.type === 'overtime' ? 'selected' : ''}>加班</option>
                    <option value="off-in-lieu" ${entry.type === 'off-in-lieu' ? 'selected' : ''}>调休</option>
                </select>
                <input type="date" class="edit-date" value="${entry.date}">
                <input type="number" class="edit-duration" value="${entry.duration}" min="0.5" step="0.5">
            </div>
            <div class="entry-actions">
                <button class="save-btn">保存</button>
            </div>
        `;
    }

    /**
     * Saves the changes from the editable state.
     */
    function saveEditedEntry(li, entryId) {
        const entryIndex = entries.findIndex(e => e.id === entryId);
        if (entryIndex === -1) return;

        const newType = li.querySelector('.edit-type').value;
        const newDate = li.querySelector('.edit-date').value;
        const newDuration = li.querySelector('.edit-duration').value;

        if (!newDate || !newDuration) {
            alert('日期和时长不能为空');
            return;
        }

        entries[entryIndex] = {
            id: entryId,
            type: newType,
            date: newDate,
            duration: newDuration,
        };

        // Re-sort entries by date
        entries.sort((a, b) => new Date(b.date) - new Date(a.date));

        saveEntries();
        renderEntries();
        updateSummary();
    }

    // --- Event Listeners ---
    entryForm.addEventListener('submit', addEntry);
    entryList.addEventListener('click', handleListClick);

    // --- Initial Load ---
    function initialize() {
        // Set default date to today for new entries
        dateInput.valueAsDate = new Date();
        renderEntries();
        updateSummary();
    }

    initialize();
});
