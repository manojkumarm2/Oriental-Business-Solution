import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import img1 from '../../Assets/service/taxconsult.jpg';
import img2 from '../../Assets/service/bookkeeping.jpg';
import img3 from '../../Assets/service/taxpersonal.jpg';
import img4 from '../../Assets/service/businessregi.jpg';

import img5 from '../../Assets/service/Loans.jpg';
import img6 from '../../Assets/service/RentalProperty.jpg';

import img7 from '../../Assets/service/auditing.jpg';
import img8 from '../../Assets/service/payroll.jpg';
import img9 from '../../Assets/service/planning.jpg';
import img10 from '../../Assets/service/corporatedocum.jpg';
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import AOS from 'aos';
import 'aos/dist/aos.css';
// import { useEffect, useRef } from 'react';

const TaxServices = () => {

    const taxserviceCartRight = [
        { id: 1, title: "Tax Consulting", img: img1, desc: "Personalized strategies to optimize your tax liabilities and ensure compliance...",path: "", detail: "View Detail" },
        { id: 2, title: "Bookkeeping Services", img: img2, desc: "Accurate and efficient tracking of your financial transactions and records...", path: " ", detail: "View Detail" },
        { id: 3, title: "Taxes", img: img3, desc: "Comprehensive tax services tailored for individuals, businesses, and corporations...", path: " ", detail: "View Detail" },
        { id: 4, title: "Business Registration", img: img4, desc: "Streamlined assistance in registering and structuring your new business...", path: " ", detail: "View Detail" },
        { id: 5, title: "Loans & Mortgages", img: img5, desc: "Navigating the complexities of loans and mortgages can be challenging...", path: " ", detail: "View Detail" },
    ];
    const taxserviceCartLeft = [
        { id: 6, title: "Rental Property HST Rebates", img: img6, desc: "Owning rental property in Canada can be a lucrative investment, but it's... ", path: " ", detail: "View Detail" },
        { id: 7, title: "Auditing", img: img7, desc: "Thorough examinations of your financial statements to ensure accuracy and compliance...", path: " ", detail: "View Detail" },
        { id: 8, title: "Payroll Management", img: img8, desc: "Efficient and reliable payroll processing and compliance services...", path: " ", detail: "View Detail" },
        { id: 9, title: "Tax Planning and Reporting", img: img9, desc: "Strategic financial planning and detailed reporting for informed decision-making...", path: " ", detail: "View Detail" },
        { id: 10, title: "Legally Required", img: img10, desc: "Expert preparation and management of essential corporate documents to...", path: " ", detail: "View Detail" },
    ];

    // const bottomSectionRef = useRef(null);

    // useEffect(() => {
    //     if (bottomSectionRef.current) {
    //         bottomSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    //     }
    // }, []);

    useEffect(() => {
        AOS.init(({ duration: 2000 }))
    }, [])

    return (
        <>
            <div className="taxservices" >
                <div className="taxservices_bg py-5">
                    <div className="taxservices_head_container py-5 d-flex justify-content-center">
                        <div
                            className="taxservices_head_item col-12 col-md-10 col-lg-6"
                            data-aos="fade-up"
                        >
                            <h6
                                className='text-center'
                                style={{
                                    color: "#4A6EC9"
                                }}
                            >
                                SERVICES
                            </h6>
                            <h2 className='text-center' >Our Tax Services</h2>
                            <p className='text-center taxservices_para pt-3 ' >
                                Expert tax planning, preparation, and compliance services tailored to your unique
                                needs for optimal financial outcomes.
                            </p>
                        </div>
                    </div>
                    <div className="container-xxl">
                        <div className="row justify-content-center">
                            <div className="col-11 col-md-5 p-0 mx-2">
                                {
                                    taxserviceCartRight.map((cartRight) => (
                                        <div
                                            key={cartRight.id}
                                            className="col-12 p-0 mb-3 TaxServices_cartRight"
                                            data-aos="flip-right"
                                            style={{
                                                background: "#fff",
                                                boxShadow: "0px 10px 30px 0px rgba(0, 0, 0, 0.05)"
                                            }}
                                        >
                                            <div
                                                className="d-lg-flex flex-lg-row  p-0 m-0"
                                                style={{
                                                    width: "100%"
                                                }}
                                            >
                                                <div className="col-md-12 col-lg-6 p-0 m-0">
                                                    <img
                                                        src={cartRight.img}
                                                        alt="taxImage"
                                                        height="100%"
                                                        width="100%"
                                                    />
                                                </div>
                                                <div
                                                    className="col-md-12 col-lg-6 p-4"
                                                    style={{
                                                        color: "black",
                                                        
                                                    }}
                                                >
                                                    <h4 className='pt-3'>{cartRight.title}</h4>
                                                    <p
                                                        className='py-2'
                                                        style={{
                                                            
                                                            color: "#02113799"
                                                        }}
                                                    >
                                                        {cartRight.desc}
                                                    </p>
                                                    <Link
                                                        to={`/servicedetails/${cartRight.id}`}
                                                        style={{
                                                            textDecoration: "none",
                                                            color: "#4A6EC9",
                                                            fontWeight: 700
                                                        }}
                                                    >
                                                        <p className='taxservice_detail'>
                                                            {cartRight.detail} <MdOutlineKeyboardArrowRight
                                                                style={{
                                                                    fontSize: "20px"
                                                                }}
                                                            />
                                                        </p>
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>

                            <div className="col-11 col-md-5 p-0 mx-2">
                                {
                                    taxserviceCartLeft.map((cartLeft) => (
                                        <div
                                            key={cartLeft.id}
                                            className="col-12 p-0 mb-3 TaxServices_cartLeft"
                                            data-aos="flip-left"
                                            style={{
                                                background: "#fff",
                                                boxShadow: "0px 10px 30px 0px rgba(0, 0, 0, 0.05)"
                                            }}
                                        >
                                            <div
                                                className="d-lg-flex flex-lg-row  p-0 m-0"
                                                style={{
                                                    width: "100%"
                                                }}
                                            >
                                                <div
                                                    className="col-md-12 col-lg-6 p-4"
                                                    style={{
                                                        color: "black"
                                                    }}
                                                >
                                                    <h4 className='pt-3'>{cartLeft.title}</h4>
                                                    <p
                                                        className='py-2'
                                                        style={{
                                                            color: "#02113799"
                                                        }}
                                                    >
                                                        {cartLeft.desc}
                                                    </p>
                                                    <Link
                                                        to={`/servicedetails/${cartLeft.id}`}
                                                        style={{
                                                            textDecoration: "none",
                                                            color: "#4A6EC9",
                                                            fontWeight: 700
                                                        }}
                                                    >
                                                        <p className='taxservice_detail'>
                                                            {cartLeft.detail} <MdOutlineKeyboardArrowRight
                                                                style={{
                                                                    fontSize: "20px"
                                                                }}
                                                            />
                                                        </p>
                                                    </Link>
                                                </div>
                                                <div className="col-md-12 col-lg-6 p-0 m-0">
                                                    <img
                                                        src={cartLeft.img}
                                                        alt="taxImage"
                                                        height="100%"
                                                        width="100%"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default TaxServices;