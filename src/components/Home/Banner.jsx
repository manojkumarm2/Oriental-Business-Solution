import React from 'react'
import '../Home/Home.css';
import Navbar from '../commen/Navbar';


const Banner = () => {
    return (
        <>
            <div className="home_container">
                <div className="home_bg">
                    <Navbar />
                    <div className="home_head_container container" >
                        <div className=" home_content d-flex flex-column gap-3 position-relative" >
                            <h2 data-aos="flip-right" >Welcome to Oriental Business Solution  </h2>
                            <p
                                className="p1"
                                data-aos="slide-up"
                            >
                                Personalized accounting and tax preparation services.
                            </p>
                            <button
                                className="btn cta-btn p-2 mx-auto mx-md-0"
                                data-aos="fade-up"
                                data-aos-anchor-placement="top-bottom"
                                style={{
                                    background: '#ffb400',
                                    color: '#001d48',
                                    border: 'none',
                                    width: '250px',
                                    height: '50px'
                                }}
                            >
                                Get Started Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Banner;