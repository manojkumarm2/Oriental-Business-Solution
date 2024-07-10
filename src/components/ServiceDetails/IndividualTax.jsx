import React from 'react';
// import Img from "../../Assets/service-det-sect.jpg";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";

const IndividualTax = ({title,description,img}) => {

    const button = {
        width: "180px",
        padding: "16px 0",
        color: "black",
        background: "#FFB341",
        border: "none",
        fontWeight: 700
    }

    const IndividualCard = [
        { id: 1, title: "ASSET PROTECTION", para: "Gravida vulputate aliquet tem sitam neque sed pretium non urna sed etid aenean." },
        { id: 2, title: "TAX PREPARATION", para: "Gravida vulputate aliquet tem sitam neque sed pretium non urna sed etid aenean." },
        { id: 3, title: "GLOBAL FAMILIES", para: "Gravida vulputate aliquet tem sitam neque sed pretium non urna sed etid aenean." },
        { id: 4, title: "ESTATE CONSULTING", para: "Gravida vulputate aliquet tem sitam neque sed pretium non urna sed etid aenean." },
    ]

    return (
        <>
            <div className="container-lg py-1 py-md-5">
                <div className="row justify-content-center align-items-center py-5">
                    <div className="col-12 col-md-5 individuval_img_Container" style={{display:"flex",alignItems:"center"}}>
                        <img src={img} alt="" width="100%" height="100%" />
                    </div>
                    <div className="col-12 col-md-5 mt-4 d-flex flex-column justify-content-center">
                        <h1 className='pb-3'>{title}</h1>
                        <p className='py-2' style={{color:"rgba(2, 17, 55, 0.6)"}}>Gravida vulputate aliquet tempor sit.
                            Neque sed pretium non urna sed etid aenean haretra quam placerat adipiscing penatibus aliquam adipiscing gravida elementum aliquet eget senectus
                            felis enim diam molestie.
                        </p>
                        <p>“ Neque sed pretium non urna sed etid aenean haretra
                            quam placerat adipiscing penatibus “
                        </p>
                        <p className='py-2' style={{color:"rgba(2, 17, 55, 0.6)"}}>Gravida vulputate aliquet tempor sit.
                            Neque sed pretium non urna sed etid aenean haretra quam placerat adipiscing penatibus aliquam adipiscing gravida elementum aliquet eget senectus
                            felis enim diam molestie.
                        </p>
                        <button style={button} className='individula_btn'>Get Started Now <MdOutlineKeyboardArrowRight /></button>
                    </div>
                </div>
            </div>
            <div className="container-lg py-5">
                <div className="row">
                    {
                        IndividualCard.map((card)=>(
                            <div className="col-12 col-md-6 col-lg-3" key={card.id}>
                                <p></p>
                                <h6>{card.title}</h6>
                                <p>{card.para}</p>
                            </div>
                        ))
                    }
                </div>
            </div>
        </>
    )
}

export default IndividualTax;