document.addEventListener('DOMContentLoaded', async () => {
    // 1. Инициализация данных (загружаем JSON из файла)
    let database = [];
    try {
        const response = await fetch('data.json');
        database = await response.json();
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        // Можно добавить вывод ошибки на страницу, если данных нет
    }

    // НОВАЯ ФУНКЦИЯ: Отправка обновленных данных на сервер
    async function saveDatabaseToServer(data) {
        try {
            const response = await fetch('/save-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Ошибка сервера');
            console.log('✅ Данные успешно сохранены в файл data.json!');
        } catch (error) {
            console.error('Ошибка при сохранении на сервер:', error);
            alert('Не удалось сохранить данные на сервер. Убедитесь, что вы запустили файл server.js через Node.js');
        }
    }

    // 2. Состояние
    let state = {
        role: 'teacher',
        direction: 'all',
        search: ''
    };

    // 3. DOM элементы
    const container = document.getElementById('cards-container');
    const roleBtns = document.querySelectorAll('.role-btn');
    const dirBtns = document.querySelectorAll('.dir-btn');
    const searchInput = document.getElementById('search-input');

    // 4. Иконки
    const icons = {
        frontend: `<svg style="color: var(--color-frontend)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>`,
        uxui: `<svg style="color: var(--color-uxui)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>`,
        android: `<svg style="color: var(--color-android)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>`
    };

    // 5. Отрисовка
    function render() {
        // Фильтруем массив
        const filtered = database.filter(person => {
            const matchRole = person.role === state.role;
            const matchDir = state.direction === 'all' || person.direction === state.direction;
            const matchSearch = person.name.toLowerCase().includes(state.search.toLowerCase()) || 
                                person.skills.some(skill => skill.toLowerCase().includes(state.search.toLowerCase()));
            return matchRole && matchDir && matchSearch;
        });

        container.innerHTML = '';

        // Если результатов нет
        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                    <h3>Ничего не найдено</h3>
                    <p>Попробуйте изменить параметры фильтрации или поиска.</p>
                </div>
            `;
            return;
        }

        // Генерируем карточки
        filtered.forEach(person => {
            const icon = icons[person.direction];
            
            const statusHtml = state.role === 'teacher' 
                ? `<span class="badge teacher">Опыт: ${person.experience}</span>`
                : `<span class="badge student">${person.status}</span>`;
            
            const skillsHtml = person.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('');

            const card = document.createElement('div');
            card.className = "card";
            card.innerHTML = `
                <div class="card-body">
                    <div class="card-header">
                        <img src="${person.avatar}" alt="${person.name}" class="card-avatar" />
                        <div class="card-header-right">
                            <div class="card-actions">
                                <button class="action-btn edit-btn" data-id="${person.id}" title="Редактировать">✎</button>
                                <button class="action-btn delete-btn" data-id="${person.id}" title="Удалить">✕</button>
                            </div>
                            <div class="card-icon-wrap" title="${person.directionLabel}">
                                ${icon}
                            </div>
                        </div>
                    </div>
                    <h3 class="card-name">${person.name}</h3>
                    <div class="card-status">${statusHtml}</div>
                    <div class="card-dir">Направление: <span>${person.directionLabel}</span></div>
                    
                    <div class="skills-title">Навыки / Стек</div>
                    <div class="skills-list">${skillsHtml}</div>
                </div>
            `;
            container.appendChild(card);
        });
    }

    // 6. Обработка кликов
    roleBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            state.role = e.currentTarget.dataset.role;
            roleBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            render();
        });
    });

    dirBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            state.direction = e.currentTarget.dataset.dir;
            dirBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            render();
        });
    });

    searchInput.addEventListener('input', (e) => {
        state.search = e.target.value;
        render();
    });

    // --- 7. CRUD ЛОГИКА ---
    const modal = document.getElementById('modal');
    const crudForm = document.getElementById('crud-form');
    const btnAdd = document.getElementById('add-btn');
    const btnClose = document.getElementById('close-modal');
    const btnCancel = document.getElementById('cancel-modal');
    const modalTitle = document.getElementById('modal-title');

    // Элементы модалки удаления
    const deleteModal = document.getElementById('delete-modal');
    const btnCancelDelete = document.getElementById('cancel-delete');
    const btnConfirmDelete = document.getElementById('confirm-delete');
    let itemToDeleteId = null;

    // Открытие модалки
    function openModal(editId = null) {
        modal.classList.add('active');
        if (editId) {
            modalTitle.textContent = 'Редактировать карточку';
            const person = database.find(p => p.id == editId);
            if(person) {
                document.getElementById('entry-id').value = person.id;
                document.getElementById('entry-name').value = person.name;
                document.getElementById('entry-role').value = person.role;
                document.getElementById('entry-direction').value = person.direction;
                document.getElementById('entry-experience').value = person.role === 'teacher' ? person.experience : person.status;
                document.getElementById('entry-skills').value = person.skills.join(', ');
            }
        } else {
            modalTitle.textContent = 'Добавить карточку';
            crudForm.reset();
            document.getElementById('entry-id').value = '';
            document.getElementById('entry-role').value = state.role; // по умолчанию ставим активную вкладку
        }
    }

    // Закрытие модалки
    function closeModal() {
        modal.classList.remove('active');
        crudForm.reset();
    }

    btnAdd.addEventListener('click', () => openModal());
    btnClose.addEventListener('click', closeModal);
    btnCancel.addEventListener('click', closeModal);

    // Делегирование событий для кнопок "Редактировать" и "Удалить"
    container.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-btn');
        const deleteBtn = e.target.closest('.delete-btn');
        
        if (editBtn) {
            openModal(editBtn.dataset.id);
        }
        
        if (deleteBtn) {
            itemToDeleteId = deleteBtn.dataset.id;
            deleteModal.classList.add('active');
        }
    });

    // Обработчики модалки удаления
    btnCancelDelete.addEventListener('click', () => {
        deleteModal.classList.remove('active');
        itemToDeleteId = null;
    });

    btnConfirmDelete.addEventListener('click', () => {
        if (itemToDeleteId) {
            database = database.filter(p => p.id != itemToDeleteId);
            render();
            deleteModal.classList.remove('active');
            itemToDeleteId = null;

            // ВАЖНО: Отправляем новые данные на сервер после удаления
            saveDatabaseToServer(database);
        }
    });

    // Сохранение (Создание или Обновление)
    crudForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const id = document.getElementById('entry-id').value;
        const name = document.getElementById('entry-name').value;
        const role = document.getElementById('entry-role').value;
        const direction = document.getElementById('entry-direction').value;
        const experience = document.getElementById('entry-experience').value;
        const skillsRaw = document.getElementById('entry-skills').value;
        
        // Преобразуем строку навыков в массив
        const skills = skillsRaw.split(',').map(s => s.trim()).filter(s => s !== '');
        const directionLabels = {
            'frontend': 'Фронтенд',
            'uxui': 'UX/UI Дизайн',
            'android': 'Android Разработка'
        };

        const newPerson = {
            id: id ? parseInt(id) : Date.now(), // Уникальный ID из текущего времени
            name,
            role,
            direction,
            directionLabel: directionLabels[direction],
            skills,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4`
        };

        // В зависимости от роли записываем опыт или статус
        if (role === 'teacher') {
            newPerson.experience = experience;
        } else {
            newPerson.status = experience;
        }

        if (id) {
            // Обновление существующей карточки
            const index = database.findIndex(p => p.id == id);
            if(index !== -1) {
                newPerson.avatar = database[index].avatar; // Сохраняем старую аватарку
                database[index] = newPerson;
            }
        } else {
            // Создание новой карточки (добавляем в начало списка)
            database.unshift(newPerson);
        }

        closeModal();
        render(); // Перерисовываем интерфейс

        // ВАЖНО: Отправляем новые данные на сервер после добавления или изменения
        saveDatabaseToServer(database);
    });

    // Первоначальный рендер
    render();
});