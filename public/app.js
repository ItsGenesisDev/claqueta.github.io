// Elementos DOM
const moviesList = document.getElementById('moviesList');
const addMovieBtn = document.getElementById('addMovieBtn');
const movieModal = document.getElementById('movieModal');
const detailsModal = document.getElementById('detailsModal');
const deleteModal = document.getElementById('deleteModal');
const movieForm = document.getElementById('movieForm');
const opinionForm = document.getElementById('opinionForm');
const modalTitle = document.getElementById('modalTitle');
const closeButtons = document.querySelectorAll('.close');
const confirmDeleteBtn = document.getElementById('confirmDelete');
const cancelDeleteBtn = document.getElementById('cancelDelete');

// Variables globales
let currentMovieId = null;
let movies = [];

// Cargar películas al iniciar
document.addEventListener('DOMContentLoaded', fetchMovies);

// Event Listeners
addMovieBtn.addEventListener('click', () => openMovieModal());
movieForm.addEventListener('submit', handleMovieSubmit);
opinionForm.addEventListener('submit', handleOpinionSubmit);
confirmDeleteBtn.addEventListener('click', confirmDelete);
cancelDeleteBtn.addEventListener('click', () => closeModal(deleteModal));

// Cerrar modales con botones de cierre
closeButtons.forEach(button => {
  button.addEventListener('click', () => {
    closeModal(button.closest('.modal'));
  });
});

// Cerrar modales al hacer clic fuera de ellos
window.addEventListener('click', (e) => {
  if (e.target === movieModal) closeModal(movieModal);
  if (e.target === detailsModal) closeModal(detailsModal);
  if (e.target === deleteModal) closeModal(deleteModal);
});

// Funciones para manejar películas
async function fetchMovies() {
  try {
    const response = await fetch('/api/movies');
    movies = await response.json();
    renderMovies();
  } catch (error) {
    console.error('Error al cargar películas:', error);
    moviesList.innerHTML = '<div class="error">Error al cargar películas. Intenta de nuevo más tarde.</div>';
  }
}

function renderMovies() {
  if (movies.length === 0) {
    moviesList.innerHTML = '<div class="loading">No hay películas disponibles. ¡Agrega una!</div>';
    return;
  }

  moviesList.innerHTML = movies.map(movie => `
    <div class="movie-card">
      <img src="${movie.image || '/placeholder.svg?height=200&width=300'}" alt="${movie.name}" class="movie-image">
      <div class="movie-info">
        <h2 class="movie-title">${movie.name}</h2>
        <p class="movie-date">Fecha: ${formatDate(movie.date)}</p>
        <p class="movie-rating">Calificación: ${movie.rating}/10</p>
        <p class="movie-description">${movie.description}</p>
        <div class="card-actions">
          <button class="btn secondary" onclick="viewMovieDetails('${movie.id}')">Ver Detalles</button>
          <button class="btn warning" onclick="openMovieModal('${movie.id}')">Editar</button>
          <button class="btn primary" onclick="deleteMovie('${movie.id}')">Eliminar</button>
        </div>
      </div>
    </div>
  `).join('');
}

function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('es-ES', options);
}

function openMovieModal(id = null) {
  // Limpiar formulario
  movieForm.reset();
  document.getElementById('currentImage').innerHTML = '';
  
  if (id) {
    // Modo edición
    const movie = movies.find(m => m.id === id);
    if (!movie) return;
    
    currentMovieId = id;
    modalTitle.textContent = 'Editar Película';
    
    document.getElementById('movieId').value = movie.id;
    document.getElementById('name').value = movie.name;
    document.getElementById('description').value = movie.description;
    document.getElementById('date').value = movie.date;
    document.getElementById('rating').value = movie.rating;
    
    if (movie.image) {
      document.getElementById('currentImage').innerHTML = `
        <p>Imagen actual:</p>
        <img src="${movie.image}" alt="Imagen actual">
      `;
    }
  } else {
    // Modo creación
    currentMovieId = null;
    modalTitle.textContent = 'Agregar Película';
  }
  
  movieModal.style.display = 'block';
}

