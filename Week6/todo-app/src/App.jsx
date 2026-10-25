import { useState, useEffect } from 'react';

function App() {
  const [task, setTask] = useState('');
  const [tasks, setTasks] = useState(
    JSON.parse(localStorage.getItem('tasks') || '[]')
  );

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  function addTask() {
    if (task.trim() !== '') {
      setTasks([...tasks, task]);
      setTask('');
    }
  }

  function deleteTask(index) {
    setTasks(tasks.filter((_, i) => i !== index));
  }

  return (
    <div>
      <h2>ToDo App</h2>

      <input
        value={task}
        onChange={e => setTask(e.target.value)}
        placeholder="Enter task"
      />

      <button onClick={addTask}>Add</button>

      {tasks.map((t, i) => (
        <p key={i}>
          {t} <button onClick={() => deleteTask(i)}>Delete</button>
        </p>
      ))}
    </div>
  );
}

export default App;