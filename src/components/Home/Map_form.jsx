import React from "react";
import { useState } from "react";
import emailjs from "emailjs-com";

const Map_form = () => {

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    emailjs
      .sendForm(
        "service_cvl7sc5",
        "template_os2q2lp",
        e.target,
        "gccmS9ZmpmZjxvX7Z"
      )
      .then(
        (result) => {
          console.log(result.text);
          alert("Message sent successfully!");
        },
        (error) => {
          console.log(error.text);
          alert("Failed to send the message, please try again.");
        }
      );

    e.target.reset();
  };

  return (
    <>
      <div className="container">
        <div className="row m-0 py-4">
          <div className="col-12 col-md-6 mt-3 ">
            <iframe
              className="home_map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2889.4471835333743!2d-79.63857822240347!3d43.59722987110489!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x882b473b287e3351%3A0xc4338c578acef23e!2sMississauga%20Tax%20Consulting%20-%20International%20Tax%20-%20US%20Tax%20-%20Corporate%20Tax%20-%20Personal%20Tax!5e0!3m2!1sen!2sca!4v1720753694958!5m2!1sen!2sca"
              style={{
                border: '0',
                width: '100%',
              }}
              allowfullscreen=""
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
            >
            </iframe>
          </div>
          <div
            className="col-12 col-md-6 mt-3 p-4 home_contact_form"
            style={{
              background: '#fff',
              color: "black",
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
            }}
          >
            <h2>Send A Message</h2>
            <p>
              Use our contact form below to get started on optimizing your
              financial strategy with confidence.
            </p>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="name"
                placeholder="Name"
                required
                value={formData.name}
                onChange={handleChange}
                style={{
              background: '#fff',
              color: "black",
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              border:"none"
            }}
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                required
                value={formData.email}
                onChange={handleChange}
                style={{
              background: '#fff',
              color: "black",
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              border:"none"
            }}
              />
              <textarea
                name="message"
                placeholder="Message"
                required
                value={formData.message}
                onChange={handleChange}
                style={{
              background: '#fff',
              color: "black",
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              border:"none"
            }}
              ></textarea>
              <button type="submit">Send Message</button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Map_form;
