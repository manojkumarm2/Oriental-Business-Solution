import React, { useRef, useState } from "react";
import "./contact.css";
import { FaHome } from "react-icons/fa";
import { IoIosArrowForward } from "react-icons/io";
import { Link } from "react-router-dom";
import Navbar from "../Common/Navbar";
import emailjs from "emailjs-com";
import Logo from "../../Assets/contactlogo.png";
import indiaFlag from "../../Assets/locations/india-flag.png";
import usaFlag from "../../Assets/locations/usa-flag.png";
import canadaFlag from "../../Assets/locations/canada-flag.png";
import Footer from "../Common/Footer";
import { toast } from "react-toastify";
import { APP_CONFIG } from "../../config/app.config";
import { commenIcon } from "../../data/CommenIcon";

const Contact = () => {
  const formRef = useRef();

  const [formSubmitted, setFormSubmitted] = useState(false);

  const validateForm = (formValues) => {
    const errors = {};
    for (const [key, value] of Object.entries(formValues)) {
      if (value?.trim() === "") {
        errors[key] = `${key} is required`;
      }
    }
    return errors;
  };

  const footerMenu = {
    id: 3,
    title: "Contact",
    list: [
      {
        listTitle: "ashok@orientalbiz.ca",
        path: "mailto:ashok@orientalbiz.ca",
      },
      {
        listTitle: APP_CONFIG.email,
        path: APP_CONFIG.emailLink,
      },
      {
        listTitle: APP_CONFIG.phone,
        path: APP_CONFIG.phoneLink,
      },
    ],
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(formRef.current);
    const formValues = Object.fromEntries(formData.entries());
    let formValid = true;
    const errors = validateForm(formValues);
    if (Object.keys(errors).length > 0) {
      formValid = false;
    }

    if (formValid) {
      setFormSubmitted(true);
      const emailConfig = APP_CONFIG.emailJs;
      const { service, contact_template, publicKey } = emailConfig;
      emailjs
        .sendForm(service, contact_template, formRef.current, publicKey)
        .then(
          (result) => {
            console.log(result.text);
            toast.success("Message sent successfully!");
            formRef.current.reset();
            setFormSubmitted(false);
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
      <div className="contact0_container">
        <div className="contact_bg">
          <Navbar />
          <div className="contact_head_container">
            <div className="d-flex">
              <Link to="/" style={{ textDecoration: "none", color: "#fff" }}>
                <div className="d-flex">
                  <FaHome style={{ fontSize: "20px", margin: "0 13px" }} />
                  <h6 style={{ margin: "0 6px" }}>HOME</h6>
                </div>
              </Link>
              <Link
                to="/contact"
                style={{ textDecoration: "none", color: "#fff" }}
              >
                <div className="d-flex">
                  <IoIosArrowForward
                    style={{ fontSize: "18px", margin: "0 13px" }}
                  />
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
            <div className="business-hours">
              <h2>Business Hours</h2>
              <p>Monday - Thursday: 9:30am - 8:00pm</p>
              <p>Friday: 9:00am - 9:30pm</p>
              <p>Saturday: 8:30am - 10:30pm</p>
              <p>Sunday: 9:00am – 12:00pm</p>
            </div>
            <div className="contact-items">
              <div className="contact-item">
                <h2>Contact</h2>
                {footerMenu.list.map((footerList) => (
                  <p>
                    <Link
                      to={footerList.path}
                      key={footerList.listTitle}
                      target={footerList.type || ""}
                    >
                      {footerList.listTitle}
                    </Link>
                  </p>
                ))}
              </div>
              <div className="social-item">
                <h2>Follow Us</h2>
                <p>Stay connected with us on social media</p>
              </div>
              <div className="social-icons">
                {commenIcon.map((icon) => (
                  <Link key={icon.id} to={icon.path} target="_blank">
                    {icon.icon}
                  </Link>
                ))}
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
          <form ref={formRef} onSubmit={handleSubmit}>
            <input type="text" name="name" placeholder="Name" required />
            <input type="email" name="email" placeholder="Email" required />
            <select className="form-select" name="service" required>
              <option value="" disabled>
                Select a service
              </option>
              <option value="Tax Consulting">Tax Consulting</option>
              <option value="Bookkeeping Services">Bookkeeping Services</option>
              <option value="Taxes">Taxes</option>
              <option value="Business Registration">
                Business Registration
              </option>
              <option value="Loans & Mortgages">Loans & Mortgages</option>
              <option value="Rental Property HST Rebates">
                Rental Property HST Rebates
              </option>
              <option value="Auditing">Auditing</option>
              <option value="Payroll Management">Payroll Management</option>
              <option value="Tax Planning and Reporting">
                Tax Planning and Reporting
              </option>
              <option value="Legally Required">Legally Required</option>
            </select>
            <textarea name="message" placeholder="Message" required></textarea>
            <button disabled={formSubmitted} type="submit">
              Send Message
            </button>
          </form>
        </div>
      </div>
      <div className="location-container">
        <h2>Our Locations</h2>
        <div className="locations-flex">
          <div className="location">
            <div className="location-logo">
              <img src={canadaFlag} alt="Canada Flag" className="flag-icon" />
              <h5>Canada HQ</h5>
            </div>
            <p>Corporate House</p>
            <p>1450 Meyerside Dr, Mississauga, ON L5T 2N5</p>
            <p>Phone: {APP_CONFIG.phone}</p>
            <p>Email: {APP_CONFIG.email}</p>
          </div>
          <div className="location">
            <div className="location-logo">
              <img src={canadaFlag} alt="Canada Flag" className="flag-icon" />
              <h5>Brampton, Canada</h5>
            </div>
            <p>80 Culture Cres, Brampton, ON, L6X 5A2.</p>
          </div>
          <div className="location">
            <div className="location-logo">
              <img src={usaFlag} alt="USA Flag" className="flag-icon" />
              <h5>USA</h5>
            </div>
            <p>1500 WHITE BIRCH TER FREMONT, CA – 94536</p>
            <p>Email: {APP_CONFIG.email}</p>
          </div>
          <div className="location">
            <div className="location-logo">
              <img src={indiaFlag} alt="India Flag" className="flag-icon" />
              <h5>India</h5>
            </div>
            <p>Oriental Business Solutions Pvt Ltd</p>
            <p>154 Shivani Palace, Revathipuram 4th Street, Urappakkam, Chennai 603210.</p>
          </div>
        </div>
        <iframe
          src={APP_CONFIG.gmapLink}
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
