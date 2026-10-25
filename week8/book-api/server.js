const express = require('express');
const app = express();
app.use(express.json());
let books = [
  { id: 1, title: 'Wings of Fire', author: 'APJ Abdul Kalam' },
  { id: 1, title: 'Wings of Fire', author: 'APJ Abdul Kalam' },{ id: 1, title: 'Wings of Fire', author: 'APJ Abdul Kalam' } 
];
// Get all books
app.get('/books', (req, res) => {
  res.json(books);
});
// Get one book
app.get('/books/:id', (req, res) => {
  const book = books.find(b => b.id === Number(req.params.id));
  if (!book) return res.status(404).send('Book not found');
  res.json(book);
});
// Add a book
app.post('/books', (req, res) => {
  books.push(req.body);
  res.send('Book added');
});
// Update a book
app.put('/books/:id', (req, res) => {
  const i = books.findIndex(b => b.id === Number(req.params.id));
  if (i === -1) return res.status(404).send('Book not found');
  books[i] = { ...req.body, id: Number(req.params.id) };
  res.send('Book updated');
});
// Delete a book
app.delete('/books/:id', (req, res) => {
  books = books.filter(b => b.id !== Number(req.params.id));
  res.send('Book deleted');
});
app.listen(3000, () => {
  console.log('Server running on port 3000');
});