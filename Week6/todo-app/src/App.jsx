
import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [activities, setActivities] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("studentActivities")) || [];
    } catch {
      return [];
    }
  });

  const [activity, setActivity] = useState("");

  useEffect(() => {
    localStorage.setItem("studentActivities", JSON.stringify(activities));
  }, [activities]);

  const addActivity = (e) => {
    e.preventDefault();

    if (!activity.trim()) return;

    setActivities([
      ...activities,
      {
        id: Date.now(),
        name: activity.trim(),
        completed: false,
      },
    ]);

    setActivity("");
  };

  const toggleActivity = (id) => {
    setActivities((current) =>
      current.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const deleteActivity = (id) => {
    setActivities((current) => current.filter((item) => item.id !== id));
  };

  const completedCount = activities.filter((item) => item.completed).length;

  return (
    <main className="app">
      <header className="header">
        <p className="eyebrow">STUDENT PLANNER</p>
        <h1>Daily Activities</h1>
        <p className="subtitle">Organize your day and keep track of your progress.</p>
      </header>

      <section className="summary">
        <div>
          <span className="summary-number">{activities.length}</span>
          <span className="summary-label">Total Activities</span>
        </div>
        <div>
          <span className="summary-number">{completedCount}</span>
          <span className="summary-label">Completed</span>
        </div>
        <div>
          <span className="summary-number">
            {activities.length - completedCount}
          </span>
          <span className="summary-label">Remaining</span>
        </div>
      </section>

      <section className="card">
        <h2>Add an Activity</h2>

        <form onSubmit={addActivity} className="activity-form">
          <input
            type="text"
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            placeholder="e.g. Complete assignment"
            aria-label="Activity name"
          />
          <button type="submit">Add Activity</button>
        </form>
      </section>

      <section className="card">
        <div className="list-heading">
          <h2>My Activities</h2>
          <span>{completedCount} of {activities.length} completed</span>
        </div>

        {activities.length === 0 ? (
          <p className="empty-state">
            No activities added yet. Add your first activity above.
          </p>
        ) : (
          <ul className="activity-list">
            {activities.map((item) => (
              <li className="activity-item" key={item.id}>
                <label className="activity-info">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => toggleActivity(item.id)}
                  />
                  <span className={item.completed ? "completed" : ""}>
                    {item.name}
                  </span>
                </label>

                <button
                  className="delete-button"
                  onClick={() => deleteActivity(item.id)}
                  aria-label={`Delete ${item.name}`}
                  type="button"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default App;