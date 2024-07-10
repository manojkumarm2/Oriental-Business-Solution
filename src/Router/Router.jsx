import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from '../Pages/HomePage';
import AboutPage from '../Pages/AboutPage';
import ServicesPage from '../Pages/ServicesPage';
import ContactPage from '../Pages/ContactPage';
import BlogPage from '../Pages/BlogPage';
import FaqPage from '../Pages/FaqPage';
import ServiceDetailsPages from '../Pages/ServiceDetailsPages';

const Router = () => {
    return (
        <>
            <BrowserRouter>
                <Routes>
                    <Route path='/' element={<HomePage />} />
                    <Route path='/about' element={<AboutPage />} />
                    <Route path='/service' element={<ServicesPage />} />
                    <Route path='/servicedetails/:id' element={<ServiceDetailsPages />} />
                    <Route path='/contact' element={<ContactPage />} />
                    <Route path='/blog' element={<BlogPage />} />
                    <Route path='/faq' element={<FaqPage />} />
                </Routes>
            </BrowserRouter>
        </>
    )
}

export default Router;