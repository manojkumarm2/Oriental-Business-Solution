import React from 'react';
import Banner from './Banner';
import Footer from '../Common/Footer.jsx';
import TaxServices from '../Services/TaxServices';
import AboutUs from '../Home/About_us.jsx';
import MapForm from '../Home/Map_form.jsx';

const Home = () => {
    return (
        <>
            <Banner />
            <AboutUs/>
            <TaxServices/>
            <MapForm/>
            <Footer />
        </>
    )
}

export default Home;