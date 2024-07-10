import React from 'react';
import { Link } from 'react-router-dom';
import '../commen/Common.css'
import Logo from '../../Assets/obs.png'

const Navbar = () => {

    return (
        <>
            <div className="d-flex w-100 py-2  position-absolute">
                <nav className="navbar navbar-expand-lg navbar-light w-100 nav_bg" style={{background:'#fff', height:'100px'}}>
                    <div className="container-fluid d-flex justify-content-between navbar_tab_container m-0 p-0">
                        
                        <Link className="navbar-brand" to="/">
                            <img src={Logo} className=" align-text-top" alt='OBS_logo'
                             style={
                                {
                                    width:'180px',
                                    height:'80px'
                                }
                            }/>
                        </Link>
                        <button className="navbar-toggler" style={{color:'white',border:'none'}} type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                            <span className="navbar-toggler-icon" style={{color:'red'}}></span>
                        </button>
                        <div className="collapse navbar-collapse justify-content-center nav_container " id="navbarNav" >
                            <ul className="navbar-nav gap-5" >
                                <li className="nav-item">
                                    <Link className="nav-link " to="/">Home</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/about">About</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/service">Services</Link>
                                </li>
                                
                                <li className="nav-item">
                                    <Link className="nav-link" to="/contact" >Contact</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/blog" >Blog</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/faq" >FAQ</Link>
                                </li>
                            </ul>
                           
                        </div>
                    </div>
                </nav>
            </div>
        </>
    )
}

export default Navbar;