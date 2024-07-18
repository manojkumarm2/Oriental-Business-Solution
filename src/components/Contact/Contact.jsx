import React from "react";
import "./contact.css";
import { FaSquareFacebook } from "react-icons/fa6";
import { FaSquareInstagram } from "react-icons/fa6";
import { FaSquareWhatsapp } from "react-icons/fa6";
import Footer from "../commen/Footer";
import { FaHome } from "react-icons/fa";
import { IoIosArrowForward } from "react-icons/io";
import { Link } from "react-router-dom";
import Navbar from "../commen/Navbar";
import { useState } from "react";
import emailjs from "emailjs-com";
import Logo from "../../Assets/contactlogo.jpg";
import {toast } from "react-toastify";
import { AppConfig } from '../../config/app.config'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    interest: "",
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

    const { name, email, interest, message } = formData;

    if (name && email && interest && message) {
      emailjs
        .sendForm(
            AppConfig.email.service,
            AppConfig.email.contact_template,
            e.target,
            AppConfig.email.publicKey
        )
        .then(
          (result) => {
            console.log(result.text);
            toast.success("Message sent successfully!");
            setFormData({ name: "", email: "", service: "", message: "" }); // Reset form data
          },
          (error) => {
            console.log(error.text);
            toast.error("Failed to send the message, please try again.");
          }
        );
    } else {
      toast.warn("Please fill in all fields.");
    }
  };

  return (
    <>
      <div className="service_container">
        <div className="service_bg">
          <Navbar />
          <div className="service_head_container">
            <div className="d-flex">
              <Link to="/" style={{ textDecoration: "none", color: "#fff" }}>
                <div className="d-flex">
                  <FaHome style={{ fontSize: "20px", margin: "0 13px" }} />
                  <h6 style={{ margin: "0 6px" }}>HOME</h6>
                </div>
              </Link>
              <Link to="/contact" style={{ textDecoration: "none", color: "#fff" }}>
                <div className="d-flex">
                  <IoIosArrowForward style={{ fontSize: "18px", margin: "0 13px" }} />
                  <h6>CONTACT</h6>
                </div>
              </Link>
            </div>
            <h1>Contact</h1>
          </div>
        </div>
      </div>

      <div className="contact-container py-4 my-4">
        <div className="contact-info">
          <p className="heading">CONTACT</p>
          <h1>Get In Touch</h1>
          <p>
            Connect with us today for expert tax consulting services tailored to
            your needs. Our dedicated team is here to provide personalized
            solutions that ensure your financial goals are met with precision
            and peace of mind.
          </p>
          <div className="contact-details">
            <img src={Logo} alt="oriental business solution logo" className="logo" />
            <div className="contact-items">
              <div className="contact-item">
                <h2>Contact</h2>
                <p>4 Robert Speck Pkwy #1500, Mississauga, ON L4Z 1S1</p>
                <p>info@orientalbusinesssolutions.ca</p>
                <p>(647) 855-6177</p>
              </div>
              <div className="social-icons">
                <FaSquareFacebook />
                <FaSquareInstagram />
                <FaSquareWhatsapp />
              </div>
            </div>
          </div>
        </div>
        <div className="contact-form">
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
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              required
              value={formData.email}
              onChange={handleChange}
            />
            <select
              className="form-select"
              name="interest"
              required
              value={formData.interest}
              onChange={handleChange}
            >
              <option value="" disabled>
                Select a service
              </option>
              <option value="Tax Consulting">Tax Consulting</option>
              <option value="Bookkeeping Services">Bookkeeping Services</option>
              <option value="Taxes">Taxes</option>
              <option value="Business Registration">Business Registration</option>
              <option value="Loans & Mortgages">Loans & Mortgages</option>
              <option value="Rental Property HST Rebates">Rental Property HST Rebates</option>
              <option value="Auditing">Auditing</option>
              <option value="Payroll Management">Payroll Management</option>
              <option value="Tax Planning and Reporting">Tax Planning and Reporting</option>
              <option value="Legally Required">Legally Required</option>
            </select>
            <textarea
              name="message"
              placeholder="Message"
              required
              value={formData.message}
              onChange={handleChange}
            ></textarea>
            <button type="submit">Send Message</button>
          </form>
        </div>
      </div>
      <div className="map-container">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2889.4471835333743!2d-79.63857822240347!3d43.59722987110489!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x882b473b287e3351%3A0xc4338c578acef23e!2sMississauga%20Tax%20Consulting%20-%20International%20Tax%20-%20US%20Tax%20-%20Corporate%20Tax%20-%20Personal%20Tax!5e0!3m2!1sen!2sca!4v1720753694958!5m2!1sen!2sca"
          width="100%"
          height="450"
          allowFullScreen=""
          loading="lazy"
          style={{ border: 0 }}
          referrerPolicy="no-referrer-when-downgrade"
          title="Google Map"
        ></iframe>
      </div>

      <Footer />
    </>
  );
};

export default Contact;