async function handleMovieSubmit(e) {
  e.preventDefault();
  
  const formData = new FormData(movieForm);
  const imageInput = document.getElementById('image');
  
  // Si no hay una nueva imagen en modo edición, eliminar el campo para no sobrescribir
  if (currentMovieId && imageInput.files.length === 0) {
    formData.delete('image');
  }
  
  try {
    let url = '/api/movies';
    let method = 'POST';
    
    if (currentMovieId) {
      url = `/api/movies/${currentMovieId}`;
      method = 'PUT';
    }
    
    const response = await fetch(url, {
      method,
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Error al guardar la película');
    }
    
    closeModal(movieModal);
    await fetchMovies();
  } catch (error) {
    console.error('Error:', error);
    alert('Error al guardar la película. Intenta de nuevo.');
  }
}

function deleteMovie(id) {
  currentMovieId = id;
  deleteModal.style.display = 'block';
}

async function confirmDelete() {
  if (!currentMovieId) return;
  
  try {
    const response = await fetch(`/api/movies/${currentMovieId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Error al eliminar la película');
    }
    
    closeModal(deleteModal);
    await fetchMovies();
  } catch (error) {
    console.error('Error:', error);
    alert('Error al eliminar la película. Intenta de nuevo.');
  }
}

// Funciones para manejar detalles y opiniones
async function viewMovieDetails(id) {
  try {
    const response = await fetch(`/api/movies/${id}`);
    const movie = await response.json();
    
    currentMovieId = id;
    
    const movieDetails = document.getElementById('movieDetails');
    const opinionsList = document.getElementById('opinionsList');
    const addOpinionForm = document.getElementById('addOpinionForm');
    
    // Mostrar detalles de la película
    movieDetails.innerHTML = `
      <div class="movie-details">
        <img src="${movie.image || '/placeholder.svg?height=300&width=500'}" alt="${movie.name}" class="movie-details-image">
        <div class="movie-details-info">
          <h2>${movie.name}</h2>
          <p class="movie-details-date">Fecha: ${formatDate(movie.date)}</p>
          <p class="movie-details-rating">Calificación: ${movie.rating}/10</p>
          <p class="movie-details-description">${movie.description}</p>
        </div>
      </div>
    `;
    
    // Mostrar opiniones
    if (movie.opinions && movie.opinions.length > 0) {
      opinionsList.innerHTML = `
        <div class="opinions-list">
          ${movie.opinions.map(opinion => `
            <div class="opinion-card">
              <div class="opinion-header">
                <span class="opinion-user">${opinion.user}</span>
                <span class="opinion-rating">Calificación: ${opinion.rating}/10</span>
              </div>
              <p>${opinion.comment}</p>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      opinionsList.innerHTML = '<p class="no-opinions">No hay opiniones todavía. ¡Sé el primero en opinar!</p>';
    }
    
    // Mostrar u ocultar formulario de opiniones según si ya hay 3 opiniones
    if (movie.opinions && movie.opinions.length >= 3) {
      addOpinionForm.innerHTML = '<p>Esta película ya tiene el máximo de 3 opiniones.</p>';
    } else {
      // Resetear formulario de opiniones
      opinionForm.reset();
    }
    
    detailsModal.style.display = 'block';
  } catch (error) {
    console.error('Error al cargar detalles:', error);
    alert('Error al cargar los detalles de la película. Intenta de nuevo.');
  }
}

async function handleOpinionSubmit(e) {
  e.preventDefault();
  
  if (!currentMovieId) return;
  
  const formData = new FormData(opinionForm);
  const opinionData = {
    user: formData.get('user'),
    rating: formData.get('rating'),
    comment: formData.get('comment')
  };
  
  try {
    const response = await fetch(`/api/movies/${currentMovieId}/opinions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(opinionData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al guardar la opinión');
    }
    
    // Actualizar vista de detalles
    viewMovieDetails(currentMovieId);
  } catch (error) {
    console.error('Error:', error);
    alert(error.message || 'Error al guardar la opinión. Intenta de nuevo.');
  }
}

// Función para cerrar modales
function closeModal(modal) {
  modal.style.display = 'none';
}

// Hacer funciones disponibles globalmente
window.openMovieModal = openMovieModal;
window.viewMovieDetails = viewMovieDetails;
window.deleteMovie = deleteMovie;