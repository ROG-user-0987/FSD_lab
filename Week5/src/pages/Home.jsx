function Home() {
  return (
    <div className="page">
      <h1>Harmony Music School</h1>
      <p>Learn music. Find your rhythm. Create your sound.</p>

      <h2>Instruments You Can Learn</h2>

      <div className="cards">
        <div className="card">
          <h3>🎸 Guitar</h3>
          <p>Learn acoustic and electric guitar from beginner to advanced level.</p>
        </div>

        <div className="card">
          <h3>🎹 Piano</h3>
          <p>Learn piano, music theory, chords and popular songs.</p>
        </div>

        <div className="card">
          <h3>🥁 Drums</h3>
          <p>Develop your rhythm and learn different drumming techniques.</p>
        </div>

        <div className="card">
          <h3>🎻 Violin</h3>
          <p>Learn classical and contemporary violin techniques.</p>
        </div>

        <div className="card">
          <h3>🎤 Vocals</h3>
          <p>Improve your voice, pitch, breathing and singing techniques.</p>
        </div>

        <div className="card">
          <h3>🎷 Saxophone</h3>
          <p>Learn saxophone fundamentals and perform your favorite songs.</p>
        </div>
      </div>
    </div>
  );
}

export default Home;