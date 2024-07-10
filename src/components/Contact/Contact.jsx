import React from 'react';
import './contact.css'
import { FaSquareFacebook } from "react-icons/fa6";
import { FaSquareInstagram } from "react-icons/fa6";
import { FaSquareWhatsapp } from "react-icons/fa6";
import Footer from '../commen/Footer';
import { FaHome } from "react-icons/fa";
import { IoIosArrowForward } from "react-icons/io";
import { Link } from 'react-router-dom';
import Navbar from '../commen/Navbar.jsx'


const Contact = () => {
    return (
        <>
            <div className="serviceDetail_container">
                <div className="serviceDetail_bg">
                    <Navbar/>
                    <div className="serviceDetail_head_container">
                        <div className="d-flex">
                            <Link to="/" style={{ textDecoration: "none", color: "#fff" }}>
                                <div className='d-flex'>
                                    <FaHome style={{ fontSize: "20px", margin: "0 13px" }} />
                                    <h6 style={{ margin: "0 6px" }}>HOME</h6>
                                </div>
                            </Link>
                            <Link to="/contact" style={{ textDecoration: "none", color: "#fff" }}>
                                <div className='d-flex'>
                                    <IoIosArrowForward style={{ fontSize: "18px", margin: "0 13px" }} />
                                    <h6>CONTACT</h6>
                                </div>
                            </Link>
                        </div>
                        <h1>Contact</h1>
                    </div>
                </div>
            </div>
            <div>
                <div className="contact-container py-4 my-4">
                    <div className="contact-info">
                        <p className='heading'>CONTACT</p>
                        <h1>Get In Touch</h1>
                        <p>Connect with us today for expert tax consulting services tailored to your needs. Our dedicated team is here to provide personalized solutions that ensure your financial goals are met with precision and peace of mind.</p>
                        <div className="contact-details">
                            <img src="https://via.placeholder.com/150" alt="Pajakin logo" className="logo" />
                            <div className="contact-items">
                                <div className="contact-item">
                                    <h2>Contact</h2>
                                    <p>021 Hollywood Boulevard, LA, Neque sed pretium</p>
                                    <p>customer@example.com</p>
                                    <p>(021) 345-6789</p>
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
                        <p>Use our contact form below to get started on optimizing your financial strategy with confidence.</p>
                        <form action="#" method="post">
                            <input type="text" name="name" placeholder="Name" required />
                            <input type="email" name="email" placeholder="Email" required />
                            <textarea name="message" placeholder="Message" required></textarea>
                            <button type="submit">Send Message</button>
                        </form>
                    </div>
                </div>
                <div className="map-container">
                    <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d62864.15576602335!2d77.42217152815937!3d10.016053938046772!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b071353e94a7877%3A0x962bf8fd53981722!2sTheni%2C%20Tamil%20Nadu!5e0!3m2!1sen!2sin!4v1720262871861!5m2!1sen!2sin"
                        width="100%"
                        height="450"
                        allowFullScreen=""
                        loading="lazy"
                        style={{ border: 0 }}
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Google Map"
                    ></iframe>
                </div>
            </div>
            <Footer />
        </>
    )
}

export default Contact;