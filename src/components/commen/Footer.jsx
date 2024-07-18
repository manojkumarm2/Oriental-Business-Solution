import React from "react";
import { IoMail } from "react-icons/io5";
import { FaLocationDot } from "react-icons/fa6";
import { FaPhoneAlt } from "react-icons/fa";
import { commenIcon } from "../../data/CommenIcon.jsx";
import CopyRights from "./CopyRights";
import { Link } from "react-router-dom";

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
      ],
    },
    {
      id: 2,
      title: "Services",
      list: [
        { listTitle: "Tax Consulting", path: "/" },
        { listTitle: "Bookkeeping", path: "/" },
        { listTitle: "Taxes", path: "/" },
        { listTitle: "Business", path: "/" },
        { listTitle: "Loans & Mortgages", path: "/" },
        { listTitle: "Rental Property", path: "/" },
        { listTitle: "Auditing", path: "/" },
        { listTitle: "Payroll", path: "/" },
        { listTitle: "Planning", path: "/" },
        { listTitle: "Legally Required", path: "/" },
      ],
    },
    {
      id: 3,
      title: "Contact",
      list: [
        {
          listTitle0: "4 Robert Speck Pkwy #1500, Mississauga, ON L4Z 1S1",
          icon: <FaLocationDot />,
          path: "#",
          type: "newwindow",
          action:
            "https://www.google.com/maps?q=4+Robert+Speck+Pkwy+%231500,+Mississauga,+ON+L4Z+1S1",
        },
        {
          listTitle: "info@orientalbusinesssolutions.ca",
          icon: <IoMail />,
          path: "#",
          type: "navigate",
          action: "mailto:info@orientalbusinesssolutions.ca",
        },
        {
          listTitle1: "(647) 855-6177",
          icon: <FaPhoneAlt />,
          path: "#",
          type: "navigate",
          action: "tel:+16478556177",
        },
      ],
    },
  ];

  return (
    <>
      <div
        className="py-5"
        style={{
          background: "rgb(74, 110, 201)",
          color: "#fff",
        }}
         >
        <div className="container " style={{ marginLeft: "0" }}>
          <div
            className="row m-0 pt-5 justify-content-evenly"
            // style={{ borderTop: "1px solid rgb(88 117 192 / 59%)" }}
          >
            <div className="col-12 col-md-6 col-lg-5 pt-3">
              <p className="py-4">
                Expert tax consultants offering personalized strategies for
                individuals and businesses, ensuring compliance and maximizing
                financial efficiency.
              </p>
              <div className="d-flex footer_icon_container ">
                {commenIcon.map((icon) => (
                  <Link key={icon.id} className="footer_icon">
                    {icon.icon}
                  </Link>
                ))}
              </div>
            </div>
            {footerMenu.map((footerMenu, index) => (
              <div
                className="col-12 col-md-6 col-lg-2 pt-3 footerMenu_Container"
                key={footerMenu.id}
              >
                <h4
                  className="pb-3 text-nowrap"
                  style={{
                    paddingLeft: index === 0 || index === 1 ? "12px" : "",
                  }}
                >
                  {footerMenu.title}
                </h4>
                {footerMenu.list.map((footerList) => (
                  <Link to={footerList.path} key={footerList.listTitle}>
                    <div className="col-12 col-md-6 col-lg-2 d-flex m-0">
                      <p className="d-block pe-3">{footerList.icon}</p>
                      <p className=" footer_nowrapp">{footerList.listTitle0}</p>
                      <p className=" footer_wrap">{footerList.listTitle}</p>
                      <p className=" footer_nowrap">{footerList.listTitle1}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <CopyRights />
    </>
  );
};

export default Footer;

