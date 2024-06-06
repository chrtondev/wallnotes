document.addEventListener('DOMContentLoaded', function() {
    // Get necessary elements from the DOM
    const contextMenu = document.getElementById('contextMenu');
    const body = document.querySelector('body');
    let notesContainer = document.querySelector('section');
    let currentDraggingNote = null;
    let offsetX = 0;
    let offsetY = 0;
    let mouseX = 0;
    let mouseY = 0;
    let deleteMode = false;
    let currentEditingNote = null;

    // Create notification element and add it to the body
    const notification = document.createElement('div');
    notification.className = 'notification';
    body.appendChild(notification);

    // Get notepad elements
    const notepad = document.getElementById('notepad');
    const notepadContent = document.getElementById('notepadContent');

    // Get help display elements
    const helpDisplay = document.getElementById('helpDisplay');
    const closeHelpButton = document.getElementById('closeHelp');

    // Close help display when the close button is clicked
    closeHelpButton.addEventListener('click', function() {
        helpDisplay.style.display = 'none';
    });

    // Function to show a notification with a message
    function showNotification(message) {
        notification.textContent = message;
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // Modal elements for creating a note
    const nameModal = document.getElementById('nameModal');
    const closeModal = document.getElementById('closeModal');
    const noteTitleInput = document.getElementById('noteTitle');
    const saveNoteTitleButton = document.getElementById('saveNoteTitle');

    // Close the name modal when the close button is clicked
    closeModal.addEventListener('click', function() {
        nameModal.style.display = 'none';
    });

    // Function to open the name modal and handle the saving of the note title
    function openNameModal(callback) {
        nameModal.style.display = 'flex';
        noteTitleInput.value = '';
        saveNoteTitleButton.onclick = function() {
            const title = noteTitleInput.value;
            if (title) {
                nameModal.style.display = 'none';
                callback(title);
            }
        };
    }

    // Welcome modal elements
    const welcomeModal = document.getElementById('welcomeModal');
    const dontShowAgainCheckbox = document.getElementById('dontShowAgain');
    const dismissWelcomeButton = document.getElementById('dismissWelcome');

    // Function to show the welcome modal if it hasn't been dismissed permanently
    function showWelcomeModal() {
        if (!localStorage.getItem('dontShowWelcome')) {
            welcomeModal.style.display = 'flex';
        }
    }

    // Dismiss the welcome modal and remember the preference if the checkbox is checked
    dismissWelcomeButton.addEventListener('click', function() {
        if (dontShowAgainCheckbox.checked) {
            localStorage.setItem('dontShowWelcome', true);
        }
        welcomeModal.style.display = 'none';
    });

    // Cookie functions
    function setCookie(name, value, days) {
        const d = new Date();
        d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = "expires=" + d.toUTCString();
        document.cookie = name + "=" + JSON.stringify(value) + ";" + expires + ";path=/";
    }

    function getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return JSON.parse(c.substring(nameEQ.length, c.length));
        }
        return null;
    }

    function deleteCookie(name) {
        document.cookie = name + "=; Max-Age=-99999999;";
    }

    // Function to save notes to cookies
    function saveNotes() {
        const notes = [];
        document.querySelectorAll('.note').forEach(note => {
            notes.push({
                title: note.querySelector('.note-title').innerText,
                content: note.dataset.content,
                x: note.style.left,
                y: note.style.top
            });
        });
        setCookie('notes', notes, 7);
    }

    // Function to load notes from cookies
    function loadNotes() {
        const notes = getCookie('notes');
        if (notes) {
            notes.forEach(note => {
                createNoteElement(note.x, note.y, note.title, note.content);
            });
        }
    }

    // Function to create a new note element
    function createNoteElement(x, y, title, content) {
        const note = document.createElement('div');
        note.className = 'note';
        note.style.left = x;
        note.style.top = y;
        note.innerHTML = `<div class="note-title">${title}</div>`;
        note.dataset.content = content;
        notesContainer.appendChild(note);

        // Add event listeners for note interactions
        note.addEventListener('mousedown', function(e) {
            if (deleteMode) {
                notesContainer.removeChild(note);
                deleteMode = false;
                showNotification('Note deleted.');
                saveNotes();
            } else {
                currentDraggingNote = note;
                offsetX = e.offsetX;
                offsetY = e.offsetY;
            }
        });

        note.addEventListener('dblclick', function(e) {
            if (!deleteMode) {
                openNotepad(note);
            }
        });
    }

    // Show context menu on right-click
    body.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        contextMenu.style.display = 'block';
        contextMenu.style.left = `${e.pageX}px`;
        contextMenu.style.top = `${e.pageY}px`;
        contextMenu.dataset.x = e.pageX;
        contextMenu.dataset.y = e.pageY;
    });

    // Hide context menu on click
    body.addEventListener('click', function() {
        contextMenu.style.display = 'none';
    });

    // Track mouse movements for positioning new notes
    body.addEventListener('mousemove', function(e) {
        mouseX = e.pageX;
        mouseY = e.pageY;
    });

    // Add note on context menu selection
    document.getElementById('addNote').addEventListener('click', function() {
        openNameModal(function(title) {
            createNoteElement(`${contextMenu.dataset.x}px`, `${contextMenu.dataset.y}px`, title, '');
            showNotification('Note added.');
            saveNotes();
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'a') {
            e.preventDefault();
            openNameModal(function(title) {
                createNoteElement(`${mouseX}px`, `${mouseY}px`, title, '');
                showNotification('Note added.');
                saveNotes();
            });
        } else if (e.ctrlKey && e.key === 'h') {
            e.preventDefault();
            helpDisplay.style.display = 'flex';
        } else if (e.ctrlKey && e.key === 's' && notepad.style.display === 'block') {
            e.preventDefault();
            saveNote();
        }
    });

    // Delete note on context menu selection
    document.getElementById('deleteNote').addEventListener('click', function() {
        showNotification('Click on the note to be deleted.');
        deleteMode = true;
    });

    // Open notepad to edit note content
    function openNotepad(note) {
        currentEditingNote = note;
        notepadContent.value = note.dataset.content; // Load note content
        notepad.style.display = 'block';
        notepadContent.focus();
    }

    // Save note content from notepad
    function saveNote() {
        currentEditingNote.dataset.content = notepadContent.value; // Save note content
        notepad.style.display = 'none';
        showNotification('Note saved.');
        saveNotes();
    }

    // Drag and drop functionality for notes
    document.addEventListener('mousemove', function(e) {
        if (currentDraggingNote) {
            currentDraggingNote.style.left = `${e.pageX - offsetX}px`;
            currentDraggingNote.style.top = `${e.pageY - offsetY}px`;
        }
    });

    document.addEventListener('mouseup', function() {
        currentDraggingNote = null;
        saveNotes();
    });

    // Load notes on page load
    loadNotes();

    // Show welcome modal on page load
    showWelcomeModal();
});
