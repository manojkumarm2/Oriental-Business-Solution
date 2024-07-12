import React from 'react';
import { SiTicktick } from "react-icons/si";
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useEffect } from 'react';

const IndividualTax = (props) => {

    const { title, desc1, desc2, desc3, img, IndividualCard } = props;

    useEffect(() => {
        AOS.init(({ duration: 2000 }))
    }, []);

    return (
        <>
            <div className="container-lg py-1 py-md-5">
                <div className="row justify-content-center align-items-center py-5">
                    <div
                        data-aos="fade-right"
                        className="col-12 col-md-5 individuval_img_Container"
                        style={{
                            display: "flex",
                            alignItems: "center"
                        }}
                    >
                        <img
                            src={img}
                            alt=""
                            width="100%"
                            height="100%"
                        />
                    </div>
                    <div
                        data-aos="fade-left"
                        className="col-12 col-md-5 mt-4 d-flex flex-column justify-content-center"
                    >
                        <h1 className='pb-3'>{title}</h1>
                        <p
                            className='py-2'
                            style={{
                                color: "rgba(2, 17, 55, 0.6)"
                            }}
                        >
                            {desc1}
                        </p>
                        <p>{desc2}
                        </p>
                        <p
                            className='py-2'
                            style={{
                                color: "rgba(2, 17, 55, 0.6)"
                            }}
                        >
                            {desc3}
                        </p>
                    </div>
                </div>
            </div>
            <div className="container-fluid py-5">
                <div className="row justify-content-center">
                    {
                        IndividualCard.map((card) => (
                            <div
                                data-aos="zoom-in"
                                className="col-12 col-md-5 col-xl-2 px-3 py-5 m-3 text-center"
                                key={card.id}
                                style={{
                                    border: "1px solid #4A6EC94D"
                                }}
                            >
                                <SiTicktick className='individual_icon' />
                                <h6 className='py-3'>{card.title}</h6>
                                <p
                                    style={{
                                        color: "#02113799"
                                    }}
                                >
                                    {card.para}
                                </p>
                            </div>
                        ))
                    }
                </div>
            </div>
        </>
    )
}

export default IndividualTax;