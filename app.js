const style = document.createElement('style');
style.textContent = `
    details summary::-webkit-details-marker { display: none; }
    details[open] .arrow-icon { transform: rotate(180deg); display: inline-block; }
    /* Powyższe sprawi, że strzałka się obróci, co da efekt ▴ */
`;
document.head.appendChild(style);

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
            <input type="number" class="weight-input" placeholder="0" oninput="autoCheckSet(this)">
            <input type="number" class="reps-input" placeholder="0" oninput="autoCheckSet(this)">
            <input type="text" class="rir-input" placeholder="RIR" oninput="autoCheckSet(this)">
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

// --- FINISH WORKOUT ---
async function renderFullHistory() {
    const list = document.getElementById('full-history-list');
    if (!list) return;

    // Wyświetlamy kręciołek lub napis ładowania
    list.innerHTML = '<p style="color: #8e8e93; text-align: center; margin-top: 20px;">Ładowanie historii z chmury...</p>';

    try {
        // Pobieramy kolekcję "workouts" posortowaną od najnowszych (timestamp desc)
        const q = window.fbOps.query(
            window.fbOps.collection(window.db, "workouts"), 
            window.fbOps.orderBy("timestamp", "desc")
        );
        
        const querySnapshot = await window.fbOps.getDocs(q);
        
        if (querySnapshot.empty) {
            list.innerHTML = '<p style="color: #8e8e93; text-align: center; margin-top: 20px;">Brak zapisanych treningów.</p>';
            return;
        }

        let html = "";
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            html += `
                <div style="background: #1c1c1e; padding: 15px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid #34c759; margin-bottom: 10px;">
                    <div>
                        <div style="color: white; font-weight: bold;">${data.name || 'Trening'}</div>
                        <div style="color: #8e8e93; font-size: 12px;">${data.date}</div>
                    </div>
                    <div style="color: #34c759; font-weight: bold;">${data.volume}</div>
                </div>
            `;
        });
        
        list.innerHTML = html;

    } catch (error) {
        console.error("Błąd pobierania historii:", error);
        list.innerHTML = '<p style="color: #ff453a; text-align: center; margin-top: 20px;">Błąd ładowania danych.</p>';
    }
}
// Ta funkcja sama zaznacza ptaszka na niebiesko
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
    const history = document.getElementById('history-screen');
    const tabs = document.querySelectorAll('.tab-item');

    // Ukrywamy wszystko
    [home, profile, history].forEach(s => { if(s) s.style.display = 'none'; });
    tabs.forEach(t => t.classList.remove('active'));

    if (name === 'profile') {
        profile.style.display = 'block';
        tabs[2].classList.add('active'); // Profile
    } 
    else if (name === 'workout') {
        home.style.display = 'block'; // Lub ekran startowy treningu
        tabs[1].classList.add('active'); // Środkowa ikona Workout
    }
    else if (name === 'history') {
        history.style.display = 'block';
        tabs[2].classList.add('active'); // Zostawiamy profil aktywny
        renderFullHistory();
    } 
    else {
        home.style.display = 'block';
        tabs[0].classList.add('active'); // Home
    }
}
function loadWorkoutHistory() {
    const historyContainer = document.getElementById('workout-history-list');
    if (!historyContainer) return;

    if (workoutHistory.length === 0) {
        historyContainer.innerHTML = `<p style="color: #8e8e93; text-align: center;">Brak historii</p>`;
        return;
    }

    historyContainer.innerHTML = workoutHistory.map(workout => `
        <div style="background: #1c1c1e; padding: 15px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid #007aff;">
            <div>
                <div style="color: white; font-weight: bold; font-size: 16px;">${workout.name}</div>
                <div style="color: #8e8e93; font-size: 12px; margin-top: 2px;">${workout.date}</div>
            </div>
            <div style="text-align: right;">
                <div style="color: #34c759; font-size: 14px; font-weight: bold;">${workout.volume}</div>
                <div style="color: #48484a; font-size: 10px; text-transform: uppercase;">Objętość</div>
            </div>
        </div>
    `).join('');
}

