
function formatDuration(seconds) {
    if (!seconds || seconds < 1) return "0m";
    const h = Math.floor(seconds / 3600);  
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ELEMENTY
const modal = document.getElementById('create-routine-screen');
const actionSheet = document.getElementById('action-sheet');
const workoutList = document.getElementById('workout-list');
const titleInput = document.getElementById('routine-title-input');
const exList = document.getElementById('added-exercises-list');
const saveBtn = document.getElementById('save-routine-btn');
const emptyState = document.getElementById('empty-state-placeholder');

let currentWorkoutId = null;
let isEditing = false;

// --- ŁADOWANIE ---
window.onload = loadWorkouts;

function loadWorkouts() {
workoutList.innerHTML = "";
const saved = JSON.parse(localStorage.getItem('myWorkouts')) || [];
saved.forEach((w, index) => renderCard(w, index));
}

document.getElementById('open-modal-btn').onclick = () => {
    isEditing = false;
    currentWorkoutId = null;
    resetForm(); 

    modal.style.display = 'flex';
    document.querySelector('.modal-title').innerText = "Create Routine";

    // TERAZ TO ZADZIAŁA:
    saveBtn.innerText = "Save";
    saveBtn.onclick = handleSaveWorkout; 
};

document.getElementById('cancel-btn').onclick = () => {
modal.style.display = 'none';
resetForm();
};

// --- DODAWANIE ĆWICZENIA ---
document.getElementById('add-ex-trigger').onclick = () => {
addExerciseInput("");
};
function addExercise() {
    const container = document.getElementById('exercises-container');
    const exDiv = document.createElement('div');
    
    // TA LINIA MUSI BYĆ!
    exDiv.classList.add('exercise-card'); 

    exDiv.innerHTML = `
        <div class="exercise-header">
            <input type="text" class="exercise-name" placeholder="Nazwa ćwiczenia">
        </div>
        <div class="sets-container"></div>
        <button type="button" onclick="addSet(this)">+ Add Set</button>
    `;
    container.appendChild(exDiv);
}

function addSet(btn) {
    const setsContainer = btn.previousElementSibling;
    const setRow = document.createElement('div');
    
    // TA LINIA MUSI BYĆ!
    setRow.classList.add('set-row'); 

    setRow.innerHTML = `
        <input type="number" class="weight-input" placeholder="kg">
        <input type="number" class="reps-input" placeholder="reps">
    `;
    setsContainer.appendChild(setRow);
}

function addExerciseInput(val) {
emptyState.style.display = 'none';
const div = document.createElement('div');
div.className = 'exercise-input-item';
div.innerHTML = `<input type="text" class="ex-input" value="${val}" placeholder="Exercise name">`;
exList.appendChild(div);
div.querySelector('input').focus();
}

// --- OBSŁUGA KLIKNIĘĆ W KARTY (KROPKI) ---
workoutList.onclick = (e) => {
    if (e.target.innerText === 'more_horiz') {
        currentWorkoutId = e.target.dataset.index;
        const actionSheet = document.getElementById('action-sheet');
        actionSheet.style.display = 'flex';
    }
};

// --- POPRAWIONY KROK 2: OBSŁUGA MENU (ACTION SHEET) ---
document.getElementById('action-sheet').onclick = (e) => {
    const actionSheet = document.getElementById('action-sheet');

    // 1. Zamykanie menu (kliknięcie w tło lub przycisk Cancel)
    // Usunęliśmy wywołanie nieistniejącej funkcji closeActionSheet
    if (e.target === actionSheet || e.target.classList.contains('cancel-btn')) {
        actionSheet.style.display = 'none';
        return;
    }

    // 2. Kliknięcie w USUWANIE
    if (e.target.closest('.delete')) {
        if (confirm("Delete this workout?")) {
            let saved = JSON.parse(localStorage.getItem('myWorkouts')) || [];
            saved.splice(currentWorkoutId, 1);
            localStorage.setItem('myWorkouts', JSON.stringify(saved));
            actionSheet.style.display = 'none';
            loadWorkouts();
        }
        return;
    }

    // 3. Kliknięcie w EDYCJĘ
    if (e.target.closest('.action-item')) {
        editWorkout(currentWorkoutId);
        actionSheet.style.display = 'none';
    }
};

// --- ZAPISYWANIE ---
// --- UNIWERSALNA FUNKCJA ZAPISU (Zastępuje linie 141-160) ---
function handleSaveWorkout() {
    const title = titleInput.value.trim();
    if (title === "") {
        alert("Wpisz nazwę treningu!");
        return;
    }

    const inputs = document.querySelectorAll('.ex-input');
    const exercises = Array.from(inputs).map(i => i.value.trim()).filter(v => v !== "");

    let saved = JSON.parse(localStorage.getItem('myWorkouts')) || [];

    if (isEditing) {
        // Jeśli edytujemy, podmieniamy istniejący
        saved[currentWorkoutId] = { title, exercises };
    } else {
        // Jeśli nowy, dodajemy na początek
        saved.unshift({ title, exercises });
    }

    localStorage.setItem('myWorkouts', JSON.stringify(saved));
    modal.style.display = 'none';
    resetForm();
    loadWorkouts();
}

// Podpinamy tę funkcję pod główny przycisk na start
saveBtn.onclick = handleSaveWorkout;

function renderCard(workout, index) {
const card = document.createElement('div');
card.className = 'card';
card.innerHTML = `
<div class="card-header">
<h2>${workout.title}</h2>
<span class="material-symbols-outlined" data-index="${index}" style="cursor:pointer">more_horiz</span>
</div>
<div class="exercise-preview-list">
${workout.exercises.map(ex => `<div>${ex}</div>`).join('')}
</div>
<button class="start-btn secondary-btn" onclick="startWorkout('${workout.title}')">Start Workout</button>
`;
workoutList.appendChild(card);
}

function resetForm() {
titleInput.value = "";
exList.innerHTML = "";
emptyState.style.display = 'block';
saveBtn.classList.remove('active');
}

titleInput.oninput = () => {
saveBtn.classList.toggle('active', titleInput.value.trim() !== "");
};
let timerInterval;
let startTime;
let currentWorkoutData = [];
let activeWorkoutName = "";
// FUNKCJA STARTUJĄCA TRENING
document.addEventListener('click', (e) => {
if (e.target.classList.contains('start-btn')) {
const card = e.target.closest('.card');
const title = card.querySelector('h2').innerText;
const exercises = Array.from(card.querySelectorAll('.exercise-preview-list div')).map(div => div.innerText);

startWorkout(title, exercises);
}
});

function startWorkout(title, exercises) {
    activeWorkoutName = title;
    // 1. Pokazujemy ekran
    document.getElementById('active-workout-screen').style.display = 'flex';

    // 2. USUNIĘTO linię z .modal-title, która wywalała błąd!
    
    // 3. Czyścimy kontener na ćwiczenia
    const container = document.getElementById('active-exercises-container');
    container.innerHTML = "";

    // 4. Renderujemy ćwiczenia
    exercises.forEach((exName, exIndex) => {
        const exBlock = document.createElement('div');
        exBlock.classList.add('exercise-block'); // warto dodać klasę dla CSS
        exBlock.innerHTML = `
            <h3>${exName}</h3>
            <div class="set-row-header">
                <span>SET</span><span>KG</span><span>REPS</span><span>RIR</span><span>✔</span>
            </div>
            <div class="sets-list" data-ex-index="${exIndex}">
                ${createSetRow(1)}
            </div>
            <button class="add-set-btn" onclick="addNewSet(this)">+ Add Set</button>
        `;
        container.appendChild(exBlock);
    });

    startTimer();
}

function createSetRow(num) {
    return `
        <div class="set-row">
            <span class="set-num" onclick="deleteSet(this)">${num}</span>
            <input type="number" inputmode="decimal" step="any" class="weight-input" ... oninput="autoCheckSet(this)">
            <input type="number" inputmode="numeric" class="reps-input" ... oninput="autoCheckSet(this)">
            <input type="number" inputmode="numeric" class="rir-input" ... oninput="autoCheckSet(this)">
            <button class="check-btn" onclick="toggleSet(this)">✔</button>
        </div>
    `;
}

function addNewSet(btn) {
    const setsList = btn.previousElementSibling;
    const nextNum = setsList.children.length + 1;
    setsList.insertAdjacentHTML('beforeend', createSetRow(nextNum));
}

function toggleSet(btn) {
btn.classList.toggle('done');
calculateStats();
}

function calculateStats() {
let totalVolume = 0;
let totalSets = 0;

document.querySelectorAll('.set-row').forEach(row => {
const weight = parseFloat(row.querySelector('.weight-input').value) || 0;
const reps = parseFloat(row.querySelector('.reps-input').value) || 0;
const isDone = row.querySelector('.check-btn').classList.contains('done');

if (isDone) {
totalVolume += weight * reps;
totalSets++;
}
});

document.getElementById('total-volume').innerText = totalVolume + " kg";
document.getElementById('total-sets').innerText = totalSets;
}

function startTimer() {
startTime = Date.now();
timerInterval = setInterval(() => {
const seconds = Math.floor((Date.now() - startTime) / 1000);
document.getElementById('timer').innerText = seconds + "s";
}, 1000);
}


function autoCheckSet(input) {
    const row = input.closest('.set-row');
    const weight = row.querySelector('.weight-input').value;
    const reps = row.querySelector('.reps-input').value;
    const checkBtn = row.querySelector('.check-btn');

    if (weight !== "" && reps !== "") {
        checkBtn.classList.add('done');
    } else {
        checkBtn.classList.remove('done');
    }
    calculateStats(); // Aktualizuje kg i serie na górze ekranu
}

// Ta funkcja usuwa serię po kliknięciu w numerek
function deleteSet(numSpan) {
    const row = numSpan.closest('.set-row');
    const setsList = row.parentElement;

    row.remove(); 

    // To naprawia numerację (np. 1, 2, 4 zamieni na 1, 2, 3)
    Array.from(setsList.children).forEach((remainingRow, index) => {
        remainingRow.querySelector('.set-num').innerText = index + 1;
    });

    calculateStats();
}
function showScreen(name) {
    const home = document.getElementById('home-screen');
    const profile = document.getElementById('profile-screen');
    const history = document.getElementById('history-screen'); // UPEWNIJ SIĘ ŻE ID SIĘ ZGADZA
    const tabs = document.querySelectorAll('.tab-item');

    // Ukrywamy wszystko
    [home, profile, history].forEach(s => { if(s) s.style.display = 'none'; });
    tabs.forEach(t => t.classList.remove('active'));

    if (name === 'profile') {
        profile.style.display = 'block';
        tabs[2].classList.add('active');
    } else if (name === 'history') {
        history.style.display = 'block';
        tabs[2].classList.add('active'); // Zostawiamy profil jako aktywny w menu
        loadWorkoutHistory(); // WAŻNE: wywołujemy ładowanie danych!
    } else {
        home.style.display = 'block';
        tabs[0].classList.add('active');
    }
}

function loadWorkoutHistory() {
    const historyContainer = document.getElementById('workout-history-list');
    if (!historyContainer) return;

    const savedHistory = JSON.parse(localStorage.getItem('workoutHistory')) || [];
    historyContainer.innerHTML = '';

    if (savedHistory.length === 0) {
        historyContainer.innerHTML = '<p style="color: #8e8e93; text-align: center; margin-top: 20px;">Brak historii treningów.</p>';
        return;
    }

    const groups = {};
    savedHistory.forEach((workout) => {
        const dateObj = new Date(workout.timestamp);
        const monthYear = dateObj.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
        const capitalizedMonth = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
        if (!groups[capitalizedMonth]) groups[capitalizedMonth] = [];
        groups[capitalizedMonth].push(workout);
    });

    for (const month in groups) {
        const monthSection = document.createElement('details');
        monthSection.className = "history-section";
        monthSection.style.cssText = "margin-bottom: 15px; background: #1c1c1e; border-radius: 12px; overflow: hidden;";

        monthSection.innerHTML = `
            <summary style="padding: 15px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; background: #2c2c2e;">
                <div style="display: flex; align-items: center; gap: 5px;">
                    <span class="arrow-icon">▶</span>
                    <span style="color: #4ade80; font-weight: bold; font-size: 17px;">${month}</span>
                </div>
                <span style="color: #8e8e93; font-size: 12px;">${groups[month].length} treningi</span>
            </summary>
            <div style="padding: 10px; background: #121212; display: flex; flex-direction: column; gap: 10px;">
                ${groups[month].map(workout => `
                    <div style="position: relative; background: #1c1c1e; border-radius: 10px; overflow: hidden;">
                        <div class="history-delete-btn" 
                             style="position: absolute; right: 12px; top: 18px; z-index: 99; cursor: pointer; padding: 5px;"
                             onclick="event.stopPropagation(); deleteWorkout('${workout.id}');">
                             <span class="material-symbols-outlined" style="color: #ff453a; font-size: 22px;">delete</span>
                        </div>

                        <details>
                            <summary style="padding: 12px 45px 12px 12px; cursor: pointer; border-left: 4px solid #4ade80;">
                                <div style="display: flex; align-items: center; gap: 5px;">
                                    <span class="arrow-icon" style="font-size: 10px;">▶</span>
                                    <div>
                                        <h3 style="margin: 0; color: white; font-size: 16px;">${workout.name}</h3>
                                        <span style="color: #8e8e93; font-size: 11px;">${workout.date}</span>
                                    </div>
                                </div>
                            </summary>
                            
                            <div style="padding: 15px; border-top: 1px solid #2c2c2e; background: #18181a;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                                    <span style="color: #4ade80; font-weight: bold;">Objętość: ${workout.volume}</span>
                                    <span style="color: #8e8e93; font-size: 12px;">⏱ ${formatDuration(workout.duration)}</span>
                                </div>
                                ${workout.exercises.map(ex => `
                                    <div style="margin-bottom: 12px;">
                                        <div style="color: white; font-size: 14px; margin-bottom: 4px;">${ex.name}</div>
                                        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                                            ${ex.sets.map(set => `
                                                <div style="background: #2c2c2e; padding: 5px 8px; border-radius: 8px;">
                                                    <div style="color: #eee; font-size: 10px;">${set.weight}kg x ${set.reps}</div>
                                                    <div style="color: #4ade80; font-size: 9px;">RIR: ${set.rir}</div>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </details>
                    </div>
                `).join('')}
            </div>
        `;
        historyContainer.appendChild(monthSection);
    }
}

function showHistory() {
    loadWorkoutHistory(); // Uruchamia tę async funkcję wyżej
    showScreen('history-screen'); // Przełącza widok
}


function finishWorkout() {
    console.log("--- ZAPIS LOKALNY ---");

    // 1. Zatrzymujemy stoper
    if(typeof timerInterval !== 'undefined') clearInterval(timerInterval);

    const endTime = Date.now();
    const durationSeconds = typeof startTime !== 'undefined' ? Math.floor((endTime - startTime) / 1000) : 0;

    const workoutDetails = [];
    const container = document.getElementById('active-exercises-container');

    // 2. Zbieramy dane o ćwiczeniach
    const exerciseBlocks = container.querySelectorAll('.exercise-block');

    exerciseBlocks.forEach((block) => {
        const exerciseName = block.querySelector('h3')?.innerText || "Ćwiczenie";
        const sets = [];
        const setRows = block.querySelectorAll('.set-row');

        setRows.forEach(row => {
            sets.push({
                weight: row.querySelector('.weight-input')?.value || "0",
                reps: row.querySelector('.reps-input')?.value || "0",
                rir: row.querySelector('.rir-input')?.value || "0"
            });
        });

        workoutDetails.push({ name: exerciseName, sets: sets });
    });

    const currentTitle = (typeof activeWorkoutName !== 'undefined' && activeWorkoutName) ? activeWorkoutName : "Trening";

    // 3. Budujemy obiekt treningu
    const newWorkout = {
        id: Date.now(), // Unikalny identyfikator
        name: currentTitle,
        date: new Date().toLocaleDateString('pl-PL'),
        timestamp: endTime,
        duration: durationSeconds,
        volume: document.getElementById('total-volume')?.innerText || "0 kg",
        exercises: workoutDetails
    };

    // 4. ZAPIS DO LOCAL STORAGE
    const history = JSON.parse(localStorage.getItem('workoutHistory')) || [];
    history.unshift(newWorkout); // Dodajemy na górę listy
    localStorage.setItem('workoutHistory', JSON.stringify(history));

    alert("Trening zapisany na telefonie!");

    // 5. Powrót do profilu
    document.getElementById('active-workout-screen').style.display = 'none';
    showScreen('profile');
    loadWorkoutHistory(); // Odśwież listę od razu
}


function expandWorkout() {
    console.log("Powrót do treningu!");

    // 1. Ukrywamy mały pasek
    document.getElementById('workout-mini-bar').style.display = 'none';

    // 2. Pokazujemy pełny ekran treningu
    document.getElementById('active-workout-screen').style.display = 'block';
}

function cancelWorkout() {
    if (confirm("Czy na pewno chcesz przerwać i usunąć ten trening?")) {
        document.getElementById('workout-mini-bar').style.display = 'none';
        document.getElementById('active-workout-screen').style.display = 'none';
        // Tutaj można dodać resetowanie stopera
    }
}
// Ten kod automatycznie kopiuje czas z góry na dół
setInterval(() => {
    const mainTimer = document.getElementById('timer'); // główny zegar
    const miniTimer = document.getElementById('mini-timer'); // zegar na pasku

    if (mainTimer && miniTimer) {
        miniTimer.innerText = mainTimer.innerText;
    }
}, 1000);
function minimizeWorkout() {
    const activeScreen = document.getElementById('active-workout-screen');
    const miniBar = document.getElementById('workout-mini-bar');

    if (activeScreen && miniBar) {
        activeScreen.style.display = 'none';
        miniBar.style.display = 'block';

        // PRÓBA POBRANIA NAZWY:
        // Najpierw sprawdzamy, czy mamy nazwę w zmiennej (jeśli Twoja aplikacja ją przechowuje)
        // Jeśli nie, wpisujemy domyślny tekst "Workout", dopóki nie klikniemy Start.
        const workoutName = document.getElementById('mini-workout-name');
        
        // Jeśli chcesz, żeby nazwa była dynamiczna, upewnij się, że startWorkout 
        // zapisuje nazwę do jakiejś zmiennej, np. currentWorkoutTitle
        if (typeof currentWorkoutTitle !== 'undefined') {
            workoutName.innerText = currentWorkoutTitle;
        } else {
            workoutName.innerText = "Active Workout"; 
        }

        if (typeof showScreen === 'function') showScreen('home');
    }
}
// 1. Ta funkcja przygotowuje formularz do edycji
function editWorkout(index) {
    console.log("Próba edycji treningu o indeksie:", index);
    
    // 1. Pobieramy dane z pamięci
    const saved = JSON.parse(localStorage.getItem('myWorkouts')) || [];
    const workout = saved[index];
    
    if (!workout) {
        console.error("Nie znaleziono treningu!");
        return;
    }

    // 2. Ustawiamy tryb edycji
    currentWorkoutId = index;
    isEditing = true;

    // 3. Wpisujemy tytuł (Używamy Twojej zmiennej titleInput)
    if (typeof titleInput !== 'undefined') {
        titleInput.value = workout.title;
    } else {
        document.getElementById('routine-title-input').value = workout.title;
    }

    // 4. Czyścimy listę ćwiczeń (Używamy Twojej zmiennej exList)
    const listElement = (typeof exList !== 'undefined') ? exList : document.getElementById('added-exercises-list');
    listElement.innerHTML = ''; 

    // 5. Chowamy obrazek strzykawki
    const placeholder = document.getElementById('empty-state-placeholder');
    if (placeholder) placeholder.style.display = 'none';

    // 6. Dodajemy ćwiczenia (używając Twojej funkcji addExerciseInput)
    if (workout.exercises && workout.exercises.length > 0) {
        workout.exercises.forEach(exName => {
            addExerciseInput(exName);
        });
    }

    // 7. Pokazujemy okno (Używamy Twojej zmiennej modal)
    const modalElement = (typeof modal !== 'undefined') ? modal : document.getElementById('create-routine-modal');
    modalElement.style.display = 'flex';
    
    // Zmieniamy nagłówek w modalu
    const modalTitle = document.querySelector('.modal-title');
    if (modalTitle) modalTitle.innerText = "Edit Routine";

    // 8. Zmieniamy przycisk
    if (typeof saveBtn !== 'undefined') {
        saveBtn.innerText = "Update";
        saveBtn.onclick = handleSaveWorkout; // Funkcja, którą zrobiliśmy w poprzednim kroku
    }
}

function updateExistingWorkout() {
    const title = document.getElementById('routine-title-input').value;
    const inputs = document.querySelectorAll('#added-exercises-list .ex-input');
    const exercises = Array.from(inputs).map(i => i.value).filter(v => v !== "");

    if (!title) {
        alert("Wpisz nazwę treningu!");
        return;
    }

    // Zapisujemy do localStorage
    let saved = JSON.parse(localStorage.getItem('myWorkouts')) || [];
    saved[currentWorkoutId] = { title, exercises };
    localStorage.setItem('myWorkouts', JSON.stringify(saved));

    // Wracamy do domu
    showScreen('home-screen');
    loadWorkouts();

    // Reset przycisku na przyszłość
    const saveBtn = document.getElementById('save-routine-btn');
    saveBtn.innerText = "Save";
    saveBtn.onclick = saveRoutine;
}

function formatWorkoutTime(seconds) {
    if (!seconds) return "0m";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    
    if (h > 0) {
        return `${h}h ${m}m`;
    }
    return `${m}m`;
}
async function deleteWorkout(workoutId) {
    if (!confirm("Czy na pewno chcesz usunąć ten trening z historii?")) return;

    try {
        const { deleteDoc, doc } = window.fbOps;
        // Tworzymy referencję do konkretnego dokumentu w kolekcji "workouts"
        await window.fbOps.deleteDoc(window.fbOps.doc(window.db, "workouts", workoutId));
        
        alert("Trening został usunięty.");
        loadWorkoutHistory(); // Odświeżamy widok historii
    } catch (e) {
        console.error("Błąd podczas usuwania:", e);
        alert("Nie udało się usunąć treningu: " + e.message);
    }
}