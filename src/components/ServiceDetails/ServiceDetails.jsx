import React from 'react';
import { FaHome } from "react-icons/fa";
import { IoIosArrowForward } from "react-icons/io";
import { Link } from 'react-router-dom';
import './serviceDetail.css';
import IndividualTax from './IndividualTax';
import { useParams } from 'react-router-dom';
import img1 from '../../Assets/servicesImg/services1.jpg';
import img2 from '../../Assets/servicesImg/services1-1.jpg';
import img3 from '../../Assets/servicesImg/services1-2.jpg';
import img4 from '../../Assets/servicesImg/services1-3.jpg';

const ServiceDetails = () => {

    const cards = [
        { id: 1, title: 'Card 1', description: 'This is card 1', img: img1 },
        { id: 2, title: 'Card 2', description: 'This is card 2', img: img2 },
        { id: 3, title: 'Card 3', description: 'This is card 3', img: img3 },
        { id: 4, title: 'Card 4', description: 'This is card 4', img: img4 },
        { id: 5, title: 'Card 5', description: 'This is card 5', img: img4 },
        { id: 6, title: 'Card 6', description: 'This is card 6', img: img1 },
        { id: 7, title: 'Card 7', description: 'This is card 7', img: img1 },
        { id: 8, title: 'Card 8', description: 'This is card 8', img: img1 }
    ];

    const { id } = useParams();

    const card = cards.find(card => card.id === parseInt(id));
    const { title, description, img } = card;

    return (
        <>
            <div className="serviceDetail_container">
                <div className="serviceDetail_bg">

                    <div className="serviceDetail_head_container">
                        <div className="d-flex">
                            <Link to="/" style={{ textDecoration: "none", color: "#fff" }}>
                                <div className='d-flex'>
                                    <FaHome style={{ fontSize: "20px", margin: "0 13px" }} />
                                    <h6 style={{ margin: "0 6px" }}>HOME</h6>
                                </div>
                            </Link>
                            <Link to="/service" style={{ textDecoration: "none", color: "#fff" }}>
                                <div className='d-flex'>
                                    <IoIosArrowForward style={{ fontSize: "18px", margin: "0 13px" }} />
                                    <h6>SERVICES</h6>
                                </div>
                            </Link>
                            <Link to={`/servicedetails/${card.id}`} style={{ textDecoration: "none", color: "#fff" }}>
                                <div className='d-flex'>
                                    <IoIosArrowForward style={{ fontSize: "18px", margin: "0 13px" }} />
                                    <h6>SERVICE DETAIL</h6>
                                </div>
                            </Link>
                        </div>
                        <h1>{card.title}</h1>
                    </div>
                </div>
            </div>
            {/* Individual Tax START */}
            <IndividualTax title={title} description={description} img={img} />
            {/* Individual Tax END */}
        </>
    )
}

export default ServiceDetails;