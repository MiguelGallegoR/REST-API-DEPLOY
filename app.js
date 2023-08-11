const express = require("express");
const crypto = require("node:crypto"); // node crea id unico
const movies = require("./movies.json");
const cors = require('cors')
const { validateMovie, validatePartialMovie } = require('./schemas/movies');
const { error } = require("node:console");
const app = express();

app.use(express.json()); //Middleware que trae Express
app.disable("x-powered-by");

// CORS. EL NAVEGADOR PREGUNTA SI EL DOMINIO QUE ALOJA UN RECURSO TIENE O ESPERA QUE ESE OTRO DOMINIO PUEDA ACCEDER A ESOS DATOS.
//   SI NO ESTA INCLUIDO EL NAVEGADOR DEVUELVE ERROR CORS.(NO ESTA ACEPTADA ESA CABECERA)
// métodos normales: GET/HEAD/POST
// métodos complejos: PUT/PATCH/DELETE => CORS PRE-Flight => necesitan OPTIONS

app.use(cors({
  origin: (origin, callback) => {
    const ACCEPTED_ORIGINS = [
      'http://localhost:8080',
      'http://localhost:1234',
      'https://movies.com',
      'https://midu.dev'
    ]

    if (ACCEPTED_ORIGINS.includes(origin)) {
      return callback(null, true)
    }

    if (!origin) {
      return callback(null, true)
    }

    return callback(new Error('Not allowed by CORS'))
  }
}))


//Todos los recursos que sean movies se identefican con /movies
app.get("/movies", (req, res) => {
  const { genre } = req.query;
  if (genre) {
    const filteredMovies = movies.filter((movie) =>
      movie.genre.some((g) => g.toLowerCase() === genre.toLocaleLowerCase())
    );
    return res.json(filteredMovies);
  }
  res.json(movies);
});

app.get("/movies/:id", (req, res) => {
  const { id } = req.params;
  const movie = movies.find((movie) => movie.id === id);
  if (movie) return res.json(movie);

  res.status(404).json({ message: "Movie not found" });
});

app.post("/movies", (req, res) => {
  const result = validateMovie(req.body);


  if(result.error){
    res.status(400).json({ error:JSON.parse(result.error.message)})
  }

  const newMovie = {
    id: crypto.randomUUID(),
    ...result.data
  };


  //ESTO NO SERÍA REST PORQUE ESTAMOS GUARDANDO EL ESTADO EN MEMORIA
  movies.push(newMovie);
  res.status(201).json(newMovie) //actualizar la caché del cliente

});


app.patch("/movies/:id", (req, res) => {
  const result = validatePartialMovie(req.body)

  if(!result.success){
    res.status(400).json({error: JSON.parse(result.error.message)})
  }

  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)
  
  if(movieIndex === -1){
    return res.status(404).json({error: JSON.parse(result.error.message)})
  }

  const updateMovie = {
    ...movies[movieIndex],
    ...result.data
  }

  movies[movieIndex] = updateMovie

  return res.json(updateMovie)
})


app.delete('/movies/:id', (req, res) => {
  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  movies.splice(movieIndex, 1)

  return res.json({ message: 'Movie deleted' })
})

const PORT = process.env.PORT ?? 1234;

app.listen(PORT, () => {
  console.log(`server listening on port http://localhost:${PORT}`);
});
