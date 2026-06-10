import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from '../Pages/HomePage';
import AboutPage from '../Pages/AboutPage';
import ServicesPage from '../Pages/ServicesPage';
import ContactPage from '../Pages/ContactPage';
import BlogPage from '../Pages/BlogPage';
import FaqPage from '../Pages/FaqPage';
import ServiceDetailsPages from '../Pages/ServiceDetailsPages';
import BlogDetails from "../components/BlogDetails/BlogDetails";
import CvitpPage from '../Pages/CvitpPage';
import FtcfPage from '../Pages/FtcfPage';
import PersonalTaxDataPage from '../Pages/PersonalTaxDataPage';
import CorporateTaxDataPage from '../Pages/CorporateTaxDataPage';
import ESignRequestPage from '../Pages/ESignRequestPage';
import CustomerTaxPortalPage from '../Pages/CustomerTaxPortalPage';
import FaxPage from '../Pages/FaxPage';
import FaxDashboard from '../components/Fax/FaxDashboard';
import PublicSendFaxPage from '../Pages/PublicSendFaxPage';
import ScrollToTop from '../components/Common/ScrollToTop';

const RedirectExternal = ({ to }) => {
    useEffect(() => {
        const url = `https://myapp.orientalbiz.ca/${to}`;
        window.location.replace(url);
    }, [to]);
    return null;
};

const Router = () => {
    return (
        <>
            <BrowserRouter>
                <ScrollToTop />
                <Routes>
                    <Route path='/' element={<HomePage />} />
                    <Route path='/about' element={<AboutPage />} />
                    <Route path='/service' element={<ServicesPage />} />
                    <Route path='/servicedetails/:id' element={<ServiceDetailsPages />} />
                    <Route path='/contact' element={<ContactPage />} />
                    <Route path='/free-tax-clinic-form' element={<FtcfPage />} />
                    <Route path='/myapp-landing' element={<RedirectExternal to="/landing"/>} />
                    <Route path='/cvitp' element={<RedirectExternal to="/cvitp" />} />
                    <Route path='/corporateData' element={<RedirectExternal to="/corporateData" />} />
                    <Route path='/esign-request' element={<RedirectExternal to="/esign-request" />} />
                    <Route path='/review-tax/:token' element={<RedirectExternal to="/review-tax/:token" />} />
                    <Route path='/send-fax/:token' element={<RedirectExternal to="/send-fax/:token" />} />
                    <Route path='/send-fax' element={<RedirectExternal to="/send-fax" />} />
                    <Route path='/fax-dashboard' element={<RedirectExternal to="/fax-dashboard" />} />
                    <Route path='/blog' element={<BlogPage />} />
                    <Route path='/faq' element={<FaqPage />} />
                    <Route path='/blogdetails/:id' element={<BlogDetails />} />
                </Routes>
            </BrowserRouter>
        </>
    )
}

export default Router;