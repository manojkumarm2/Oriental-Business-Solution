import React from "react";
import { useEffect } from 'react';
import { FaHome } from "react-icons/fa";
import { IoIosArrowForward } from "react-icons/io";
import { Link } from "react-router-dom";
import Navbar from "../Common/Navbar.jsx";
import "../Blog/Blog.css";
// import Blog1 from '../../Assets/blog/blog-1.jpg'
import BlogPost from "./BlogPost.jsx";
import Footer from '../Common/Footer.jsx'
import AOS from 'aos';
import 'aos/dist/aos.css';

const Blog = () => {

  useEffect(() => {
    AOS.init(({ duration: 2000 }))
  }, [])

  return (
    <>
      <div className="blog_container">
        <div className="blog_bgs">
          <Navbar />
          <div className="serviceDetail_head_container">
            <div className="d-flex">
              <Link to="/" style={{ textDecoration: "none", color: "#fff" }}>
                <div className="d-flex">
                  <FaHome style={{ fontSize: "20px", margin: "0 13px" }} />
                  <h6 style={{ margin: "0 6px" }}>HOME</h6>
                </div>
              </Link>
              <Link
                to="/blog"
                style={{ textDecoration: "none", color: "#fff" }}
              >
                <div className="d-flex">
                  <IoIosArrowForward
                    style={{ fontSize: "18px", margin: "0 13px" }}
                  />
                  <h6 style={{ textTransform: "uppercase" }}>blog</h6>
                </div>
              </Link>
            </div>
            <h1>Blog</h1>
          </div>
        </div>
      </div>

      <div className="blog">
        <div className="blog_bg py-5">
          <div className="blog_head_container py-5 d-flex justify-content-center">
            <div className="blog_head_item col-12 col-md-10 col-lg-6" data-aos="fade-up">
              <h6
                className="text-center"
                style={{ color: "#4A6EC9", textTransform: "uppercase" }}
              >
                blog
              </h6>
              <h2 className="text-center" >Latest Blog Post</h2>
              <p className="text-center blog_para pt-3 ">
                Explore expert insights and tips on tax consulting and business services.
                Stay informed and make smart financial decisions with our regular updates!
              </p>
            </div>
          </div>
          <div className="container py-5 " >
            <div
              className="row align-items-between "
              style={{ background: "#fff" }}>

            </div>
            <BlogPost />
          </div>
        </div>

      </div>
      <Footer />
    </>
  );
};

export default Blog;
