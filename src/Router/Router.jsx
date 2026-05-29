import React from 'react';
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
import DraftTaxDocHandoffDashboard from '../Pages/DraftTaxDocHandoffDashboard';
import CustomerTaxPortalPage from '../Pages/CustomerTaxPortalPage';
import ScrollToTop from '../components/Common/ScrollToTop';

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
                    <Route path='/customerData' element={<PersonalTaxDataPage />} />
                    <Route path='/cvitp' element={<CvitpPage />} />
                    <Route path='/corporateData' element={<CorporateTaxDataPage />} />
                    <Route path='/draftDoc-handoff' element={<DraftTaxDocHandoffDashboard />} />
                    <Route path='/review-tax/:token' element={<CustomerTaxPortalPage />} />
                    <Route path='/blog' element={<BlogPage />} />
                    <Route path='/faq' element={<FaqPage />} />
                    <Route path='/blogdetails/:id' element={<BlogDetails />} />
                </Routes>
            </BrowserRouter>
        </>
    )
}

export default Router;