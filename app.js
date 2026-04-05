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

// --- OTWIERANIE MODALA TWORZENIA ---
document.getElementById('open-modal-btn').onclick = () => {
isEditing = false;
currentWorkoutId = null;
resetForm();
modal.style.display = 'flex';
document.querySelector('.modal-title').innerText = "Create Routine";
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
// Sprawdzamy czy kliknięto w ikonkę more_horiz
if (e.target.innerText === 'more_horiz') {
currentWorkoutId = e.target.dataset.index;
actionSheet.style.display = 'flex';
}
};

// Zamykanie Action Sheet
document.getElementById('close-action-sheet').onclick = () => {
actionSheet.style.display = 'none';
};

// Zamknij Action Sheet po kliknięciu w tło
actionSheet.onclick = (e) => {
if (e.target === actionSheet) actionSheet.style.display = 'none';
};

// --- USUWANIE ---
document.getElementById('delete-routine-opt').onclick = () => {
let saved = JSON.parse(localStorage.getItem('myWorkouts')) || [];
saved.splice(currentWorkoutId, 1);
localStorage.setItem('myWorkouts', JSON.stringify(saved));
actionSheet.style.display = 'none';
loadWorkouts();
};

// --- EDYCJA ---
document.getElementById('edit-routine-opt').onclick = () => {
isEditing = true;
let saved = JSON.parse(localStorage.getItem('myWorkouts')) || [];
const workout = saved[currentWorkoutId];

titleInput.value = workout.title;
exList.innerHTML = "";
workout.exercises.forEach(ex => addExerciseInput(ex));

document.querySelector('.modal-title').innerText = "Edit Routine";
saveBtn.classList.add('active');
actionSheet.style.display = 'none';
modal.style.display = 'flex';
};

// --- ZAPISYWANIE ---
saveBtn.onclick = () => {
const title = titleInput.value.trim();
if (title === "") return;

const inputs = document.querySelectorAll('.ex-input');
const exercises = Array.from(inputs).map(i => i.value.trim()).filter(v => v !== "");

let saved = JSON.parse(localStorage.getItem('myWorkouts')) || [];

if (isEditing) {
saved[currentWorkoutId] = { title, exercises };
} else {
saved.unshift({ title, exercises });
}

localStorage.setItem('myWorkouts', JSON.stringify(saved));
modal.style.display = 'none';
resetForm();
loadWorkouts();
};

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
<button class="start-btn">Start Workout</button>
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
    document.getElementById('active-workout-screen').style.display = 'flex';
    const container = document.getElementById('active-exercises-container');
    container.innerHTML = "";

    exercises.forEach((exName, exIndex) => {
        const exBlock = document.createElement('div');
        exBlock.innerHTML = `
    <h3>${exName}</h3>
    <div class="set-row-header">
        <span>SET</span>
        <span>KG</span>
        <span>REPS</span>
        <span>RIR</span>
        <span>✔</span>
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

const newWorkout = {
name: "Trening",
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

// --- TUTAJ GENERUJEMY LISTE ĆWICZEŃ ---
let exercisesHtml = "";
if (data.exercises && Array.isArray(data.exercises)) {
exercisesHtml = data.exercises.map(ex => `
<div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #2c2c2e;">
<div style="color: #ffffff; font-size: 14px; font-weight: 600; margin-bottom: 4px;">${ex.exerciseName}</div>
<div style="display: flex; flex-wrap: wrap; gap: 5px;">
${ex.sets.map((s, i) => `
<span style="background: #2c2c2e; color: #aaa; padding: 2px 8px; border-radius: 4px; font-size: 11px;">
S${i+1}: ${s.weight} x ${s.reps}
</span>
`).join('')}
</div>
</div>
`).join('');
}

// Główne "pudełko" treningu
html += `
<div style="background: #1c1c1e; padding: 16px; border-radius: 15px; margin-bottom: 15px; border-left: 5px solid #34c759; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
<span style="color: #ffffff; font-weight: bold; font-size: 16px;">${data.date}</span>
<span style="color: #34c759; font-weight: bold; font-size: 14px;">Total: ${data.volume}</span>
</div>
${exercisesHtml}
</div>
`;
});

list.innerHTML = html;

} catch (error) {
console.error("Błąd pobierania:", error);
list.innerHTML = '<p style="color: #ff453a; text-align: center;">Błąd ładowania danych.</p>';
}
}
