
import React from "react";
import { IoMail } from "react-icons/io5";
import { FaLocationDot } from "react-icons/fa6";
import { FaPhoneAlt } from "react-icons/fa";
import { commenIcon } from "../../data/CommenIcon.jsx";
import CopyRights from "./CopyRights";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <>
      <div
        className="py-5 "
        style={{
          background: "rgb(74, 110, 201)",
          color: "#fff",
        }}
      >
        <div
          className="container "
          style={{
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div className="row m-0 pt-5">
            <div className="col-12 col-md-6 col-lg-5 pt-0">
              <p className="py-4">
                Expert tax consultants offering personalized strategies <br />{" "}
                for individuals and businesses, ensuring compliance and <br />{" "}
                maximizing financial efficiency.
              </p>
              <div className="d-flex footer_icon_container">
                {commenIcon.map((icon) => (
                  <Link key={icon.id} className="footer_icon">
                    {icon.icon}
                  </Link>
                ))}
              </div>
            </div>

            <div className="col-12 col-md-6 col-lg-2 pt-3 footerMenu_Container d-flex flex-column align-items-start gap-2">
              <h4 className="pb-3 text-nowrap">Quick Menu</h4>
              <Link to="/">Home</Link>
              <Link to="/about">About</Link>
              <Link to="/service">Services</Link>
              <Link to="/contact">Contact</Link>
              <Link to="/blog">Blog</Link>
              <Link to="/faq">FAQ</Link>
            </div>

            <div className="col-12 col-md-6 col-lg-2 pt-3 footerMenu_Container d-flex flex-column align-items-start gap-2">
              <h4 className="pb-3 text-nowrap " style={{ paddingLeft: "12px" }}>
                Services
              </h4>
              <Link to="/">Tax Consulting</Link>
                <Link to="/">Bookkeeping</Link>
                <Link to="/">Taxes</Link>
                <Link to="/">Business</Link>
                <Link to="/">Loans & Mortgages</Link>
                <Link to="/">Rental Property</Link>
                <Link to="/">Auditing</Link>
                <Link to="/">Payroll</Link>
                <Link to="/">Planning</Link>
                <Link to="/">Legally Required</Link>
            </div>

            <div className="col-12 col-md-6 col-lg-2 pt-3 footerMenu_Container">
              <h4 className="pb-3 text-nowrap">Contact</h4>
              <div className="d-flex m-0">
                <p className="d-block pe-3">
                  <FaLocationDot />
                </p>
                <p className="footer_nowrapp">
                  <Link
                    to="https://www.google.com/maps?q=4+Robert+Speck+Pkwy+%231500,+Mississauga,+ON+L4Z+1S1"
                    target="_blank"
                  >
                    4 Robert Speck Pkwy #1500, Mississauga, ON L4Z 1S1
                  </Link>
                </p>
              </div>
              <div className="d-flex m-0">
                <p className="d-block pe-3">
                  <IoMail />
                </p>
                <p className="footer_wrap">
                  <Link to="mailto:info@orientalbusinesssolutions.ca">
                    info@orientalbusinesssolutions.ca
                  </Link>
                </p>
              </div>
              <div className="d-flex m-0">
                <p className="d-block pe-3">
                  <FaPhoneAlt />
                </p>
                <p className="footer_nowrap">
                  <Link to="tel:+16478556177">(647) 855-6177</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <CopyRights />
    </>
  );
};

export default Footer;
