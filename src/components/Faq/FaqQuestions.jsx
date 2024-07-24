import React from 'react';
import { useState } from 'react';
import "./Faq.css";
// import { FaPlus } from "react-icons/fa6";
import { Link } from 'react-router-dom';
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import img1 from "../../Assets/faq/faq1.jpg";
import img2 from "../../Assets/faq/faq1-1.jpg";
import { RiArrowDropUpLine, RiArrowDropDownLine } from "react-icons/ri";

const FaqQuestions = () => {

    const faqsLeft = [
        {
            id: 1,
            question: "Scelerisque vitae etiam pellentesque incidunt",
            answer: "We offer a wide range of tax consulting services including individual and corporate tax preparation, tax planning, IRS representation, estate and trust tax services, and business advisory services."
        },
        {
            id: 2,
            question: "How can I schedule a consultation?",
            answer: "You can schedule a consultation by calling our office at [phone number], emailing us at [email address], or using our online booking system available on our website."
        },
        {
            id: 3,
            question: "What are your office hours?",
            answer: "Our office hours are Monday through Friday, 9 AM to 6 PM. We also offer weekend appointments by request."
        },
        {
            id: 4,
            question: "What documents do I need to bring for tax preparation?",
            answer: "You will need to bring identification, your Social Security number, W-2 forms, 1099 forms, records of other income, receipts for deductions, and any other relevant financial documents"
        },
        {
            id: 5,
            question: "How long does it take to prepare my taxes?",
            answer: "The time required to prepare your taxes depends on the complexity of your situation. Typically, it takes between 1 to 2 hours for a simple return, while more complex cases may take longer."
        },
    ];

    const faqsRight = [
        {
            id: 6,
            question: "Can you help with both federal and state taxes?",
            answer: "Yes, we are experienced in handling both federal and state tax returns for all 50 states."
        },
        {
            id: 7,
            question: "What is tax planning and why is it important?",
            answer: "Tax planning is the process of organizing your financial affairs to minimize your tax liability. It is important because it helps you retain more of your income and ensures compliance with tax laws."
        },
        {
            id: 8,
            question: "When should I start tax planning for the next year?",
            answer: "It's never too early to start tax planning. Ideally, you should start at the beginning of the tax year to take full advantage of available tax-saving opportunities."
        },
        {
            id: 9,
            question: "What should I do if I receive a letter from the IRS?",
            answer: "If you receive a letter from the IRS, do not ignore it. Contact us immediately, and we will help you understand the notice and take appropriate action."
        },
        {
            id: 10,
            question: "Can you represent me in an IRS audit?",
            answer: "Yes, we can represent you in an IRS audit. Our experienced tax professionals will guide you through the process and work to resolve any issues with the IRS."
        },
    ];

    const faqsRight3 = [
        {
            id: 11,
            question: "How much do your services cost?",
            answer: "Our fees vary based on the complexity of your tax situation and the services required. We offer a free initial consultation to discuss your needs and provide an estimate."
        },
        {
            id: 12,
            question: "What payment methods do you accept?",
            answer: "We accept cash, checks, and major credit cards. Payment plans are also available for certain services."
        },
        {
            id: 13,
            question: "Do you provide services for small businesses?",
            answer: "Yes, we specialize in providing tax and advisory services for small businesses, including bookkeeping, payroll, and financial planning."
        },
        {
            id: 14,
            question: "How can you help my business save on taxes?",
            answer: "We can help your business save on taxes through strategic tax planning, identifying deductions and credits, and ensuring compliance with tax laws to avoid penalties."
        },
        {
            id: 15,
            question: "How can I get in touch with you?",
            answer: "You can contact us by phone at [phone number], email at [email address], or through our website's contact form. Our office address is [office address]."
        },
    ];


    const [activeIndex, setActiveIndex] = useState(1);

    const handleToggle = id => {
        setActiveIndex(activeIndex === id ? null : id);
    };

    const button = {
        width: "180px",
        padding: "16px 0",
        color: "black",
        background: "#FFB341",
        border: "none",
        fontWeight: 700
    }

    return (
        <>
            <div className="container text-center faq_question py-5">
                {/* <h6
                    style={{
                        color: "#4A6EC980"
                    }}
                >
                    FAQ
                </h6> */}
                <h1>Frequently Asked Questions</h1>
                <p
                    className='py-4'
                    style={{
                        color: "#02113799"
                    }}
                >
                    Discover answers to common questions about our tax consulting and business services. From tax preparation to IRS representation, our FAQs provide the information you need.
                </p>
                <Link to="/contact">
                    <button
                        style={button}
                        className='individula_btn'
                    >
                        Contact Us
                        <MdOutlineKeyboardArrowRight />
                    </button>
                </Link>
            </div>
            {/* FAQ QUESTION START */}
            <div className="container py-5 faq_right_left_container">
                <div className="row">
                    <div className="col-12 col-md-6 pb-3">
                        <h2 className='pb-4'>General Questions & Tax Preparation</h2>
                        {
                            faqsLeft.map((faqsleft) => (
                                <div key={faqsleft.id}>
                                    <div
                                        className='d-flex justify-content-between cursor-pointer pb-3'
                                        onClick={() => handleToggle(faqsleft.id)}
                                        style={{
                                            cursor: "pointer",
                                            color: activeIndex === faqsleft.id && "#4A6EC9"
                                        }}
                                    >
                                        <h5>
                                            {faqsleft.question}
                                        </h5>
                                        {
                                            activeIndex === faqsleft.id ?
                                                <RiArrowDropUpLine
                                                    style={{
                                                        fontSize: "28px"
                                                    }}
                                                />
                                                :
                                                <RiArrowDropDownLine
                                                    style={{
                                                        fontSize: "28px"
                                                    }}
                                                />
                                        }

                                    </div>
                                    {
                                        activeIndex === faqsleft.id && <p style={{ color: "#02113799" }}>{faqsleft.answer}</p>
                                    }
                                </div>
                            ))
                        }
                    </div>
                    <div className="col-12 col-md-6">
                        <img src={img1} alt="" className='px-lg-4' />
                    </div>
                </div>
            </div>
            <div className="container py-5 faq_right_left_container">
                <div className="row">
                    <div className="col-12 col-md-6 pb-5 order-2 order-md-1">
                        <img src={img2} alt="" className='px-lg-4' />
                    </div>
                    <div className="col-12 col-md-6 pb-3 order-1 order-md-2">
                        <h2 className='pb-4'>Tax Planning & IRS Representation </h2>
                        {
                            faqsRight.map((faqsRight) => (
                                <div key={faqsRight.id}>
                                    <div
                                        className='d-flex justify-content-between cursor-pointer pb-3'
                                        onClick={() => handleToggle(faqsRight.id)}
                                        style={{
                                            cursor: "pointer",
                                            color: activeIndex === faqsRight.id && "#4A6EC9"
                                        }}
                                    >
                                        <h5>
                                            {faqsRight.question}
                                        </h5>
                                        {
                                            activeIndex === faqsRight.id ?
                                                <RiArrowDropUpLine
                                                    style={{
                                                        fontSize: "28px"
                                                    }}
                                                /> :
                                                <RiArrowDropDownLine
                                                    style={{
                                                        fontSize: "28px"
                                                    }}
                                                />
                                        }
                                    </div>
                                    {
                                        activeIndex === faqsRight.id && <p style={{ color: "#02113799" }}>{faqsRight.answer}</p>
                                    }
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>
            <div className="container py-5 faq_right_left_container">
                <div className="row">
                    <div className="col-12 col-md-6 pb-3">
                        <h2 className='pb-4'>Fees and Payment & Business Services</h2>
                        {
                            faqsRight3.map((faqsleft) => (
                                <div key={faqsleft.id}>
                                    <div
                                        className='d-flex justify-content-between cursor-pointer pb-3'
                                        onClick={() => handleToggle(faqsleft.id)}
                                        style={{
                                            cursor: "pointer",
                                            color: activeIndex === faqsleft.id && "#4A6EC9"
                                        }}
                                    >
                                        <h5>
                                            {faqsleft.question}
                                        </h5>
                                        {
                                            activeIndex === faqsleft.id ?
                                                <RiArrowDropUpLine
                                                    style={{
                                                        fontSize: "28px"
                                                    }}
                                                />
                                                :
                                                <RiArrowDropDownLine
                                                    style={{
                                                        fontSize: "28px"
                                                    }}
                                                />
                                        }

                                    </div>
                                    {
                                        activeIndex === faqsleft.id && <p style={{ color: "#02113799" }}>{faqsleft.answer}</p>
                                    }
                                </div>
                            ))
                        }
                    </div>
                    <div className="col-12 col-md-6">
                        <img src={img1} alt="" className='px-lg-4' />
                    </div>
                </div>
            </div>
        </>
    )
}

export default FaqQuestions;