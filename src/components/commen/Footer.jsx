import React from 'react';
import { IoMail } from "react-icons/io5";
import { FaLocationDot } from "react-icons/fa6";
import { FaPhoneAlt } from "react-icons/fa";
import { commenIcon } from '../../data/CommenIcon.jsx';
import CopyRights from './CopyRights';
import { Link } from 'react-router-dom';

const Footer = () => {

    const footerMenu = [
        {
            id: 1,
            title: "Quick Menu",
            list: [
                { listTitle: "Home", path: "/" },
                { listTitle: "About", path: "/about" },
                { listTitle: "Services", path: "/service" },
                { listTitle: "Contact", path: "/contact" },
                { listTitle: "Blog", path: "/blog" },
                { listTitle: "FAQ", path: "/faq" },
            ]
        },
        {
            id: 2,
            title: "Services",
            list: [
                { listTitle: "Corparate Services", path: "/" },
                { listTitle: "Personal Services", path: "/" },
                { listTitle: "Legalisation", path: "/" },
                { listTitle: "Mobile Notary", path: "/" },
                { listTitle: "Transalation", path: "/" },
                { listTitle: "Authentication", path: "/" },
            ]
        },
        {
            id: 3,
            title: "Contact",
            list: [
                { listTitle: "021 Hollewood Bolwerd,LA", icon: <FaLocationDot /> },
                { listTitle: "Customer@example.com", icon: <IoMail /> },
                { listTitle: "(021)345-6789", icon: <FaPhoneAlt /> },
            ]
        },
    ]

    return (
        <>
            <div className='py-5' style={{ background: "#021137", color: "#fff" }}>
                <div className="container" >
                    {/* <div className="row m-0 py-4 mb-4">
                        <div className="col-md-6">
                            <h1 data-aos="slide-right">Join Our Newsletter</h1>
                            <p data-aos="slide-right">
                                Aenean haretra quam placerat adipiscing penatibus aliquam adipiscing
                                gravida elementum aliquet eget senectus felis enim diam molestie.
                            </p>
                        </div>
                        <div className="col-md-6">
                            <input
                                style={{ outline: "none" }}
                                className='w-100 py-3 px-3'
                                type="email"
                                placeholder='Enter Your Email Address'
                            />
                            <button
                                className='d-block w-100 my-3 py-3 px-3 fw-bold border-0'
                                style={{ background: "#fcb44c", color: "#021137" }}>Subscribe Now <IoMail />
                            </button>
                        </div>
                    </div> */}
                    <div className="row m-0 pt-5"
                        // style={{ borderTop: "1px solid rgb(88 117 192 / 59%)" }}
                    >
                        <div className="col-12 col-md-6 col-lg-5 pt-3">
                            <p className='py-4' data-aos="fade-right">
                                Expert tax consultants offering personalized strategies for individuals and businesses,
                                ensuring compliance and maximizing financial efficiency.
                            </p>
                            <div className="d-flex">
                                {
                                    commenIcon.map((icon) => (
                                        <Link
                                            key={icon.id}
                                            className='footer_icon'
                                            style={{
                                                textDecoration: "none",
                                                color: "#fff",
                                                margin: "10px",
                                                padding: "10px",
                                                borderRadius: "50%",
                                                background: "rgb(74, 110, 201)",
                                                display: "flex",
                                                justifyContent: "center",
                                                alignItems: "center",

                                            }}
                                        >
                                            {icon.icon}
                                        </Link>
                                    ))
                                }
                            </div>
                        </div>
                        {
                            footerMenu.map((footerMenu, index) => (
                                <div className="col-12 col-md-6 col-lg-2 pt-3" key={footerMenu.id} >
                                    <h4 className='pb-3 text-nowrap'
                                        style={{
                                            paddingLeft: index === 0 || index === 1 ? "12px" : ""
                                        }}
                                    >
                                        {footerMenu.title}
                                    </h4>
                                    {
                                        footerMenu.list.map((footerList) => (
                                            <Link
                                                to={footerList.path}
                                                key={footerList.listTitle}
                                                data-aos="fade-up"
                                                style={{
                                                    textDecoration: "none",
                                                    color: "#fff",
                                                }}
                                            >
                                                <div className="col-12 col-md-6 col-lg-2 d-flex m-0 " >
                                                    <p className='d-block pe-3' >{footerList.icon}</p>
                                                    <p className='text-nowrap'>{footerList.listTitle}</p>
                                                </div>
                                            </Link>
                                        ))
                                    }
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div >
            <CopyRights />
        </>
    )
}

export default Footer;