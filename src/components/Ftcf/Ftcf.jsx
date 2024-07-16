import React from "react";
import "./Ftcf.css";
import { Link } from "react-router-dom";
import Navbar from "../commen/Navbar";
import { FaHome } from "react-icons/fa";
import { IoIosArrowForward } from "react-icons/io";
import Footer from "../commen/Footer";

const Ftcf = () => {
  return (
    <>
      <div className="service_container">
        <div className="service_bg">
          <Navbar />
          <div className="service_head_container">
            <div className="d-flex">
              <Link
                to="/"
                style={{
                  textDecoration: "none",
                  color: "#fff",
                }}
              >
                <div className="d-flex">
                  <FaHome
                    style={{
                      fontSize: "20px",
                      margin: "0 13px",
                    }}
                  />
                  <h6
                    style={{
                      margin: "0 6px",
                    }}
                  >
                    HOME
                  </h6>
                </div>
              </Link>
              <Link
                to="/ftcf"
                style={{
                  textDecoration: "none",
                  color: "#fff",
                }}
              >
                <div className="d-flex">
                  <IoIosArrowForward
                    style={{
                      fontSize: "18px",
                      margin: "0 13px",
                    }}
                  />
                  <h6>FREE TAX CLINIC FORM</h6>
                </div>
              </Link>
            </div>
            <h1>Free tax clinic form</h1>
          </div>
        </div>
      </div>

      <div className=" py-5 form-container container" style={{ width: "60%" }}>
        <form className=" d-flex flex-column justify-content-center" style={{ fontSize:'20px' }}>
          <div className="mb-3">
            <label for="exampleInputEmail1" className="form-label">
              Name
            </label>
            <input type="text" className="form-control" required />
            <div id="emailHelp" className="form-text">
              (as Per CRA / service canada)
            </div>
          </div>

          <div className="mb-3">
            <label for="exampleInputEmail1" className="form-label">
              Email
            </label>
            <input type="email" className="form-control" required />
            <div id="emailHelp" className="form-text">
              {/* (We'll never share your email with anyone else) */}
            </div>
          </div>

          <div className="mb-3">
            <label for="exampleInputEmail1" className="form-label">
              DOB
            </label>
            <input type="text" className="form-control" required />
            <div id="emailHelp" className="form-text">
              (DD/MM/YYYY).
            </div>
          </div>

          <div className="mb-3">
            <label for="exampleInputEmail1" className="form-label">
              Marital Status
            </label>
            <input type="text" className="form-control" required />
            <div id="emailHelp" className="form-text">
              (Submit seperate form for spouse)
            </div>
          </div>

          <div className="mb-3">
            <label for="exampleInputEmail1" className="form-label">
              Date of Entry to Canada
            </label>
            <input type="text" className="form-control" required />
            <div id="emailHelp" className="form-text">
              (DD/MM/YYYY)
            </div>
          </div>

          <div className="mb-3">
            <label for="exampleInputEmail1" className="form-label">
              Status in Canada
            </label>
            <input type="text" className="form-control" required />
            <div id="emailHelp" className="form-text">
              (WP/PR/Citizenship)
            </div>
          </div>

          <div className="mb-3">
            <label for="exampleInputEmail1" className="form-label">
              Address
            </label>
            <input type="text" className="form-control" required />
            <div id="emailHelp" className="form-text">
              (Street no & name, city, portal code)
            </div>
          </div>

          <div className="mb-3">
            <label for="exampleInputEmail1" className="form-label">
              Phone
            </label>
            <input type="number" className="form-control" required />
          </div>

          <div class="mb-3">
            <label for="exampleFormControlTextarea1" class="form-label">
              Medical Expenses
            </label>
            <textarea
              class="form-control"
              id="exampleFormControlTextarea1"
              rows="5"
              required
            ></textarea>
            <div id="emailHelp" className="form-text">
              (Yearly with date, clinic/doctor name and address)
            </div>
          </div>

          <div class="mb-3">
            <label for="exampleFormControlTextarea1" class="form-label">
              Children Details
            </label>
            <textarea
              class="form-control"
              id="exampleFormControlTextarea1"
              rows="5"
              required
            ></textarea>
            <div id="emailHelp" className="form-text">
              (Fullname, DoB, SIN if possible)
            </div>
          </div>

          <div class="mb-3">
            <label for="formFileMultiple" class="form-label">
            Attach T4/T5007
            </label>
            <input
            required
              class="form-control"
              type="file"
              id="formFileMultiple"
              multiple
            />
          </div>

          <div class="mb-3">
            <label for="exampleFormControlTextarea1" class="form-label">
              Other Notes
            </label>
            <textarea
              class="form-control"
              id="exampleFormControlTextarea1"
              rows="5"
              required
            ></textarea>
            <div id="emailHelp" className="form-text">
              (Include tax year from 2013 onwords)
            </div>
          </div>

          <button type="submit" className="btn btn-primary">
            Send
          </button>
        </form>
      </div>
      <Footer />
    </>
  );
};

export default Ftcf;
