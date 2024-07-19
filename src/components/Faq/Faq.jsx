import React from 'react';
import { FaHome } from "react-icons/fa";
import { IoIosArrowForward } from "react-icons/io";
import { Link } from 'react-router-dom';
import Navbar from "../Common/Navbar.jsx";
import FaqQuestions from './FaqQuestions.jsx';
import Footer from '../Common/Footer.jsx';

const Faq = () => {
    return (
        <>
            <div className="faq_container">
                <div className="faq_bg">
                    <Navbar />
                    <div className="faq_head_container">
                        <div className="d-flex">
                            <Link
                                to="/"
                                style={{
                                    textDecoration: "none",
                                    color: "#fff"
                                }}
                            >
                                <div className='d-flex'>
                                    <FaHome
                                        style={{
                                            fontSize: "20px",
                                            margin: "0 13px"
                                        }}
                                    />
                                    <h6
                                        style={{
                                            margin: "0 6px"
                                        }}>
                                        HOME
                                    </h6>
                                </div>
                            </Link>
                            <Link
                                to="/faq"
                                style={{
                                    textDecoration: "none",
                                    color: "#fff"
                                }}
                            >
                                <div className='d-flex'>
                                    <IoIosArrowForward
                                        style={{
                                            fontSize: "18px",
                                            margin: "0 13px"
                                        }}
                                    />
                                    <h6>FAQ</h6>
                                </div>
                            </Link>
                        </div>
                        <h1>FAQ</h1>
                    </div>
                </div>
            </div>
            {/* FAQ QUESTIONS START */}
            <FaqQuestions />
            {/* Footer */}
            <Footer />
        </>
    )
}

export default Faq;