// Wywołaj tę funkcję przy ładowaniu strony lub przy wejściu w profil
document.addEventListener('DOMContentLoaded', loadWorkoutHistory);
// Ta zmienna będzie trzymać Twoje realne treningi
let userWorkoutHistory = [];
async function finishWorkout() {
console.log("--- START ZAPISU (WERSJA DOPASOWANA) ---");
if(typeof timerInterval !== 'undefined') clearInterval(timerInterval);

const workoutDetails = [];

// Ta linia szuka nagłówka z nazwą planu na aktywnym ekranie
const workoutName = document.querySelector('#active-workout-screen h2')?.innerText || "Trening";

// 1. Szukamy głównego kontenera, który widzę na Twoim zdjęciu
const container = document.getElementById('active-exercises-container');
if (!container) {
console.error("Nie znaleziono active-exercises-container!");
return;
}

// 2. Szukamy wszystkich bloków ćwiczeń (u Ciebie to divy bezpośrednio w kontenerze)
// Na zdjęciu widzę, że h3 (nazwa) i sets-list są rodzeństwem wewnątrz divów
const exerciseBlocks = container.querySelectorAll('.sets-list');

exerciseBlocks.forEach((setsList) => {
// Nazwa ćwiczenia to h3, które jest przed setsList
const exerciseName = setsList.previousElementSibling?.previousElementSibling?.innerText || "Ćwiczenie";

const sets = [];
const setRows = setsList.querySelectorAll('.set-row');

setRows.forEach(row => {
const weight = row.querySelector('.weight-input')?.value || "0";
const reps = row.querySelector('.reps-input')?.value || "0";
sets.push({ weight: weight + "kg", reps: reps });
});

workoutDetails.push({
exerciseName: exerciseName,
sets: sets
});
});

// Pobieramy napis "Trening 1" z nagłówka h2 na ekranie treningu
const currentTitle = document.querySelector('.modal-nav h2')?.innerText || 
                     document.querySelector('h2')?.innerText || 
                     "Trening";

const newWorkout = {
    name: currentTitle, // <--- Tutaj wpisujemy pobraną nazwę
    date: new Date().toLocaleString('pl-PL'),
    timestamp: Date.now(),
    volume: document.getElementById('total-volume')?.innerText || "0 kg",
    exercises: workoutDetails 
};

console.log("Obiekt do wysłania:", newWorkout);

try {
await window.fbOps.addDoc(window.fbOps.collection(window.db, "workouts"), newWorkout);
alert("Trening zapisany ze szczegółami!");
document.getElementById('active-workout-screen').style.display = 'none';
showScreen('profile');
renderFullHistory();
} catch (e) {
console.error("Błąd zapisu:", e);
alert("Błąd: " + e.message);
}
}
async function renderFullHistory() {
const list = document.getElementById('full-history-list');
if (!list) return;
list.innerHTML = '<p style="color: #8e8e93; text-align: center; margin-top: 20px;">Ładowanie historii...</p>';

try {
const q = window.fbOps.query(window.fbOps.collection(window.db, "workouts"), window.fbOps.orderBy("timestamp", "desc"));
const querySnapshot = await window.fbOps.getDocs(q);
if (querySnapshot.empty) {
list.innerHTML = '<p style="color: #8e8e93; text-align: center; margin-top: 20px;">Brak treningów.</p>';
return;
}

const groups = {};
querySnapshot.forEach((doc) => {
const data = doc.data();
const dateObj = new Date(data.timestamp);
const monthYear = dateObj.toLocaleString('pl-PL', { month: 'long', year: 'numeric' });
const capitalizedMonth = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
if (!groups[capitalizedMonth]) groups[capitalizedMonth] = [];
groups[capitalizedMonth].push({ id: doc.id, ...data });
});

let html = "";
for (const month in groups) {
// Brak atrybutu 'open' = wszystko domyślnie zwinięte
html += `
<details class="history-section" style="margin-bottom: 15px; background: #1c1c1e; border-radius: 12px; overflow: hidden; border: 1px solid #333;">
<summary style="padding: 15px; cursor: pointer; list-style: none; display: flex; justify-content: space-between; align-items: center; background: #2c2c2e;">
<span style="color: #34c759; font-size: 17px; font-weight: bold;">${month}</span>
<div style="display: flex; align-items: center; gap: 10px;">
<span style="color: #8e8e93; font-size: 12px;">${groups[month].length} treningi</span>
<span class="arrow-icon" style="color: #8e8e93; font-size: 14px;">▾</span>
</div>
</summary>
<div style="padding: 10px; background: #1c1c1e;">
${groups[month].map(workout => {
let exHtml = (workout.exercises || []).map(ex => `
<div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #333;">
<div style="color: #eee; font-size: 13px; font-weight: 600;">${ex.exerciseName}</div>
<div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px;">
${ex.sets.map(s => `<span style="background: #3a3a3c; color: #ccc; padding: 3px 8px; border-radius: 5px; font-size: 11px;">${s.weight} x ${s.reps}</span>`).join('')}
</div>
</div>`).join('');
return `
<div class="workout-card" style="background: #2c2c2e; padding: 15px; border-radius: 10px; margin-bottom: 10px; border-left: 4px solid #34c759;">
<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
<div style="color: #8e8e93; font-size: 11px; flex: 1;">${workout.date.split(',')[0]}</div>
<div style="color: white; font-weight: bold; font-size: 15px; flex: 2; text-align: center;">${workout.name || "Trening"}</div>
<div style="color: #34c759; font-size: 12px; font-weight: bold; flex: 1; text-align: right;">${workout.volume}</div>
</div>
${exHtml}
</div>`;
}).join('')}
</div>
</details>`;
}
list.innerHTML = html;
} catch (e) { list.innerHTML = '<p style="color: #ff453a; text-align: center;">Błąd ładowania.</p>'; }
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
function showHistory() {
    loadWorkoutHistory(); // Funkcja ładująca Twoje treningi
    showScreen('history-screen'); // Przełączenie widoku
}

function loadWorkoutHistory() {
    const listElement = document.getElementById('workout-history-list');
    // Pobierz dane (zakładam, że masz je w localStorage pod kluczem 'myWorkouts')
    const saved = JSON.parse(localStorage.getItem('myWorkouts')) || [];

    if (saved.length === 0) {
        listElement.innerHTML = '<p style="color: #8e8e93; text-align: center; margin-top: 50px;">No workouts yet.</p>';
        return;
    }

    listElement.innerHTML = ''; // Czyścimy listę

    saved.forEach((workout) => {
        const item = document.createElement('div');
        item.style.cssText = "background: #1c1c1e; padding: 15px; border-radius: 12px; border-left: 4px solid #007aff;";
        item.innerHTML = `
            <div style="display: flex; justify-content: space-between;">
                <strong style="color: white;">${workout.title}</strong>
                <span style="color: #8e8e93; font-size: 12px;">Zapisano</span>
            </div>
            <p style="margin: 5px 0 0; font-size: 13px; color: #ccc;">${workout.exercises.join(' • ')}</p>
        `;
        listElement.appendChild(item);
    });
}