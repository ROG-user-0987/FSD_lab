function Contact() {
  return (
    <div className="page">
      <h1>Contact Us</h1>

      <p>
        Interested in learning music? Get in touch with us and book your
        trial class.
      </p>

      <div className="contact-info">
        <p><strong>📍 Address:</strong> 25 Music Street, Hyderabad</p>
        <p><strong>📞 Phone:</strong> +91 98765 43210</p>
        <p><strong>✉ Email:</strong> info@harmonymusic.com</p>
      </div>

      <h2>Enquire Now</h2>

      <form>
        <input type="text" placeholder="Your Name" />
        <input type="email" placeholder="Your Email" />
        <input type="tel" placeholder="Phone Number" />

        <select>
          <option>Select an Instrument</option>
          <option>Guitar</option>
          <option>Piano</option>
          <option>Drums</option>
          <option>Violin</option>
          <option>Vocals</option>
          <option>Saxophone</option>
        </select>

        <textarea placeholder="Your Message"></textarea>

        <button type="submit">Send Enquiry</button>
      </form>
    </div>
  );
}

export default Contact;