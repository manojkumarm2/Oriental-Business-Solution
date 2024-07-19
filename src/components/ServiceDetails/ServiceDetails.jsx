import React from "react";
import { FaHome } from "react-icons/fa";
import { IoIosArrowForward } from "react-icons/io";
import { Link } from "react-router-dom";
import "./serviceDetail.css";
import IndividualTax from "./IndividualTax";
import { useParams } from "react-router-dom";
import img1 from "../../Assets/service/taxconsult.jpg";
import img2 from "../../Assets/service/bookkeeping.jpg";
import img3 from "../../Assets/service/taxpersonal.jpg";
import img4 from "../../Assets/service/businessregi.jpg";

import img5 from "../../Assets/service/Loans.jpg";
import img6 from "../../Assets/service/RentalProperty.jpg";

import img7 from "../../Assets/service/auditing.jpg";
import img8 from "../../Assets/service/payroll.jpg";
import img9 from "../../Assets/service/planning.jpg";
import img10 from "../../Assets/service/corporatedocum.jpg";
import Footer from "../commen/Footer.jsx";
import Navbar from "../commen/Navbar.jsx";

const ServiceDetails = () => {
  const cards = [
    {
      id: 1,
      title: "Tax Consulting",
      desc1:
        "We offer comprehensive tax consulting services for individuals and businesses. Our experienced tax professionals help you navigate complex tax regulations, ensure compliance, and optimize your tax strategy. Whether you need help with personal tax planning, corporate tax strategies, or international tax laws, we provide expert guidance and support.",
      desc2:
        "“Our experienced tax professionals help you navigate complex tax regulations, ensure compliance, and optimize your tax strategy.“",
      desc3:
        "Our goal is to simplify the tax process so you can focus on growing your business or managing your personal finances. With our proactive approach, we identify opportunities to minimize tax liabilities and maximize savings. Partner with us for personalized service and a commitment to your financial success.",
      img: img1,
      IndividualCard: [
        {
          id: 1,
          title: "Personal Tax Planning",
          para: "Customized strategies to minimize your tax liabilities and maximize your savings.",
        },
        {
          id: 2,
          title: "Corporate Tax Strategies",
          para: "Expert advice on optimizing your business tax position and ensuring regulatory compliance.",
        },
        {
          id: 3,
          title: "International Tax Services",
          para: "Guidance on navigating complex international tax laws and cross-border transactions.",
        },
        {
          id: 4,
          title: "Estate Consulting",
          para: "Assistance with accurate and timely tax filings to avoid penalties and audits.",
        },
      ],
    },
    {
      id: 2,
      title: "Bookkeeping Services",
      desc1:
        "Maintaining accurate and up-to-date financial records is essential for any business's success. At [Your Company Name], our comprehensive bookkeeping services ensure that your financial information is meticulously managed and easily accessible. ",
      desc2:
        "Our team of experienced professionals is dedicated to providing you with the highest level of accuracy and efficiency, allowing you to focus on growing your business.",
      desc3:
        "Our bookkeeping services encompass a wide range of tasks designed to keep your finances in perfect order. From tracking daily transactions to preparing detailed financial statements, we handle every aspect with precision and care. By partnering with us, you gain access to expert advice and support, ensuring that your financial records are always compliant and reflective of your business's true financial health.",
      img: img2,
      IndividualCard: [
        {
          id: 1,
          title: "Transaction Recording",
          para: "We accurately record all your financial transactions to maintain a clear and detailed record of your business activities.",
        },
        {
          id: 2,
          title: "Financial Statement Preparation",
          para: "Our team prepares comprehensive financial statements that provide valuable insights into your company's performance.",
        },
        {
          id: 3,
          title: "Reconciliation Services",
          para: "We ensure that your bank statements, credit card statements, and other financial records are accurately reconciled to prevent discrepancies.",
        },
        {
          id: 4,
          title: "Payroll Management",
          para: "We handle all aspects of payroll processing, ensuring your employees are paid accurately and on time.",
        },
      ],
    },
    {
      id: 3,
      title: "Taxes",
      desc1:
        "Navigating the complex world of taxes can be daunting, whether you're an individual, a small business owner, or a large corporation. Our team of experienced tax consultants is here to simplify the process for you. We provide tailored tax solutions that ensure compliance, optimize your financial strategies, and help you save money.",
      desc2:
        "With our comprehensive understanding of tax laws and regulations, we guide you through every step, from preparation to filing and beyond.",
      desc3:
        "At our firm, we believe in offering personalized service to meet your unique tax needs. Our goal is to minimize your tax liabilities and maximize your returns, allowing you to focus on what matters most – growing your business or enjoying your personal achievements. Trust us to handle your taxes with the utmost professionalism and expertise, ensuring you get the most favourable outcomes.",
      img: img3,
      IndividualCard: [
        {
          id: 1,
          title: "Personal Tax Services",
          para: "Comprehensive solutions for individuals to optimize their tax returns and ensure compliance.",
        },
        {
          id: 2,
          title: "Business Tax Services",
          para: "Expert advice and services to help small and medium-sized businesses manage their taxes effectively.",
        },
        {
          id: 3,
          title: "Corporate Tax Services",
          para: "Tailored strategies for large corporations to navigate complex tax landscapes and achieve financial efficiency.",
        },
        {
          id: 4,
          title: "Tax Planning and Advisory",
          para: "Proactive tax planning and advisory services to help you make informed financial decisions year-round.",
        },
      ],
    },
    {
      id: 4,
      title: "Business Registration",
      desc1:
        "Launching a business is a thrilling leap into the world of entrepreneurship. Your vision takes shape, and the possibilities for growth seem endless. However, the initial legal hurdles of registration shouldn't become a stumbling block on your exciting journey. Many entrepreneurs find themselves bogged down by the complexities of choosing a business structure, conducting name availability checks, and navigating government filings. ",
      desc2:
        "This can significantly delay your launch and distract you from focusing on your core business idea.",
      desc3:
        "That's where our team of experienced tax consultants comes in. We provide comprehensive business registration services designed to streamline your startup process and ensure complete compliance from the get-go. We understand the intricacies involved in forming a new business, and we're here to guide you through every step. Our team takes the burden off your shoulders, so you can focus on what truly matters – building your dream business and turning your vision into reality.",
      img: img4,
      IndividualCard: [
        {
          id: 1,
          title: "Entity Selection",
          para: "Helping you choose the right business structure that aligns with your goals and minimizes tax liabilities.",
        },
        {
          id: 2,
          title: "Documentation Preparation",
          para: "Assisting in the preparation and filing of necessary documents to establish your business legally.",
        },
        {
          id: 3,
          title: "State and Federal Compliance",
          para: "Ensuring adherence to all state and federal regulations to avoid penalties and legal complications.",
        },
        {
          id: 4,
          title: "Ongoing Support",
          para: "Providing ongoing support and guidance to maintain compliance as your business grows.",
        },
      ],
    },

    {
      id: 5,
      title: "Loans & Mortgages",
      desc1:
        "Navigating the complexities of loans and mortgages can be challenging. Our experienced team provides comprehensive guidance to help you secure the best financing options tailored to your needs. Whether you're purchasing your first home, refinancing an existing mortgage, or exploring investment opportunities, we offer expert advice to ensure a smooth and successful process. Our personalized approach ensures that every client receives the attention and expertise required to make informed decisions and achieve their financial goals.",
      desc2:
        "Expert guidance in loans and mortgages ensures you make informed and beneficial financial decisions.",
      desc3:
        "We cover a wide range of services within the loans and mortgages sector, ensuring you have access to the resources and support necessary for every step of your financial journey. From understanding loan terms to finding competitive rates, our consultants are here to assist you in making the most informed choices. Trust us to provide clear, concise, and actionable advice that aligns with your unique financial situation and objectives.",
      img: img5,
      IndividualCard: [
        {
          id: 1,
          title: "Mortgage Pre-Approval",
          para: "Get pre-approved to understand your budget and increase your bargaining power.",
        },
        {
          id: 2,
          title: "Refinancing Options",
          para: "Explore refinancing opportunities to lower your interest rate and monthly payments.",
        },
        {
          id: 3,
          title: "Investment Property Loans",
          para: "Receive expert advice on financing for investment properties to maximize your returns.",
        },
        {
          id: 4,
          title: "Debt Consolidation Loans",
          para: "Simplify your finances by consolidating multiple debts into a single, manageable loan.",
        },
      ],
    },

    {
      id: 6,
      title: "Rental Property HST Rebates",
      desc1:
        "Owning rental property in Canada can be a lucrative investment, but it's essential to understand the tax implications and opportunities available, such as the HST (Harmonized Sales Tax) rebates. Our expert tax consultants are here to help you navigate the complexities of HST rebates, ensuring you maximize your returns and comply with all regulatory requirements. Whether you're a seasoned investor or new to the rental property market, we offer personalized services tailored to your unique needs.",
      desc2:
        "Maximize your rental property's potential with expert HST rebate assistance.",
      desc3:
        "At our firm, we specialize in helping clients understand and claim HST rebates on rental properties. From initial property purchase to ongoing management, our comprehensive services cover every aspect of your tax obligations. Let us simplify the process for you and secure the rebates you're entitled to, allowing you to focus on growing your investment portfolio with confidence.",
      img: img6,
      IndividualCard: [
        {
          id: 1,
          title: "Eligibility Assessment",
          para: "Determine if your rental property qualifies for HST rebates based on current regulations and property use.",
        },
        {
          id: 2,
          title: "Application Preparation",
          para: "Complete and accurate preparation of HST rebate applications to ensure timely and successful submissions.",
        },
        {
          id: 3,
          title: "Documentation Review",
          para: "Thorough review of all necessary documentation to support your HST rebate claim, minimizing the risk of audit.",
        },
        {
          id: 4,
          title: "Ongoing Support",
          para: "Continual guidance and support for future rebate claims and compliance with changing tax laws.",
        },
      ],
    },

    {
      id: 7,
      title: "Auditing",
      desc1:
        "Facing a tax audit can be stressful. Our team of experienced professionals can help navigate you through the process with confidence. ",
      desc2:
        "We offer a comprehensive range of audit services to ensure your financial records are accurate and compliant with tax regulations.",
      desc3: "",
      img: img7,
      IndividualCard: [
        {
          id: 1,
          title: "Audit Representation",
          para: "We'll act as your liaison with tax authorities, protecting your rights.",
        },
        {
          id: 2,
          title: "Documentation Support",
          para: "We assist in gathering and organizing necessary documents.",
        },
        {
          id: 3,
          title: "Audit Defence",
          para: " We defend your tax positions with clear communication.",
        },
        {
          id: 4,
          title: "Post-Audit Guidance",
          para: "We provide guidance on next steps, like filing amended returns.",
        },
      ],
    },
    {
      id: 8,
      title: "Payroll Management",
      desc1:
        "Managing payroll can be complex and time-consuming, but our expert team is here to simplify the process for you. At Oriental Business Solution, we provide comprehensive payroll management services tailored to meet the unique needs of your business. ",
      desc2:
        " Our solutions ensure accuracy, compliance, and efficiency, allowing you to focus on your core business activities. ",
      desc3:
        "From calculating wages and taxes to managing employee benefits, we handle all aspects of payroll with precision and professionalism.",
      img: img8,
      IndividualCard: [
        {
          id: 1,
          title: "Payroll Processing",
          para: "Accurate and timely calculation of wages, deductions, and taxes.",
        },
        {
          id: 2,
          title: "Compliance Management",
          para: "Ensuring adherence to all federal, state, and local payroll regulations.",
        },
        {
          id: 3,
          title: "Employee Self-Service Portal",
          para: "Providing employees with easy access to their payroll information.",
        },
        {
          id: 4,
          title: "Direct Deposit Services",
          para: "Facilitating seamless and secure direct deposits to employee accounts.",
        },
      ],
    },
    {
      id: 9,
      title: "Tax Planning and Reporting",
      desc1:
        "Navigating the complexities of tax planning and reporting can be daunting. At [Your Company Name], we specialize in providing comprehensive solutions tailored to your unique financial situation. Our expert team is dedicated to helping you minimize tax liabilities and ensure compliance with all regulatory requirements. ",
      desc2:
        "By leveraging our extensive knowledge and cutting-edge tools, we empower you to make informed decisions that enhance your financial well-being.",
      desc3:
        "Our services are designed to streamline the tax planning and reporting process, offering you peace of mind and allowing you to focus on your core business activities. We pride ourselves on our proactive approach, identifying opportunities for tax savings and ensuring that all reporting is accurate and timely. Trust us to be your partner in achieving financial success and security.",
      img: img9,
      IndividualCard: [
        {
          id: 1,
          title: "Strategic Tax Planning",
          para: "Develop customized strategies to minimize tax liabilities and maximize financial growth.",
        },
        {
          id: 2,
          title: "Comprehensive Tax Reporting",
          para: "Ensure accurate and timely tax filings, meeting all regulatory requirements.",
        },
        {
          id: 3,
          title: "Tax Compliance Reviews",
          para: "Conduct thorough reviews to ensure compliance with ever-changing tax laws and regulations.",
        },
        {
          id: 4,
          title: "Risk Management and Advisory",
          para: "Identify and mitigate tax-related risks with expert advisory services.",
        },
      ],
    },
    {
      id: 10,
      title: "Legally Required",
      desc1:
        "Ensuring your business complies with all legal documentation requirements is crucial for maintaining its operational integrity and avoiding potential penalties. Our expert tax consultants provide comprehensive support in preparing, managing, and updating all necessary corporate documents to keep your business compliant and running smoothly. ",
      desc2:
        " From incorporation to ongoing compliance, we handle all aspects of corporate documentation, giving you peace of mind to focus on your core business activities.",
      desc3:
        "Our team specializes in various essential corporate documents, each playing a vital role in your business's legal framework. Whether you are starting a new venture or managing an established enterprise, we guide you through every step to ensure all documentation is accurate, timely, and legally sound. Trust us to handle your documentation needs, so you can concentrate on what you do best—growing your business.",
      img: img10,
      IndividualCard: [
        {
          id: 1,
          title: "Articles of Incorporation",
          para: "Defines the establishment of your corporation, outlining its purpose, structure, and operational guidelines.",
        },
        {
          id: 2,
          title: "Bylaws",
          para: "Detailed rules governing the internal management of your company, including roles, responsibilities, and procedures.",
        },
        {
          id: 3,
          title: "Annual Reports",
          para: "Regularly required filings that provide essential updates on your corporation's financial status and operational activities.",
        },
        {
          id: 4,
          title: "Meeting Minutes",
          para: "Accurate records of corporate meetings, ensuring all decisions and discussions are documented for legal compliance.",
        },
      ],
    },
  ];

  const { id } = useParams();

  const card = cards.find((card) => card.id === parseInt(id));
  const { title, desc1, desc2, desc3, img, IndividualCard } = card;

  return (
    <>
      <div className="serviceDetail_container">
        <div className="serviceDetail_bg">
          <Navbar />
          <div className="serviceDetail_head_container">
            <div className="d-flex">
              <Link
                to="/"
                style={{
                  textDecoration: "none",
                  color: "#fff",
                }}
              >
                <div className="d-flex">
                  <FaHome
                    style={{
                      fontSize: "20px",
                      margin: "0 13px",
                    }}
                     />
                  <h6
                    style={{
                      margin: "0 6px",
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
                  color: "#fff",
                }}
              >
                <div className="d-flex">
                  <IoIosArrowForward
                    style={{
                      fontSize: "18px",
                      margin: "0 13px",
                    }}
                  />
                  <h6>SERVICES</h6>
                </div>
              </Link>
              <Link
                to={`/servicedetails/${card.id}`}
                style={{
                  textDecoration: "none",
                  color: "#fff",
                }}
              >
                <div className="d-flex">
                  <IoIosArrowForward
                    style={{
                      fontSize: "18px",
                      margin: "0 13px",
                    }}
                  />
                  <h6>SERVICE DETAIL</h6>
                </div>
              </Link>
            </div>
            <h1>{card.title}</h1>
          </div>
        </div>
      </div>
      {/* Individual Tax START */}
      <IndividualTax
        title={title}
        desc1={desc1}
        desc2={desc2}
        desc3={desc3}
        IndividualCard={IndividualCard}
        img={img}
      />
      {/* Individual Tax END */}
      <Footer />
    </>
  );
};

export default ServiceDetails;
