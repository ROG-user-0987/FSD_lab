function About() {
  return (
    <div className="page">
      <h1>About Us</h1>

      <p>
        Harmony Music School is a place where students of all ages can learn
        music from experienced instructors.
      </p>

      <h2>Our Teachers</h2>

      <div className="cards">
        <div className="card">
          <h3>John Stalin</h3>
          <h4>Piano Instructor</h4>
          <p>12+ years of experience in piano performance and music theory.</p>
        </div>

        <div className="card">
          <h3>Sanjana Chinamuthevi</h3>
          <h4>Vocal Instructor</h4>
          <p>10+ years of experience in classical and contemporary vocals.</p>
        </div>

        <div className="card">
          <h3>Sam Blessy</h3>
          <h4>Guitar Instructor</h4>
          <p>5+ years of experience teaching acoustic and electric guitar.</p>
        </div>

        <div className="card">
          <h3>Sriram Aditya Sai</h3>
          <h4>Drums Instructor</h4>
          <p>12+ years of experience in drums, rhythm and live performance.</p>
        </div>
      </div>
    </div>
  );
}

export default About;