
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
import Footer from '../Common/Footer.jsx';
import { FaHome } from "react-icons/fa";
import { IoIosArrowForward } from "react-icons/io";
import Navbar from '../Common/Navbar.jsx'

const StatCard = ({ icon, target, text }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(target);
    if (start === end) return;

    const totalDuration = 2000; 
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
          <p className='heading'>Oriental Business Solutions Inc.</p>
          <h1>Why Oriental Business Solutions ?</h1>
          <p className='description'>
            Our customers are significant to us, and we have a very cordial relationship focusing on access, speed, reliability, professionalism, and expertise. Our quality service, competitive pricing, and prompt responsiveness in process outsourcing ensures the growth and development of our clients with utmost satisfaction for us.
          </p>
          <p className='description'>
            We guarantee that each client gets the close to assessment and consideration they deserve.
          </p>
          <Link to='/about' className="read-more">About Us</Link>
        </div>
        <div className='about-img'>
          <img src={image} data-aos="fade-left" alt="Tax Services" />
        </div>
      </div>
      <div className="about-us d-flex justify-content-around" >
        <div className='about-txt' data-aos="flip-up">
          <p className='heading'>Quality</p>
          <h1>Quality is Important</h1>
          <p className='description'>
          Quality is something which is on top of our mind. In a business like ours, quality is when we have a satisfied client. Our customers have consistently been happy with our delivery and the testimony given by them proves our stand.</p>
          <p className='description'>
          In Oriental Business Solutions, we have developed proprietary software to measure accuracy in our process.
          </p>
          <p className='description'>
          To safeguard our customers’ information, we use the most advanced internet security technology. Our dedicated network is secure with limited access facilities including comprehensive security systems, dedicated and isolated data-communication lines and well-planned contingency procedures.
          </p>
        </div>
        <div className='about-txt' data-aos="flip-up">
        <p className='heading'>Choose Us</p>
          <h1>Why should you Choose Us?</h1>
          <p className='description'>
          We are cost-effective and consistently deliver high quality output based on our client needs.
          </p>
          <p className='description'>
            <ul>
              <li>Choose us for quality and reliability.</li>
              <li>We offer the best end-to-end solution.</li>
              <li>We understand the needs of our clients on the operational, business and enterprise level, that enable us to offer the best and to help them in their own client capability.</li>
              <li>We are Fast, convenient, and friendly service.</li>
              <li>Our strong business focus improves your bottom-line.</li>
              <li>We provide ongoing advice and instant support.</li>
            </ul>
          </p>
          <p className='description'>
            We are one of the most professional accounting firms in GTA, offering a full range of services. We pride ourselves on developing trusted relationships with our clients, and we understand the importance of responding to client queries in a timely and thorough manner. With our hands-on approach, we will work with you to help you achieve your goals.
          </p>
        </div>
      </div>
      <div className="stats-container">
        <StatCard icon={icon1} target="172" text="Tax Services" />
        <StatCard icon={icon2} target="97" text="Recommended" />
        <StatCard icon={icon3} target="100" text="Satisfaction" />
        {/* <StatCard icon={icon4} target="46" text="International Awards" /> */}
      </div>
    </div>
  );
};

export default About;