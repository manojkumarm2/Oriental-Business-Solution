
import React, { useEffect, useState } from 'react';
import '../About/About.css';
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
import Navbar from '../commen/Navbar.jsx'

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
    <div className="stat-card">
      <img src={icon} alt={text} />
      <h2>{count}{symbol}</h2>
      <p>{text}</p>
    </div>
  );
};

const About = () => {
  return (
    <div>
      
      <div className="about-us d-flex justify-content-around" >
        <div className='about-txt' data-aos="flip-up">
          <p className='heading'>ABOUT US</p>
          <h1>Oriental Business Solutions</h1>
          <p className='description'>
            Oriental Business Solutions has grown from a small consultancy into a respected firm. We began with a simple idea: to offer personalized, professional tax advisory services tailored to each client's needs.
          </p>
          <p className='description'>
            Over the years, we've built a reputation for excellence and trustworthiness. Our experienced team ensures clients receive top-notch guidance through the complexities of tax regulations and financial planning.
          </p>
          <Link to='' className="read-more">Read More</Link>
          {/* <a href="#" className="read-more">Read More</a> */}
        </div>
        <div className='about-img'>
          <img src={image} data-aos="fade-left" alt="Tax Services" />
        </div>
      </div>
      <div className="stats-container">
        <StatCard icon={icon1} target="172" text="Tax Services" />
        <StatCard icon={icon2} target="97" text="Recommended" />
        <StatCard icon={icon3} target="100" text="Satisfaction" />
        <StatCard icon={icon4} target="46" text="International Awards" />
      </div>
    </div>
  );
};

export default About;