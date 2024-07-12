import React from 'react';
import Banner from './Banner';
import Footer from '../commen/Footer';
import TaxServices from '../Services/TaxServices';
import About_us from '../Home/About_us.jsx';
import Map_form from '../Home/Map_form.jsx';

const Home = () => {
    return (
        <>
            <Banner />
            <About_us/>
            <TaxServices/>
            <Map_form/>
            <Footer />
        </>
    )
}

export default Home;