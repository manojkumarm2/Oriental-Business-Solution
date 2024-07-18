import React, { useEffect,useState } from 'react';
import './About.css';
import { Link } from 'react-router-dom';
import image from '../../Assets/about/about-section.jpg';
import icon1 from '../../Assets/about/icon-1.jpg';
import icon2 from '../../Assets/about/icon-2.jpg';
import icon3 from '../../Assets/about/icon-3.jpg';
import icon4 from '../../Assets/about/icon-4.jpg';
import ima from '../../Assets/about/about-section.jpg';
import team from '../../Assets/about/team2.jpg';
import Footer from '../commen/Footer';
import { FaHome } from "react-icons/fa";
import { IoIosArrowForward } from "react-icons/io";
import Navbar from '../commen/Navbar.jsx';
import AOS from 'aos';
import 'aos/dist/aos.css';

const StatCard = ({ icon, target, text }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(target);
    if (start === end) return;

    const totalDuration = 2000; // duration of the animation in milliseconds
    const incrementTime = (totalDuration / end) * 0.9;

    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start === end) clearInterval(timer);
    }, incrementTime);

    return () => clearInterval(timer); // cleanup on unmount
  }, [target]);

  let symbol = '';
  if (text === 'Recommended' || text === 'Satisfaction') {
    symbol = '%';
  } else if (text === 'Tax Services') {
    symbol = '+';
  }

  return (
    <div className="stat-card" data-aos="fade-up">
      <img src={icon} alt={text} />
      <h2>{count}{symbol}</h2>
      <p>{text}</p>
    </div>
  );
};

const About = () => {
  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  return (
    <div>
      <div className="about_container">
        <div className="about_bg">
          <Navbar />
          <div className="serviceDetail_head_container">
            <div className="d-flex">
              <Link to="/" style={{ textDecoration: "none", color: "#fff" }}>
                <div className='d-flex'>
                  <FaHome style={{ fontSize: "20px", margin: "0 13px" }} />
                  <h6 style={{ margin: "0 6px" }}>HOME</h6>
                </div>
              </Link>
              <Link to="/about" style={{ textDecoration: "none", color: "#fff" }}>
                <div className='d-flex'>
                  <IoIosArrowForward style={{ fontSize: "18px", margin: "0 13px" }} />
                  <h6>ABOUT</h6>
                </div>
              </Link>
            </div>
            <h1>About</h1>
          </div>
        </div>
      </div>
      <div className="about-us">
        <div className='about-txt'>
          <p className='heading'>ABOUT US</p>
          <h1>Oriental Business Solutions</h1>
          <p className='description'>
            Oriental Business Solutions has grown from a small consultancy into a respected firm. We began with a simple idea: to offer personalized, professional tax advisory services tailored to each client's needs.
          </p>
          <p className='description'>
            Over the years, we've built a reputation for excellence and trustworthiness. Our experienced team ensures clients receive top-notch guidance through the complexities of tax regulations and financial planning.
          </p>
          {/* <Link to='' className="read-more" data-aos="fade-right">Read More</Link> */}
        </div>
        <div className='about-img'>
          <img src={image} data-aos="fade-left" alt="Tax Services" />
        </div>
      </div>
      <div className="stats-container">
        <StatCard icon={icon1} target="172" text="Tax Services" />
        <StatCard icon={icon2} target="97" text="Recommended" />
        <StatCard icon={icon3} target="100" text="Satisfaction" />
        {/* <StatCard icon={icon4} target="46" text="International Awards" /> */}
      </div>
      <div className="testimonial-container">
        <div className="testimonial-content" data-aos="fade-up">
          <h2 className="testimonial-title">Who We Are</h2>
          <p className="testimonial-description">
            At Oriental Business Solutions, we are your dedicated partners in tax and financial planning. With years of experience, our expert team offers personalized solutions to ensure compliance and maximize savings. Whether you're a small business owner optimizing deductions, a corporate executive needing strategic tax planning, or an individual navigating life changes, we provide tailored guidance to meet your unique needs.
            <br />
            <br />
            We go beyond mere compliance, proactively identifying opportunities to enhance your financial position. Our meticulous approach and strategic insights empower you to make informed decisions that lead to long-term success. From tax preparation to comprehensive consulting services, we deliver reliable advice and support throughout your financial journey.
          </p>
        </div>
        <div className="testimonial-background" data-aos="fade-up">
          <img src={ima} alt="Background" />
          <div className="overlay"></div>
        </div>
        <div className="testimonial-box-container" data-aos="fade-up">
          <div className="testimonial-box">
            <div className="testimonial-author">
              <div>
                <p className="author-name">Mission</p>
                <p className="testimonial-text">
                  Our mission is to empower our clients to achieve financial success through proactive and strategic tax planning. We strive to exceed expectations by delivering innovative solutions, personalized service, and unparalleled expertise.
                </p>
              </div>
            </div>
          </div>
          <div className="testimonial-box">
            <div className="testimonial-author">
              <div>
                <p className="author-name">Vision</p>
                <p className="testimonial-text">
                  Our vision is to be the leading tax consulting firm known for integrity, professionalism, and client satisfaction. We aim to set the standard for excellence, continually adapting to meet the evolving needs of our clients and the regulatory environment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <section className="team-section">
        <h2 data-aos="fade-up">Our Expert Consultants</h2>
        <h1 data-aos="fade-up">Meet Our Expert Tax Consulting Team</h1>
        <div className="team-container">
          <div className="team-member" data-aos="fade-up">
            <img src={team} alt="Johnathan Stehr" />
            <h3>Johnathan</h3>
            <p>Senior Tax Consultant</p>
          </div>
          <div className="team-member" data-aos="fade-up">
            <img src={team} alt="Brian Ebert" />
            <h3>Brian Ebert</h3>
            <p>Tax Compliance Officer</p>
          </div>
          <div className="team-member" data-aos="fade-up">
            <img src={team} alt="Marion Blanda" />
            <h3>Marion Blanda</h3>
            <p>Transfer Pricing Consultant</p>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default About;