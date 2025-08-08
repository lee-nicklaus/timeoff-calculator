document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const entryForm = document.getElementById('entry-form');
    const typeInput = document.getElementById('type');
    const dateInput = document.getElementById('date');
    const durationInput = document.getElementById('duration');
    const entryList = document.getElementById('entry-list');
    const totalHoursSpan = document.getElementById('total-hours');
    const totalDaysSpan = document.getElementById('total-days');
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const importFileInput = document.getElementById('import-file');

    // --- State ---
    let entries = JSON.parse(localStorage.getItem('overtime_entries')) || [];

    // --- Core Functions ---

    function saveEntries() {
        localStorage.setItem('overtime_entries', JSON.stringify(entries));
    }

    function updateSummary() {
        const totalOvertime = entries
            .filter(entry => entry.type === 'overtime')
            .reduce((sum, entry) => sum + Number(entry.duration), 0);

        const totalOffInLieu = entries
            .filter(entry => entry.type === 'off-in-lieu')
            .reduce((sum, entry) => sum + Number(entry.duration), 0);

        const netHours = totalOvertime - totalOffInLieu;
        const netDays = netHours / 8;

        totalHoursSpan.textContent = netHours.toFixed(1); // Display with 1 decimal place
        totalDaysSpan.textContent = netDays.toFixed(2);
    }

    function renderEntries() {
        entryList.innerHTML = '';

        if (entries.length === 0) {
            entryList.innerHTML = '<li class="no-entries">暂无记录</li>';
            return;
        }

        entries.forEach(entry => {
            const li = document.createElement('li');
            li.dataset.id = entry.id;
            li.className = entry.type;

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

    function addEntry(e) {
        e.preventDefault();
        const newEntry = {
            id: Date.now(),
            type: typeInput.value,
            date: dateInput.value,
            duration: durationInput.value,
        };
        entries.push(newEntry);
        entries.sort((a, b) => new Date(b.date) - new Date(a.date));
        saveEntries();
        renderEntries();
        updateSummary();
        entryForm.reset();
        dateInput.valueAsDate = new Date();
    }

    function handleListClick(e) {
        const li = e.target.closest('li');
        if (!li) return;
        const entryId = Number(li.dataset.id);

        if (e.target.classList.contains('delete-btn')) {
            if (confirm('确定要删除这条记录吗？')) {
                entries = entries.filter(entry => entry.id !== entryId);
                saveEntries();
                renderEntries();
                updateSummary();
            }
        } else if (e.target.classList.contains('edit-btn')) {
            editEntry(li, entryId);
        } else if (e.target.classList.contains('save-btn')) {
            saveEditedEntry(li, entryId);
        }
    }

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
                <input type="number" class="edit-duration" value="${entry.duration}" min="1" step="0.5">
            </div>
            <div class="entry-actions">
                <button class="save-btn">保存</button>
            </div>
        `;
    }

    function saveEditedEntry(li, entryId) {
        const entryIndex = entries.findIndex(e => e.id === entryId);
        if (entryIndex === -1) return;

        entries[entryIndex] = {
            id: entryId,
            type: li.querySelector('.edit-type').value,
            date: li.querySelector('.edit-date').value,
            duration: li.querySelector('.edit-duration').value,
        };

        entries.sort((a, b) => new Date(b.date) - new Date(a.date));
        saveEntries();
        renderEntries();
        updateSummary();
    }

    // --- Data Management Functions ---
    function exportData() {
        if (entries.length === 0) {
            alert('没有数据可以导出。');
            return;
        }
        const dataStr = JSON.stringify(entries, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `overtime-data-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function importData(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedEntries = JSON.parse(event.target.result);
                if (!Array.isArray(importedEntries) || !importedEntries.every(item => 'id' in item && 'type' in item && 'date' in item && 'duration' in item)) {
                    throw new Error('Invalid data format.');
                }
                if (confirm('导入数据将覆盖现有记录，确定吗？')) {
                    entries = importedEntries;
                    entries.sort((a, b) => new Date(b.date) - new Date(a.date));
                    saveEntries();
                    renderEntries();
                    updateSummary();
                    alert('数据导入成功！');
                }
            } catch (error) {
                alert('导入失败，请确保文件格式正确。');
                console.error(error);
            } finally {
                importFileInput.value = '';
            }
        };
        reader.readAsText(file);
    }

    // --- Event Listeners ---
    entryForm.addEventListener('submit', addEntry);
    entryList.addEventListener('click', handleListClick);
    exportBtn.addEventListener('click', exportData);
    importBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', importData);

    // --- Initial Load ---
    function initialize() {
        dateInput.valueAsDate = new Date();
        renderEntries();
        updateSummary();
    }

    initialize();
});
