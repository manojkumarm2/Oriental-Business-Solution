import React from 'react';
import './service.css';
import { FaHome } from "react-icons/fa";
import { IoIosArrowForward } from "react-icons/io";
import { Link } from 'react-router-dom';
import TaxServices from './TaxServices';
import Footer from '../commen/Footer';
import Navbar from '../commen/Navbar';
// import TaxServices from './TaxServices';

const Services = () => {

    return (
        <>
            <div className="service_container">
                <div className="service_bg">
                    <Navbar />
                    <div className="service_head_container">
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
                                        }}
                                    >
                                        HOME
                                    </h6>
                                </div>
                            </Link>
                            <Link
                                to="/service"
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
                                    <h6>OUR SERVICES</h6>
                                </div>
                            </Link>
                        </div>
                        <h1>Our Services</h1>
                    </div>
                </div>
            </div>
            {/* OUR TAX SERVICES START*/}
            <TaxServices />
            {/* OUR TAX SERVICES END */}

            <Footer />

        </>
    )
}

export default Services;