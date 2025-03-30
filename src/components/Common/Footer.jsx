import React from "react";
import { IoMail } from "react-icons/io5";
import { FaLocationDot } from "react-icons/fa6";
import { FaPhoneAlt } from "react-icons/fa";
import { commenIcon } from "../../data/CommenIcon.jsx";
import CopyRights from "./CopyRights.jsx";
import { Link } from "react-router-dom";
import { APP_CONFIG } from "../../config/app.config.js";

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
        { listTitle: "Tax Consulting", path: "/servicedetails/1" },
        { listTitle: "Bookkeeping", path: "/servicedetails/2" },
        { listTitle: "Taxes", path: "/servicedetails/3" },
        { listTitle: "Business", path: "/servicedetails/4" },
        { listTitle: "Loans & Mortgages", path: "/servicedetails/5" },
        { listTitle: "Rental Property", path: "/servicedetails/6" },
        { listTitle: "Auditing", path: "/servicedetails/7" },
        { listTitle: "Payroll", path: "/servicedetails/8" },
        { listTitle: "Planning", path: "/servicedetails/9" },
        { listTitle: "Legally Required", path: "/servicedetails/10" },
      ],
    },
    {
      id: 3,
      title: "Quik Links",
      list: [
        { listTitle: "Employment Insurance (EI)", path: "https://www.canada.ca/en/services/benefits/ei.html", type: "_blank" },
        { listTitle: "Personal Taxes", path: "https://www.canada.ca/en/services/taxes/income-tax/personal-income-tax.html", type: "_blank" },
        { listTitle: "HST Credit", path: "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/goods-services-tax-harmonized-sales-tax-gst-hst-credit.html", type: "_blank" },
        { listTitle: "Canada Child Benefit", path: "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/canada-child-benefit-overview.html", type: "_blank" },
        { listTitle: "Old Age Security (OAS)", path: "https://www.canada.ca/en/services/benefits/publicpensions/cpp/old-age-security.html", type: "_blank" },
        { listTitle: "Canada Pension Plan (CPP)", path: "https://www.canada.ca/en/services/benefits/publicpensions/cpp.html", type: "_blank" },
      ],
    },
    {
      id: 4,
      title: "Contact",
      list: [
        {
          listTitle0: APP_CONFIG.address2line,
          icon: <FaLocationDot />,
          path: APP_CONFIG.addressLink,
          type: "_blank",
        },
        {
          listTitle: APP_CONFIG.email,
          icon: <IoMail />,
          path: APP_CONFIG.emailLink,
        },
        {
          listTitle1: APP_CONFIG.phone,
          icon: <FaPhoneAlt />,
          path: APP_CONFIG.phoneLink,
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
            <div className="col-12 col-md-6 col-lg-3 pt-3">
              <p className="py-4">
                Expert tax consultants offering personalized strategies for
                individuals and businesses, ensuring compliance and maximizing
                financial efficiency.
              </p>
              <div className="d-flex footer_icon_container ">
                {commenIcon.map((icon) => (
                  <Link key={icon.id} className="footer_icon" to={icon.path} target="_blank">
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
                  <Link to={footerList.path} key={footerList.listTitle} target={footerList.type || '' }>
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

