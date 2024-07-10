import React from "react";
import { FaHome } from "react-icons/fa";
import { IoIosArrowForward } from "react-icons/io";
import { Link } from "react-router-dom";
import Navbar from "../commen/Navbar.jsx";
import "../Blog/Blog.css";

const Blog = () => {
  return (
    <>
      <div className="serviceDetail_container">
        <div className="serviceDetail_bg">
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
            <div className="blog_head_item col-12 col-md-10 col-lg-6">
              <h6
                className="text-center"
                style={{ color: "#4A6EC9", textTransform: "uppercase" }}
              >
                blog
              </h6>
              <h2 className="text-center">Latest Blog Post</h2>
              <p className="text-center blog_para pt-3 ">
                Aenean haretra quam placerat adipiscing penatibus aliquam
                adipiscing gravida elementum aliquet eget senectus felis enim
                diam molestie.
              </p>
            </div>
          </div>
          <div class="container py-5">
              <div
                class="row align-items-center "
                style={{ background: "#fff" }}
              >
                <div class="col-md-6">
                  <img
                    src="office-work.jpg"
                    class="img-fluid"
                    alt="Office Work"
                  />
                </div>
                <div class="col-md-6">
                  <div class="content">
                    <h2>Quis Pellentesque Sed Penatibus Eges</h2>
                    <p class="date">October 21, 2021 No Comments</p>
                    <p>
                      Aenean harerta quam placerat adipiscing penatibus
                      adipiscing gravida elementum aliquet eget senectus felis
                      enim diam. Bibendum leo, sapien, nisl bibendum. Ultricies
                      urna ultricies risus, at.
                    </p>
                    <a href="#" class="read-more">
                      Read More »
                    </a>
                  </div>
                </div>
              </div>
            </div>
        </div>
      </div>
    </>
  );
};

export default Blog;
