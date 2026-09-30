
const express = require("express");
const app = express();

app.use(express.json());

let books = [
  { id: 1, title: "The Alchemist", author: "Paulo Coelho" },
  { id: 2, title: "Atomic Habits", author: "James Clear" }
];

// Get all books
app.get("/books", (req, res) => {
  res.json(books);
});

// Get a book by ID
app.get("/books/:id", (req, res) => {
  const book = books.find(b => b.id === Number(req.params.id));

  if (!book) return res.status(404).json({ message: "Book not found" });

  res.json(book);
});

// Add a new book
app.post("/books", (req, res) => {
  const { title, author } = req.body;

  if (!title || !author) {
    return res.status(400).json({ message: "Title and author are required" });
  }

  const newBook = {
    id: books.length ? Math.max(...books.map(b => b.id)) + 1 : 1,
    title,
    author
  };

  books.push(newBook);
  res.status(201).json(newBook);
});

// Update a book
app.put("/books/:id", (req, res) => {
  const book = books.find(b => b.id === Number(req.params.id));

  if (!book) return res.status(404).json({ message: "Book not found" });

  const { title, author } = req.body;

  if (!title || !author) {
    return res.status(400).json({ message: "Title and author are required" });
  }

  book.title = title;
  book.author = author;

  res.json(book);
});

// Delete a book
app.delete("/books/:id", (req, res) => {
  const index = books.findIndex(b => b.id === Number(req.params.id));

  if (index === -1) {
    return res.status(404).json({ message: "Book not found" });
  }

  const deletedBook = books.splice(index, 1);
  res.json({ message: "Book deleted", book: deletedBook[0] });
});
app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});