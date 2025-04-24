import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Configuración de multer para subir imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync('./uploads')) {
      fs.mkdirSync('./uploads');
    }
    cb(null, './uploads');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Solo se permiten imágenes!');
    }
  }
});

// Crear archivo de datos si no existe
if (!fs.existsSync('./data')) {
  fs.mkdirSync('./data');
}
if (!fs.existsSync('./data/movies.json')) {
  fs.writeFileSync('./data/movies.json', JSON.stringify([]));
}

// Funciones auxiliares para manejar datos
const getMovies = () => {
  const data = fs.readFileSync('./data/movies.json');
  return JSON.parse(data);
};

const saveMovies = (movies) => {
  fs.writeFileSync('./data/movies.json', JSON.stringify(movies, null, 2));
};

// Rutas API
app.get('/api/movies', (req, res) => {
  res.json(getMovies());
});

app.get('/api/movies/:id', (req, res) => {
  const movies = getMovies();
  const movie = movies.find(m => m.id === req.params.id);
  
  if (!movie) {
    return res.status(404).json({ error: 'Película no encontrada' });
  }
  
  res.json(movie);
});

app.post('/api/movies', upload.single('image'), (req, res) => {
  try {
    const movies = getMovies();
    const newMovie = {
      id: Date.now().toString(),
      name: req.body.name,
      description: req.body.description,
      date: req.body.date,
      rating: parseFloat(req.body.rating),
      image: req.file ? `/uploads/${req.file.filename}` : null,
      opinions: []
    };
    
    movies.push(newMovie);
    saveMovies(movies);
    
    res.status(201).json(newMovie);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/movies/:id', upload.single('image'), (req, res) => {
  try {
    const movies = getMovies();
    const index = movies.findIndex(m => m.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Película no encontrada' });
    }
    
    const updatedMovie = {
      ...movies[index],
      name: req.body.name || movies[index].name,
      description: req.body.description || movies[index].description,
      date: req.body.date || movies[index].date,
      rating: req.body.rating ? parseFloat(req.body.rating) : movies[index].rating
    };
    
    if (req.file) {
      // Si hay una imagen anterior, la eliminamos
      if (movies[index].image && movies[index].image.startsWith('/uploads/')) {
        const oldImagePath = path.join(__dirname, movies[index].image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updatedMovie.image = `/uploads/${req.file.filename}`;
    }
    
    movies[index] = updatedMovie;
    saveMovies(movies);
    
    res.json(updatedMovie);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/movies/:id', (req, res) => {
  try {
    const movies = getMovies();
    const index = movies.findIndex(m => m.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Película no encontrada' });
    }
    
    // Eliminar la imagen si existe
    if (movies[index].image && movies[index].image.startsWith('/uploads/')) {
      const imagePath = path.join(__dirname, movies[index].image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    movies.splice(index, 1);
    saveMovies(movies);
    
    res.json({ message: 'Película eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta para agregar opiniones
app.post('/api/movies/:id/opinions', (req, res) => {
  try {
    const movies = getMovies();
    const index = movies.findIndex(m => m.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Película no encontrada' });
    }
    
    const movie = movies[index];
    
    // Verificar si ya hay 3 opiniones
    if (movie.opinions.length >= 3) {
      return res.status(400).json({ error: 'Esta película ya tiene 3 opiniones' });
    }
    
    const newOpinion = {
      id: Date.now().toString(),
      user: req.body.user,
      rating: parseFloat(req.body.rating),
      comment: req.body.comment
    };
    
    movie.opinions.push(newOpinion);
    saveMovies(movies);
    
    res.status(201).json(newOpinion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Servir el archivo index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});